import { createServerSupabase } from "../../lib/supabaseServer";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

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

  // Initialize Admin Client to bypass RLS "View Own Profile" restrictions
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  // Fetch all employees for table
  const { data: employees } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

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
    <main className="flex h-dvh overflow-y-auto">
      {/* sidebar */}
      <AdminNavbar />
      {/* main */}
      <AdminJobsitesPositions />
    </main>
  );
}
