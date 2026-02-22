import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');

  let query = supabaseAdmin.from('users').select('*').order('created_at', { ascending: false });

  if (role) {
    query = query.eq('role', role as any);
  }

  const { data, error } = await query;
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
    const {
      name,
      email,
      password,
      role,
    } = body as { name?: string; email?: string; password?: string; role?: 'trainer' | 'trainee' };

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, email, password, role' },
        { status: 400 }
      );
    }

    if (role !== 'trainer' && role !== 'trainee') {
      return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 });
    }

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role,
        name,
      },
    });

    if (createError || !created.user) {
      return NextResponse.json(
        { success: false, error: createError?.message ?? 'Failed to create user' },
        { status: 500 }
      );
    }

    const { error: upsertError } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          id: created.user.id,
          email,
          name,
          role,
        } as any,
        { onConflict: 'id' }
      );

    if (upsertError) {
      return NextResponse.json({ success: false, error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: created.user.id,
        email,
        name,
        role,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
