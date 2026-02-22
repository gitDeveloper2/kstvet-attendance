import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/roleAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  const gate = await requireRole(request, 'trainer');
  if (!gate.ok) return gate.response;

  const { data, error } = await supabaseAdmin
    .from('trainer_units')
    .select(`
      unit:units(*)
    `)
    .eq('trainer_id', gate.userId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const units = (data ?? [])
    .map((row: any) => row.unit)
    .filter(Boolean);

  return NextResponse.json({ success: true, data: units });
}
