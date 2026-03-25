import { createServerSupabase } from "../../lib/supabaseServer";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

import AdminNavbar from "../components/AdminNavbar";
import AdminClientsLogs from "../components/AdminClientsLogs";

const PROVINCE_ASSIGNEE_ROLES = [
  "ORIENTAL MINDORO",
  "OCCIDENTAL MINDORO",
  "MARINDUQUE",
  "ROMBLON",
  "PALAWAN",
];

export default async function AdminClientsLogsPage() {
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

  console.log("AdminClientsLogsPage Check:", {
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

  const { data: clientLogs } = await supabase
    .from("client_logs")
    .select("*")
    .order("date", { ascending: false });

  // Fetch distinct jobsites and positions from isolated tables for Table Filters
  const { data: jobsitesData } = await supabase.from("jobsites").select("name");
  const { data: positionsData } = await supabase
    .from("positions")
    .select("name");

  const dbJobsites = jobsitesData?.map((j) => j.name) || [];
  const dbPositions = positionsData?.map((p) => p.name) || [];

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const { data: profilesData } = await supabaseAdmin
    .from("profiles")
    .select("id, name, role");

  const recorderNameById = Object.fromEntries(
    (profilesData || []).map((p) => [
      p.id,
      (p.name && String(p.name).trim()) || "Unknown",
    ]),
  );

  const assignedUsers = (profilesData || [])
    .filter(
      (p) =>
        PROVINCE_ASSIGNEE_ROLES.includes(p.role) || p.role === "ADMIN",
    )
    .map((p) => ({
      id: p.id,
      name: (p.name && String(p.name).trim()) || "Unknown",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="flex h-dvh min-h-0 overflow-hidden bg-gray-50">
      <div className="h-dvh shrink-0">
        <AdminNavbar />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        <AdminClientsLogs
          initialData={clientLogs || []}
          dbJobsites={dbJobsites}
          dbPositions={dbPositions}
          recorderNameById={recorderNameById}
          assignedUsers={assignedUsers}
        />
      </div>
    </main>
  );
}
