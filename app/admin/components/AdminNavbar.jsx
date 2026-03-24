"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "../../lib/supabaseClient"; // adjust path if needed
import {
  LayoutDashboard,
  BookOpenText,
  KeyRound,
  IdCardLanyard,
  LogOut,
  Building2,
} from "lucide-react";

const MENU_SECTIONS = [
  {
    title: "Menus",
    items: [
      { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      {
        name: "Client's Logs",
        href: "/admin/clients-logs",
        icon: BookOpenText,
      },
      {
        name: "Jobsites & Positions",
        href: "/admin/jobsites-positions",
        icon: Building2,
      },
    ],
  },
  {
    title: "Admin Settings",
    items: [
      {
        name: "Manage Employees",
        href: "/admin/manage-employees",
        icon: IdCardLanyard,
      },
      {
        name: "Change Password",
        href: "/admin/change-password",
        icon: KeyRound,
      },
    ],
  },
];

export default function AdminNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Use window.location.href instead of router.replace to completely clear Next.js client router cache
    window.location.href = "/";
  };

  return (
    <div className="relative h-full w-24 shrink-0">
      <div className="group absolute left-0 top-0 z-50 h-full w-24 overflow-hidden bg-gray-900 text-white transition-[width] duration-200 hover:w-80 focus-within:w-80">
        <div className="flex h-full flex-col gap-8 p-6">
          <div className="flex flex-col flex-1 gap-6">
        {/* DMW LOGO */}
            <div className="flex items-center gap-4 py-2">
              <Image src="/dmw_logo.png" alt="DMW Logo" width={50} height={50} />
              <div className="hidden w-[180px] overflow-hidden group-hover:flex group-focus-within:flex">
                <h1 className=" leading-tight font-bold">
                  DEPARTMENT OF MIGRANT WORKERS
                </h1>
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
                <span className="max-h-0 overflow-hidden whitespace-nowrap text-gray-300 font-semibold opacity-0 transition-all duration-200 group-hover:max-h-6 group-hover:opacity-100 group-focus-within:max-h-6 group-focus-within:opacity-100">
                  {section.title}
                </span>
                <div className="flex flex-col">
                  {section.items.map((item, itemIdx) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={itemIdx}
                        href={item.href}
                        className={`px-4 py-3 rounded-lg flex items-center gap-3 transition-colors duration-150 cursor-pointer ${
                          isActive
                            ? "bg-blue-500 hover:bg-blue-600 text-white"
                            : "hover:bg-gray-700 text-gray-300"
                        }`}
                      >
                        <Icon strokeWidth={1.5} className="w-5 h-5 shrink-0" />
                        <span className="w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover:w-[200px] group-hover:opacity-100 group-focus-within:w-[200px] group-focus-within:opacity-100">
                          {item.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
                {idx < MENU_SECTIONS.length - 1 && (
                  <div className="mx-3 my-1 h-px bg-gray-700 transition-opacity duration-200 group-hover:opacity-0 group-focus-within:opacity-0" />
                )}
              </div>
            ))}
          </div>

          {/* log out */}
          <div className="flex">
            <button
              onClick={handleLogout}
              className="hover:bg-red-500 text-red-500 hover:text-white w-full px-4 py-3 rounded-lg flex items-center justify-start gap-3 text-left transition-colors duration-150 cursor-pointer"
            >
              <LogOut strokeWidth={1.5} className="w-5 h-5 shrink-0" />
              <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover:max-w-[200px] group-hover:opacity-100 group-focus-within:max-w-[200px] group-focus-within:opacity-100">
                Logout
              </span>
            </button>
            </div>
          </div>
      </div>
    </div>
  );
}
