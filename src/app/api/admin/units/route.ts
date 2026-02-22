import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.response;

  const { data, error } = await supabaseAdmin
    .from('units')
    .select('*')
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
    const { code, name } = body as { code?: string; name?: string };

    if (!code || !name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: code, name' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('units')
      .insert({ code, name, is_active: true } as any)
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
