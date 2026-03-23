import { createServerSupabase } from "../../lib/supabaseServer";
import { redirect } from "next/navigation";

import UserNavbar from "../components/UserNavbar";
import UserChangePassword from "../components/UserChangePassword";

export default async function UserPasswordPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Fetch user's role (Optional check to ensure they are standard users, but simply rendering is fine)
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
      <UserChangePassword />
    </main>
  );
}
