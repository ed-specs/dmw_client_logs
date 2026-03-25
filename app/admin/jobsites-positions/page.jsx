import { createServerSupabase } from "../../lib/supabaseServer";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

import AdminNavbar from "../components/AdminNavbar";
import AdminJobsitesPositions from "../components/AdminJobsitesPositions";

export default async function AdminJobsitesPositionsPage() {
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

  const { data: clientLogs } = await supabase
    .from("client_logs")
    .select("id, date, province, jobsite, position, sex")
    .order("date", { ascending: false });

  const { data: jobsitesData } = await supabase.from("jobsites").select("name");
  const { data: positionsData } = await supabase.from("positions").select("name");
  const dbJobsites = jobsitesData?.map((j) => j.name) || [];
  const dbPositions = positionsData?.map((p) => p.name) || [];

  console.log("AdminJobsitePosition Check:", {
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

  return (
    <main className="flex h-dvh min-h-0 overflow-hidden bg-gray-50">
      <div className="h-dvh shrink-0">
        <AdminNavbar />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        <AdminJobsitesPositions
          initialLogs={clientLogs || []}
          dbJobsites={dbJobsites}
          dbPositions={dbPositions}
        />
      </div>
    </main>
  );
}
