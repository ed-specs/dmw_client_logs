import Image from "next/image";
import {
  LayoutDashboard,
  History,
  KeyRound,
  IdCardLanyard,
  LogOut,
} from "lucide-react";

import { createServerSupabase } from "../../lib/supabaseServer";
import { redirect } from "next/navigation";

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

  // If profile is missing or role is not admin → send to normal dashboard
  if (!profile || profile.role !== "admin") {
    redirect("/dashboard"); // or "/login" if you prefer
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <main className="flex h-dvh ">
      {/* sidebar */}
      <div className="h-full w-80 bg-gray-900 text-white p-6 flex flex-col gap-8">
        <div className="flex flex-col flex-1 gap-6">
          {/* DMW LOGO */}
          <div className="flex gap-3 items-center justify-center py-2">
            <Image src="/dmw_logo.png" alt="DMW Logo" width={65} height={65} />
            <div className="flex flex-col">
              <h1 className="text-lg font-bold">
                DEPARTMENT OF MIGRANT WORKERS
              </h1>
              {/* <div className="flex">
                <div className="flex w-auto bg-green-500 px-2 py-1 rounded-full text-xs items-center">
                  <span>Admin</span>
                </div>
              </div> */}
            </div>
          </div>

          {/* Menus */}
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-gray-300 font-semibold">Menus</span>
            <div className="flex flex-col">
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg flex items-center gap-2 transition-colors duration-150 cursor-pointer">
                <LayoutDashboard strokeWidth={1.5} className="w-5 h-5" />
                Dashboard
              </button>
              <button className="hover:bg-gray-700 px-4 py-3 rounded-lg flex items-center gap-2 transition-colors duration-150 cursor-pointer">
                <History strokeWidth={1.5} className="w-5 h-5" />
                History Logs
              </button>
            </div>
          </div>

          {/* Admin Settings */}
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-gray-300 font-semibold">Admin Settings</span>
            <div className="flex flex-col">
              <button className="hover:bg-gray-700 px-4 py-3 rounded-lg flex items-center gap-2 transition-colors duration-150 cursor-pointer">
                <IdCardLanyard strokeWidth={1.5} className="w-5 h-5" />
                Manage Employees
              </button>
              <button className="hover:bg-gray-700 px-4 py-3 rounded-lg flex items-center gap-2 transition-colors duration-150 cursor-pointer">
                <KeyRound strokeWidth={1.5} className="w-5 h-5" />
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* log out */}
        <div className="flex">
          <button className="hover:bg-red-500 text-red-500 hover:text-white w-full px-4 py-3 rounded-lg flex items-center gap-2 transition-colors duration-150 cursor-pointer">
            <LogOut strokeWidth={1.5} className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>
      {/* main */}
    </main>
  );
}
