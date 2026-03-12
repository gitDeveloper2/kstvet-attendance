import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getPublicEnv } from '@/lib/env';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const pathname = req.nextUrl.pathname;

  // Protected routes
  const protectedRoutes = ['/dashboard', '/trainer', '/trainee', '/reports', '/admin'];
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  // If Edge runtime can't reach Supabase, avoid calling auth APIs on public/auth routes.
  // We only need middleware enforcement on protected pages.
  if (!isProtectedRoute) {
    return res;
  }

  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
  
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          res.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // NOTE: We intentionally use getSession() here.
  // getUser() requires a network call in the Edge runtime and may fail (e.g. DNS/proxy issues),
  // which breaks navigation. getSession() is cookie-based and stable for routing.
  let authUser: any = null;
  let sessionError: any = null;

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    sessionError = error;
    authUser = session?.user ?? null;
  } catch (e: any) {
    sessionError = e;
    authUser = null;
  }

  if (sessionError) {
    console.log('[middleware] getSession error', {
      path: req.nextUrl.pathname,
      error: sessionError?.message ?? String(sessionError),
    });
  }

  const isAdminRoute = pathname.startsWith('/admin');
  const isTrainerRoute = pathname.startsWith('/trainer') || pathname.startsWith('/reports');
  const isTraineeRoute = pathname.startsWith('/trainee');

  if (isProtectedRoute && !authUser) {
    console.log('[middleware] redirect unauthenticated -> /login', {
      path: pathname,
    });
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Role enforcement. Prefer role from public.users (authoritative), fall back to auth metadata.
  let role: string | undefined = (authUser?.user_metadata as any)?.role;
  if (authUser?.id) {
    try {
      const { data: profile, error } = await (supabase as any)
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .maybeSingle();

      if (!error && profile?.role) {
        role = profile.role as string;
      }
    } catch {
      // ignore and use metadata fallback
    }
  }

  if (isAdminRoute && role !== 'admin') {
    console.log('[middleware] redirect non-admin away from /admin', {
      path: pathname,
      userId: authUser.id,
      role: role ?? 'unknown',
    });
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if (isTrainerRoute && role !== 'trainer' && role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if (isTraineeRoute && role !== 'trainee' && role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
