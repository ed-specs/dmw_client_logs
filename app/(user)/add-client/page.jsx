import { createServerSupabase } from "../../lib/supabaseServer";
import { redirect } from "next/navigation";

import UserNavbar from "../components/UserNavbar";
import AddClient from "../components/AddClient";

export default async function AddClientPage() {
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

  return (
    <main className="flex h-dvh ">
      {/* sidebar */}
      <UserNavbar />
      {/* main */}
      <AddClient />
    </main>
  );
}
