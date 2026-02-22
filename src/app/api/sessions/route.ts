import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireRole } from '@/lib/roleAuth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trainerId = searchParams.get('trainer_id');
    const date = searchParams.get('date');

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
