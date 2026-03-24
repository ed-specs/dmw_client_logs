import { createServerSupabase } from "../../lib/supabaseServer";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

import AdminNavbar from "../components/AdminNavbar";
import AdminAddClient from "../components/AdminAddClient";
export default async function AdminAddClientPage() {
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

  console.log("AdminAddClientPage Check:", {
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

  // Fetch distinct jobsites and positions from isolated tables
  const { data: jobsitesData } = await supabase.from("jobsites").select("name");
  const { data: positionsData } = await supabase
    .from("positions")
    .select("name");

  const dbJobsites = jobsitesData?.map((j) => j.name) || [];
  const dbPositions = positionsData?.map((p) => p.name) || [];

  return (
    <main className="flex h-dvh overflow-y-auto">
      {/* sidebar */}
      <AdminNavbar />
      {/* main */}
      <AdminAddClient dbJobsites={dbJobsites} dbPositions={dbPositions} />
    </main>
  );
}
