import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getPublicEnv } from '@/lib/env';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

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
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.log('[middleware] getSession error', {
      path: req.nextUrl.pathname,
      error: sessionError.message,
    });
  }

  const authUser = session?.user ?? null;
  const roleFromMetadata = (authUser?.user_metadata as any)?.role as string | undefined;

  // Protected routes
  const protectedRoutes = ['/dashboard', '/trainer', '/trainee', '/reports', '/admin'];
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );

  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');

  // Auth routes (redirect if already authenticated)
  const authRoutes = ['/login', '/signup'];
  const isAuthRoute = authRoutes.some(route => 
    req.nextUrl.pathname === route
  );

  if (isProtectedRoute && !authUser) {
    console.log('[middleware] redirect unauthenticated -> /login', {
      path: req.nextUrl.pathname,
    });
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isAdminRoute && authUser && roleFromMetadata && roleFromMetadata !== 'admin') {
    console.log('[middleware] redirect non-admin away from /admin', {
      path: req.nextUrl.pathname,
      userId: authUser.id,
      role: roleFromMetadata ?? 'unknown',
    });
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if (isAuthRoute && authUser) {
    const role = roleFromMetadata;
    console.log('[middleware] authenticated on auth route, redirecting', {
      path: req.nextUrl.pathname,
      userId: authUser.id,
      role: role ?? 'unknown',
    });

    if (role === 'trainer') {
      return NextResponse.redirect(new URL('/trainer', req.url));
    }

    if (role === 'trainee') {
      return NextResponse.redirect(new URL('/trainee', req.url));
    }

    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', req.url));
    }

    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
