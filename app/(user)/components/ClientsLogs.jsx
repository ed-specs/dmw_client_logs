"use client";
import Link from "next/link";
import ClientDataTable from "./ClientsLogs/ClientDataTable";

import { BookOpenText } from "lucide-react";

export default function ClientsLogs({ initialData = [], userRole }) {
  const totalClients = initialData.length;
  const totalMales = initialData.filter((log) => log.sex === "M").length;
  const totalFemales = initialData.filter(
    (log) => log.sex === "F" || log.sex === "Female",
  ).length;

  return (
    <div className="flex flex-col flex-1 gap-4 p-6 bg-gray-50">
      {/* header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{userRole}</h1>
        <Link
          href="/add-client"
          className="rounded-lg px-4 py-2 bg-blue-500 hover:bg-blue-600 transition-colors duration-150 cursor-pointer text-white flex items-center gap-2"
        >
          <BookOpenText strokeWidth={1.5} className="w-5 h-5" />
          Add Client Log
        </Link>
      </div>
      {/* main */}
      <div className="flex flex-1 gap-6">
        <div className="flex flex-col flex-1 gap-6">
          {/* Tallys */}
          <div className="flex items-center justify-center gap-3">
            {/* total clients */}
            <div className="rounded-2xl p-4 bg-blue-500 text-white flex flex-1 flex-col gap-1 border border-blue-300 shadow-sm">
              <span className="text-blue-100 font-medium text-sm">
                Total Clients
              </span>
              <h1 className="text-3xl font-bold">{totalClients}</h1>
            </div>
            {/* total males */}
            <div className="rounded-2xl p-4 bg-green-500 text-white flex flex-1 flex-col gap-1 border border-green-300 shadow-sm">
              <span className="text-green-100 font-medium text-sm">
                Total Males
              </span>
              <h1 className="text-3xl font-bold">{totalMales}</h1>
            </div>

            {/* total females */}
            <div className="rounded-2xl p-4 bg-orange-500 text-white flex flex-1 flex-col gap-1 border border-orange-300 shadow-sm">
              <span className="text-orange-100 font-medium text-sm">
                Total Females
              </span>
              <h1 className="text-3xl font-bold">{totalFemales}</h1>
            </div>
          </div>
          {/* main tables */}
          <ClientDataTable data={initialData} userRole={userRole} />
        </div>

        {/* forms */}
        {/* <div className=" flex flex-col w-96 bg-white rounded-2xl px-4 py-6 border border-gray-300">
          <div className="flex items-center justify-center">
            <h1 className="text-xl font-semibold">Client Logs Form</h1>
          </div>
        </div> */}
      </div>
    </div>
  );
}
