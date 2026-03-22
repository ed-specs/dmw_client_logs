"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "../../lib/supabaseClient"; // adjust path if needed
import {
  LayoutDashboard,
  History,
  KeyRound,
  IdCardLanyard,
  LogOut,
} from "lucide-react";

const MENU_SECTIONS = [
  {
    title: "Menus",
    items: [
      { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { name: "History Logs", href: "/admin/history-logs", icon: History },
    ],
  },
  {
    title: "Admin Settings",
    items: [
      { name: "Manage Employees", href: "/admin/manage-employees", icon: IdCardLanyard },
      { name: "Change Password", href: "/admin/change-password", icon: KeyRound },
    ],
  },
];

export default function AdminNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/"); // redirect to login page
  };

  return (
    <div className="h-full w-80 bg-gray-900 text-white p-6 flex flex-col gap-8">
      <div className="flex flex-col flex-1 gap-6">
        {/* DMW LOGO */}
        <div className="flex gap-3 items-center justify-center py-2">
          <Image src="/dmw_logo.png" alt="DMW Logo" width={65} height={65} />
          <div className="flex flex-col">
            <h1 className="text-lg font-bold">DEPARTMENT OF MIGRANT WORKERS</h1>
            {/* <div className="flex">
                <div className="flex w-auto bg-green-500 px-2 py-1 rounded-full text-xs items-center">
                  <span>Admin</span>
                </div>
              </div> */}
          </div>
        </div>

        {/* Dynamic Menus */}
        {MENU_SECTIONS.map((section, idx) => (
          <div key={idx} className="flex flex-col gap-1 text-sm">
            <span className="text-gray-300 font-semibold">{section.title}</span>
            <div className="flex flex-col">
              {section.items.map((item, itemIdx) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={itemIdx}
                    href={item.href}
                    className={`px-4 py-3 rounded-lg flex items-center gap-2 transition-colors duration-150 cursor-pointer ${
                      isActive
                        ? "bg-blue-500 hover:bg-blue-600 text-white"
                        : "hover:bg-gray-700 text-gray-300"
                    }`}
                  >
                    <Icon strokeWidth={1.5} className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* log out */}
      <div className="flex">
        <button
          onClick={handleLogout}
          className="hover:bg-red-500 text-red-500 hover:text-white w-full px-4 py-3 rounded-lg flex items-center gap-2 transition-colors duration-150 cursor-pointer"
        >
          <LogOut strokeWidth={1.5} className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
