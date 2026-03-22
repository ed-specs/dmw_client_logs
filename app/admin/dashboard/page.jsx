import { createServerSupabase } from "../../lib/supabaseServer";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

import AdminNavbar from "../components/AdminNavbar";
import MainDashboard from "../../components/MainDashboard";

export default async function AdminDashboard() {
  const supabase = await createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/");
  }

  // Fetch user's role
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  console.log("AdminDashboard Check:", { session_id: session?.user?.id, profile, error });

  // If profile is missing or role is not admin → send to normal dashboard
  if (!profile || profile.role !== "admin") {
    console.log("Redirecting to /dashboard because profile is not admin");
    redirect("/dashboard"); // or "/login" if you prefer
    return null; // Prevents Admin settings from erroneously rendering if redirect throws incorrectly
  }

  return (
    <main className="flex h-dvh ">
      {/* sidebar */}
      <AdminNavbar />
      {/* main */}
      <MainDashboard />
    </main>
  );
}
