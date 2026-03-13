import { createMiddlewareSupabase } from './app/lib/supabaseMiddleware'

export async function proxy(req) {
  const { supabase, res } = createMiddlewareSupabase(req)

  const { data: { session } } = await supabase.auth.getSession()

  // Protected routes check
  const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard') ||
                           req.nextUrl.pathname.startsWith('/admin')

  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', req.url)
    return Response.redirect(redirectUrl)
  }

  // If logged in and on login page, redirect to dashboard
  if (req.nextUrl.pathname === '/login' && session) {
    return Response.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}