import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

export async function POST(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.response;

  try {
    const body = await request.json();
    const { trainer_id, unit_id } = body as { trainer_id?: string; unit_id?: string };

    if (!trainer_id || !unit_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: trainer_id, unit_id' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('trainer_units')
      .insert({ trainer_id, unit_id } as any)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
