import { createServerSupabase } from "../../lib/supabaseServer";
import { redirect } from "next/navigation";

import UserNavbar from "../components/UserNavbar";
import ClientsLogs from "../components/ClientsLogs";

export default async function ClientsLogsPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Fetch user's role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role || "UNKNOWN";

  const { data: clientLogs } = await supabase
    .from("client_logs")
    .select("*")
    .or(`province.eq.${profile.role},created_by.eq.${user.id}`)
    .order("date", { ascending: false });

  // Fetch distinct jobsites and positions from isolated tables for Table Filters
  const { data: jobsitesData } = await supabase.from("jobsites").select("name");
  const { data: positionsData } = await supabase
    .from("positions")
    .select("name");

  const dbJobsites = jobsitesData?.map((j) => j.name) || [];
  const dbPositions = positionsData?.map((p) => p.name) || [];

  return (
    <main className="flex h-dvh min-h-0 overflow-hidden bg-gray-50">
      <div className="h-dvh shrink-0">
        <UserNavbar />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        <ClientsLogs
          initialData={clientLogs || []}
          userRole={profile.role}
          dbJobsites={dbJobsites}
          dbPositions={dbPositions}
        />
      </div>
    </main>
  );
}
