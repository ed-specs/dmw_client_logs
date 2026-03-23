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
    console.log("Redirecting to /dashboard because profile is not admin");
    redirect("/dashboard"); // or "/login" if you prefer
    return null; // Prevents Admin settings from erroneously rendering if redirect throws incorrectly
  }

  return (
    <main className="flex h-dvh ">
      {/* sidebar */}
      <AdminNavbar />
      {/* main */}
      <AdminAddClient />
    </main>
  );
}
