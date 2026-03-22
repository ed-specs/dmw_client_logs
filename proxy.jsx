import { createMiddlewareSupabase } from "./app/lib/supabaseMiddleware";

export async function proxy(req) {
  const { supabase, res } = createMiddlewareSupabase(req);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = req.nextUrl.pathname;

  // Allow unauthenticated users only on the root (login) page
  if (!session && pathname !== '/') {
    return Response.redirect(new URL('/', req.url));
  }

  // If a session exists, check role for route protection
  if (session) {
    // Fetch profile role 
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const role = profile?.role;

    // Prevent logged-in users from staying on the login page
    if (pathname === '/') {
      if (role === 'admin') {
        return Response.redirect(new URL('/admin/dashboard', req.url));
      } else {
        return Response.redirect(new URL('/dashboard', req.url));
      }
    }

    // Admins must stay within /admin routes
    if (role === 'admin' && !pathname.startsWith('/admin')) {
      return Response.redirect(new URL('/admin/dashboard', req.url));
    }
    
    // Clients must stay out of /admin routes
    if (role !== 'admin' && pathname.startsWith('/admin')) {
      return Response.redirect(new URL('/dashboard', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (e.g., logos)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
