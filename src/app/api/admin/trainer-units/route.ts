import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.response;

  const { data, error } = await supabaseAdmin
    .from('trainer_units')
    .select(`
      *,
      trainer:users(*),
      unit:units(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

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

export async function DELETE(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.response;

  try {
    const { searchParams } = new URL(request.url);
    const trainer_id = searchParams.get('trainer_id');
    const unit_id = searchParams.get('unit_id');

    if (!trainer_id || !unit_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: trainer_id, unit_id' },
        { status: 400 }
      );
    }

    const { error } = await (supabaseAdmin as any)
      .from('trainer_units')
      .delete()
      .eq('trainer_id', trainer_id)
      .eq('unit_id', unit_id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
