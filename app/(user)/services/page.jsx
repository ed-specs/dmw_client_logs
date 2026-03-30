import { createServerSupabase } from "../../lib/supabaseServer";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

import UserNavbar from "../components/UserNavbar";
import AdminServices from "../../admin/components/AdminServices";
import { getProfilesNameMapCached, getUserServicesLogsCached } from "../../lib/cachedReads";

export default async function UserServicesPage() {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role || "UNKNOWN";

  const [initialLogs, profilesResult] = await Promise.all([
    getUserServicesLogsCached(userRole),
    getProfilesNameMapCached(),
  ]);

  const recorderNameById = profilesResult.recorderNameById || {};

  return (
    <main className="flex h-dvh min-h-0 overflow-hidden bg-gray-50">
      <div className="h-dvh shrink-0">
        <UserNavbar />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        <AdminServices
          variant="user"
          fixedProvince={userRole}
          initialLogs={initialLogs || []}
          recorderNameById={recorderNameById}
        />
      </div>
    </main>
  );
}

