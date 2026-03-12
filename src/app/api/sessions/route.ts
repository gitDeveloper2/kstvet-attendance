import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireRole } from '@/lib/roleAuth';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trainerId = searchParams.get('trainer_id');
    const date = searchParams.get('date');

    // Auto-close expired sessions (best-effort)
    try {
      let expireQuery = supabaseAdmin
        .from('sessions')
        .select('id, date, end_time')
        .eq('is_active', true);

      if (trainerId) {
        expireQuery = expireQuery.eq('trainer_id', trainerId);
      }

      const { data: activeSessions, error: activeErr } = await expireQuery;
      if (!activeErr && Array.isArray(activeSessions) && activeSessions.length > 0) {
        const now = Date.now();
        const expiredIds: string[] = [];

        for (const s of activeSessions as any[]) {
          if (!s?.date || !s?.end_time) continue;
          const endAt = new Date(`${s.date}T${s.end_time}`);
          if (!Number.isNaN(endAt.getTime()) && now > endAt.getTime()) {
            expiredIds.push(s.id);
          }
        }

        if (expiredIds.length) {
          await (supabaseAdmin as any).from('sessions').update({ is_active: false } as any).in('id', expiredIds);
        }
      }
    } catch {
      // ignore expiry errors
    }

    let query = supabaseAdmin
      .from('sessions')
      .select(`
        *,
        location:locations(*),
        unit:units(*),
        venue:venues(*),
        trainer:users(name, email)
      `);

    if (trainerId) {
      query = query.eq('trainer_id', trainerId);
    }

    if (date) {
      query = query.eq('date', date);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    }

    const adminGate = await requireAdmin(request);
    if (adminGate.ok) {
      const { error: attendanceError } = await (supabaseAdmin as any)
        .from('attendance')
        .delete()
        .eq('session_id', id);

      if (attendanceError) {
        return NextResponse.json({ success: false, error: attendanceError.message }, { status: 500 });
      }

      const { error: sessionError } = await (supabaseAdmin as any).from('sessions').delete().eq('id', id);
      if (sessionError) {
        return NextResponse.json({ success: false, error: sessionError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    const trainerGate = await requireRole(request, 'trainer');
    if (!trainerGate.ok) return trainerGate.response;

    const { data: sessionRow, error: sessionRowError } = await supabaseAdmin
      .from('sessions')
      .select('id, trainer_id')
      .eq('id', id)
      .maybeSingle();

    if (sessionRowError) {
      return NextResponse.json({ success: false, error: sessionRowError.message }, { status: 500 });
    }

    if (!sessionRow || (sessionRow as any).trainer_id !== trainerGate.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { error: attendanceError } = await (supabaseAdmin as any)
      .from('attendance')
      .delete()
      .eq('session_id', id);

    if (attendanceError) {
      return NextResponse.json({ success: false, error: attendanceError.message }, { status: 500 });
    }

    const { error: sessionError } = await (supabaseAdmin as any).from('sessions').delete().eq('id', id);
    if (sessionError) {
      return NextResponse.json({ success: false, error: sessionError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const gate = await requireRole(request, 'trainer');
  if (!gate.ok) return gate.response;

  try {
    const body = await request.json();
    const {
      unit_id,
      venue_id,
      description,
      date,
      start_time,
      end_time,
    } = body as {
      unit_id?: string;
      venue_id?: string | null;
      description?: string;
      date?: string;
      start_time?: string;
      end_time?: string;
    };

    if (!unit_id || !date || !start_time || !end_time) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: unit_id, date, start_time, end_time' },
        { status: 400 }
      );
    }

    const { data: unitRow, error: unitError } = await supabaseAdmin
      .from('units')
      .select('*')
      .eq('id', unit_id)
      .single();

    if (unitError || !unitRow) {
      return NextResponse.json(
        { success: false, error: 'Invalid unit' },
        { status: 400 }
      );
    }

    // Generate unique QR token
    const qrToken = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);

    const { data, error } = await (supabaseAdmin as any)
      .from('sessions')
      .insert({
        title: `${(unitRow as any).code} Lesson`,
        description: description ?? null,
        unit_id,
        venue_id: venue_id ?? null,
        trainer_id: gate.userId,
        date,
        start_time,
        end_time,
        qr_token: qrToken,
      } as any)
      .select(`
        *,
        unit:units(*),
        venue:venues(*),
        location:locations(*),
        trainer:users(name, email)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const inserted: any = data;

    // After lesson_number is auto-assigned by trigger, make the title predictable.
    if (inserted?.lesson_number) {
      const newTitle = `${(unitRow as any).code} Lesson ${inserted.lesson_number}`;

      const { data: updatedRow, error: updateError } = await (supabaseAdmin as any)
        .from('sessions')
        .update({ title: newTitle } as any)
        .eq('id', inserted.id)
        .select(`
          *,
          unit:units(*),
          venue:venues(*),
          location:locations(*),
          trainer:users(name, email)
        `)
        .single();

      if (!updateError && updatedRow) {
        return NextResponse.json({ success: true, data: updatedRow });
      }

      inserted.title = newTitle;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
