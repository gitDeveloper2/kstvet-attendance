import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getPublicEnv } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const { supabaseUrl, supabaseAnonKey } = getPublicEnv();

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set() {
          // no-op in route handlers
        },
        remove() {
          // no-op in route handlers
        },
      },
    });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const authUser = session?.user ?? null;
    if (!authUser) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const authLookup = await supabaseAdmin.auth.admin.getUserById(authUser.id);
    const meta = (authLookup.data?.user?.user_metadata ?? authUser.user_metadata ?? {}) as any;

    const metaRole = (meta?.role as string | undefined) ?? undefined;

    const { data: profile } = await (supabaseAdmin as any)
      .from('users')
      .select('id, email, name, role')
      .eq('id', authUser.id)
      .maybeSingle();

    const profileRole = (profile as any)?.role as string | undefined;

    let role: string | undefined = metaRole ?? profileRole;
    if (metaRole === 'admin' || profileRole === 'admin') {
      role = 'admin';
    } else if (profileRole) {
      role = profileRole;
    } else if (metaRole) {
      role = metaRole;
    }

    const name = ((profile as any)?.name ?? meta?.name ?? '') as string;

    return NextResponse.json({
      ok: true,
      user: {
        id: authUser.id,
        email: authUser.email ?? (profile as any)?.email ?? '',
        name,
        role: role ?? null,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
