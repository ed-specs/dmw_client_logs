import { createMiddlewareSupabase } from "./app/lib/supabaseMiddleware";

export async function proxy(req) {
  const { supabase, res } = createMiddlewareSupabase(req);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  const pathname = req.nextUrl.pathname;

  // IMPORTANT: Set no-store headers so browser back button triggers this middleware again after logout.
  // This prevents the browser from showing a cached version of a protected page.
  res.headers.set("Cache-Control", "no-store, max-age=0");
  res.headers.set("x-middleware-cache", "no-cache");

  // Allow unauthenticated users only on the root (login) page.
  // This dynamically covers ALL new pages you add without needing to hardcode their names.
  if ((!user || authError) && pathname !== "/") {
    return Response.redirect(new URL("/", req.url));
  }

  // If the user is authenticated, check role for route protection
  if (user && !authError) {
    // Fetch profile role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;

    // Prevent logged-in users from staying on the login page
    if (pathname === "/") {
      if (role === "ADMIN") {
        return Response.redirect(new URL("/admin/dashboard", req.url));
      } else {
        return Response.redirect(new URL("/dashboard", req.url));
      }
    }

    // Admins must stay within /admin routes
    // (This automatically protects /admin/jobsites-positions without needing to name it)
    if (role === "ADMIN" && !pathname.startsWith("/admin")) {
      return Response.redirect(new URL("/admin/dashboard", req.url));
    }

    // Clients must stay out of /admin routes
    // (This automatically protects /jobsites-positions from admins, and stops clients from viewing /admin)
    if (role !== "ADMIN" && pathname.startsWith("/admin")) {
      return Response.redirect(new URL("/dashboard", req.url));
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
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
