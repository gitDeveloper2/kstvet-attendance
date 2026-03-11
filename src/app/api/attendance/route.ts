import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireRole } from '@/lib/roleAuth';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    const gate = await requireRole(request, 'trainer');
    if (!gate.ok) return gate.response;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const sessionId = searchParams.get('session_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    let query = supabaseAdmin
      .from('attendance')
      .select(`
        *,
        user:users(*),
        session:sessions!inner(*, location:locations(*), unit:units(*), venue:venues(*))
      `)
      .eq('session.trainer_id', gate.userId);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    if (dateFrom) {
      query = query.gte('timestamp', dateFrom);
    }

    if (dateTo) {
      query = query.lte('timestamp', dateTo);
    }

    const { data, error } = await query.order('timestamp', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
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
      const { error } = await (supabaseAdmin as any).from('attendance').delete().eq('id', id);
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    const traineeGate = await requireRole(request, 'trainee');
    if (traineeGate.ok) {
      const { data: row, error: rowError } = await supabaseAdmin
        .from('attendance')
        .select('id, user_id')
        .eq('id', id)
        .eq('user_id', traineeGate.userId)
        .maybeSingle();

      if (rowError) {
        return NextResponse.json({ success: false, error: rowError.message }, { status: 500 });
      }

      if (!row) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }

      const { error } = await (supabaseAdmin as any).from('attendance').delete().eq('id', id);
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const gate = await requireRole(request, 'trainee');
  if (!gate.ok) return gate.response;

  try {
    const body = await request.json();
    const {
      session_id,
      qr_token,
      token,
      latitude,
      longitude,
    } = body as {
      session_id?: string;
      qr_token?: string;
      token?: string;
      latitude?: number;
      longitude?: number;
    };

    const effectiveToken = (qr_token ?? token)?.trim();
    if (!effectiveToken) {
      return NextResponse.json({ success: false, error: 'Missing qr_token' }, { status: 400 });
    }

    // Verify QR token and get session details
    let sessionQuery = supabaseAdmin
      .from('sessions')
      .select(
        `
        *,
        location:locations(*)
      `.trim()
      )
      .eq('qr_token', effectiveToken)
      .eq('is_active', true);

    if (session_id) {
      sessionQuery = sessionQuery.eq('id', session_id);
    }

    const { data: session, error: sessionError } = await sessionQuery.single();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Invalid or inactive session' },
        { status: 400 }
      );
    }

    // Enforce expiry based on session date + end_time
    try {
      const s: any = session;
      if (s?.date && s?.end_time) {
        const endAt = new Date(`${s.date}T${s.end_time}`);
        if (!Number.isNaN(endAt.getTime()) && Date.now() > endAt.getTime()) {
          await (supabaseAdmin as any)
            .from('sessions')
            .update({ is_active: false } as any)
            .eq('id', s.id);

          return NextResponse.json(
            { success: false, error: 'Invalid or inactive session' },
            { status: 400 }
          );
        }
      }
    } catch {
      // ignore expiry update errors
    }

    const user_id = gate.userId;
    const sessionId = (session as any).id as string;

    // Check if user has already marked attendance for this session
    const { data: existingAttendance } = await supabaseAdmin
      .from('attendance')
      .select('id')
      .eq('user_id', user_id)
      .eq('session_id', sessionId)
      .maybeSingle();

    if (existingAttendance) {
      return NextResponse.json(
        { success: false, error: 'Attendance already marked for this session' },
        { status: 400 }
      );
    }

    const sessionRecord: any = session;

    // Verify GPS location using Supabase function (only when session has a configured location)
    if (sessionRecord.location_id) {
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return NextResponse.json(
          { success: false, error: 'Location is required to mark attendance for this session' },
          { status: 400 }
        );
      }
      const { data: isWithinRadius, error: locationError } = await supabaseAdmin
        .rpc('is_within_location_radius' as any, {
          user_lat: latitude,
          user_lon: longitude,
          location_id: sessionRecord.location_id,
        } as any);

      if (locationError) {
        return NextResponse.json(
          { success: false, error: 'Error verifying location' },
          { status: 500 }
        );
      }

      if (!isWithinRadius) {
        return NextResponse.json(
          { success: false, error: 'You are not within the required location radius' },
          { status: 400 }
        );
      }
    }

    // Mark attendance
    const { data, error } = await supabaseAdmin
      .from('attendance')
      .insert({
        user_id,
        session_id: sessionId,
        latitude: latitude ?? 0,
        longitude: longitude ?? 0,
        verified: true,
      } as any)
      .select(`
        *,
        user:users(*),
        session:sessions(*)
      `)
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
