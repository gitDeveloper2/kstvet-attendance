import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireRole } from '@/lib/roleAuth';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, qr_token, latitude, longitude, user_id } = body;

    // Verify QR token and get session details
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select(`
        *,
        location:locations(*)
      `)
      .eq('qr_token', qr_token)
      .eq('id', session_id)
      .eq('is_active', true)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Invalid or inactive session' },
        { status: 400 }
      );
    }

    // Check if user has already marked attendance for this session
    const { data: existingAttendance } = await supabaseAdmin
      .from('attendance')
      .select('*')
      .eq('user_id', user_id)
      .eq('session_id', session_id)
      .single();

    if (existingAttendance) {
      return NextResponse.json(
        { error: 'Attendance already marked for this session' },
        { status: 400 }
      );
    }

    const sessionRecord: any = session;

    // Verify GPS location using Supabase function (only when session has a configured location)
    if (sessionRecord.location_id) {
      const { data: isWithinRadius, error: locationError } = await supabaseAdmin
        .rpc('is_within_location_radius' as any, {
          user_lat: latitude,
          user_lon: longitude,
          location_id: sessionRecord.location_id,
        } as any);

      if (locationError) {
        return NextResponse.json(
          { error: 'Error verifying location' },
          { status: 500 }
        );
      }

      if (!isWithinRadius) {
        return NextResponse.json(
          { error: 'You are not within the required location radius' },
          { status: 400 }
        );
      }
    }

    // Mark attendance
    const { data, error } = await supabaseAdmin
      .from('attendance')
      .insert({
        user_id,
        session_id,
        latitude,
        longitude,
        verified: true,
      } as any)
      .select(`
        *,
        user:users(*),
        session:sessions(*)
      `)
      .single();

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
