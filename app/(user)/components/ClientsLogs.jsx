"use client";
import Link from "next/link";
import ClientDataTable from "./ClientsLogs/ClientDataTable";

import { useState } from "react";

import { BookOpenText } from "lucide-react";

export default function ClientsLogs({
  initialData = [],
  userRole,
  dbJobsites = [],
  dbPositions = [],
}) {
  const [selectedProvince, setSelectedProvince] = useState(userRole);

  const MIMAROPA_PROVINCES = [
    "ORIENTAL MINDORO",
    "OCCIDENTAL MINDORO",
    "MARINDUQUE",
    "ROMBLON",
    "PALAWAN",
  ];

  const tallyData = initialData.filter((log) => {
    if (selectedProvince === "ALL CLIENTS") return true;
    if (selectedProvince === userRole) return log.province === userRole;
    if (selectedProvince === "OTHER PROVINCE")
      return (
        log.province &&
        log.province !== userRole &&
        MIMAROPA_PROVINCES.includes(log.province)
      );
    if (selectedProvince === "OUTSIDE MIMAROPA")
      return log.province && !MIMAROPA_PROVINCES.includes(log.province);
    return true;
  });

  const totalClients = tallyData.length;
  const totalMales = tallyData.filter((log) => log.sex === "M").length;
  const totalFemales = tallyData.filter(
    (log) => log.sex === "F" || log.sex === "Female",
  ).length;

  return (
    <div className="flex flex-col flex-1 gap-4 p-6 bg-gray-50">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">
            Designated province/region
          </span>
          <h1 className="text-xl font-semibold">{userRole}</h1>
        </div>
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
                Total Clients Logged
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
          <ClientDataTable
            data={initialData}
            userRole={userRole}
            dbJobsites={dbJobsites}
            dbPositions={dbPositions}
            selectedProvince={selectedProvince}
            setSelectedProvince={setSelectedProvince}
          />
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
