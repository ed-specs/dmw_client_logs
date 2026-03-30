import { createServerSupabase } from "../../lib/supabaseServer";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

import AdminNavbar from "../components/AdminNavbar";
import AdminServices from "../components/AdminServices";
import {
  getProfilesNameMapCached,
} from "../../lib/cachedReads";
import { unstable_cache } from "next/cache";

export default async function AdminServicesPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Fetch user's role
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Initialize Admin Client (service role) to bypass any RLS on profiles lookup.
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  console.log("AdminServicesPage Check:", {
    user_id: user?.id,
    profile,
    error,
  });

  // If profile is missing or role is not admin → send to normal dashboard
  if (!profile || profile.role !== "ADMIN") {
    console.log("Redirecting to login because profile is not admin");
    redirect("/"); // or "/login" if you prefer
    return null; // Prevents Admin settings from erroneously rendering if redirect throws incorrectly
  }

  const getAdminServicesLogsCached = unstable_cache(
    async () => {
      const { data } = await supabaseAdmin
        .from("client_logs")
        .select("id,date,province,purpose,created_by")
        .order("date", { ascending: false });
      return data || [];
    },
    ["admin-services-logs-v1"],
    { revalidate: 30, tags: ["client_logs"] },
  );

  const [initialLogs, profilesResult] = await Promise.all([
    getAdminServicesLogsCached(),
    getProfilesNameMapCached(),
  ]);

  const recorderNameById = profilesResult.recorderNameById || {};

  return (
    <main className="flex h-dvh min-h-0 overflow-hidden bg-gray-50">
      <div className="h-dvh shrink-0">
        <AdminNavbar />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        <AdminServices
          initialLogs={initialLogs || []}
          recorderNameById={recorderNameById}
        />
      </div>
    </main>
  );
}
