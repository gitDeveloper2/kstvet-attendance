import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getPublicEnv } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function requireAdmin(request: NextRequest): Promise<
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
    data: { session },
  } = await supabase.auth.getSession();

  const authUser = session?.user ?? null;
  if (!authUser) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const roleFromSession = (authUser.user_metadata as any)?.role as string | undefined;
  if (roleFromSession === 'admin') {
    return { ok: true, userId: authUser.id };
  }

  // If role is missing/stale in cookie session, verify via Admin API (authoritative)
  const { data: authLookup, error: authLookupError } = await supabaseAdmin.auth.admin.getUserById(
    authUser.id
  );

  if (authLookupError) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Forbidden (auth lookup failed): ${authLookupError.message}` },
        { status: 403 }
      ),
    };
  }

  const verifiedRole = (authLookup.user?.user_metadata as any)?.role as string | undefined;
  if (verifiedRole !== 'admin') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { ok: true, userId: authUser.id };
}
