import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getPublicEnv } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function requireRole(
  request: NextRequest,
  role: 'admin' | 'trainer' | 'trainee'
): Promise<
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse }
> {
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
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  let actual = (user.user_metadata as any)?.role as string | undefined;

  // If the cookie/session user metadata is missing/stale, do an authoritative lookup.
  if (!actual) {
    const { data, error: adminErr } = await supabaseAdmin.auth.admin.getUserById(user.id);
    if (!adminErr) {
      actual = (data?.user?.user_metadata as any)?.role as string | undefined;
    }
  }

  // If Auth metadata role is still missing or doesn't match, fall back to the app profile role.
  // This is useful when user_metadata.role wasn't set/updated, but the application role exists
  // in the public.users table.
  if (!actual || actual !== role) {
    const { data: profile, error: profileErr } = await (supabaseAdmin as any)
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const typedProfile = profile as any;
    if (!profileErr && typedProfile?.role) {
      actual = typedProfile.role as string;
    }
  }

  if (actual !== role) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { ok: true, userId: user.id };
}
