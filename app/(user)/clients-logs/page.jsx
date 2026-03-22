import { createServerSupabase } from "../../lib/supabaseServer";
import { redirect } from "next/navigation";

import UserNavbar from "../components/UserNavbar";
import ClientsLogs from "../components/ClientsLogs";

export default async function AdminDashboard() {
  const supabase = await createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/");
  }

  // Fetch user's role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  return (
    <main className="flex h-dvh ">
      {/* sidebar */}
      <UserNavbar />
      {/* main */}
      <ClientsLogs />
    </main>
  );
}
