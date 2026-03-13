import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          // In server components, you cannot set cookies directly.
          // This is a no‑op; session refreshing will be handled by middleware.
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Ignore – the call came from a Server Component.
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // Ignore
          }
        },
      },
    },
  );
}
