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
    .eq("province", userRole)
    .order("date", { ascending: false });

  return (
    <main className="flex h-dvh ">
      {/* sidebar */}
      <UserNavbar />
      {/* main */}
      <ClientsLogs initialData={clientLogs || []} userRole={userRole} />
    </main>
  );
}
