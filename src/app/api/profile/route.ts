import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, email, name, role } = body as {
      id?: string;
      email?: string;
      name?: string;
      role?: 'trainer' | 'trainee';
    };

    if (!id || !email || !name || !role) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: id, email, name, role' },
        { status: 400 }
      );
    }

    if (role !== 'trainer' && role !== 'trainee') {
      return NextResponse.json(
        { ok: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    const payload = {
      id,
      email,
      name,
      role,
    };

    console.log('[api/profile] upsert users', { id, email, role });
    const { error } = await supabaseAdmin
      .from('users')
      .upsert(payload as any, { onConflict: 'id' });

    if (error) {
      console.log('[api/profile] users upsert error', { id, error: error.message });
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    const { error: metaError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      user_metadata: {
        role,
        name,
      },
    });

    if (metaError) {
      console.log('[api/profile] auth updateUserById metadata error', {
        id,
        error: metaError.message,
      });
    }

    console.log('[api/profile] ok', { id });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.log('[api/profile] exception', { error: e?.message ?? 'Unknown error' });
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
