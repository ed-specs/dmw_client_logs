import { createServerSupabase } from "../../lib/supabaseServer";
import { redirect } from "next/navigation";

import UserNavbar from "../components/UserNavbar";
import UserJobsitesPositions from "../components/UserJobsitesPositions";

const USER_LOGS_SELECT = "id, date, province, jobsite, position, sex, created_by";

export default async function UserJobsitesPositionsPage() {
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

  if (!profile || profile.role === "ADMIN") {
    redirect("/");
  }

  const userRole = profile.role;

  const [{ data: byProvince }, { data: byCreator }] = await Promise.all([
    supabase.from("client_logs").select(USER_LOGS_SELECT).eq("province", userRole),
    supabase.from("client_logs").select(USER_LOGS_SELECT).eq("created_by", user.id),
  ]);

  const mergedById = new Map();
  for (const log of [...(byProvince || []), ...(byCreator || [])]) {
    mergedById.set(log.id, log);
  }
  const clientLogs = Array.from(mergedById.values()).sort((a, b) => {
    const da = String(a.date || "");
    const db = String(b.date || "");
    if (da !== db) return db.localeCompare(da);
    return String(b.id ?? "").localeCompare(String(a.id ?? ""));
  });

  const { data: jobsitesData } = await supabase.from("jobsites").select("name");
  const { data: positionsData } = await supabase.from("positions").select("name");
  const dbJobsites = jobsitesData?.map((j) => j.name) || [];
  const dbPositions = positionsData?.map((p) => p.name) || [];

  return (
    <main className="flex h-dvh min-h-0 overflow-hidden bg-gray-50">
      <div className="h-dvh shrink-0">
        <UserNavbar />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        <UserJobsitesPositions
          initialLogs={clientLogs || []}
          dbJobsites={dbJobsites}
          dbPositions={dbPositions}
          userRole={userRole}
        />
      </div>
    </main>
  );
}
