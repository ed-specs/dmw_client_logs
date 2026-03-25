"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import AdminClientDataTable from "./AdminClientsLogs/AdminClientDataTable";

import { BookOpenText, ChevronDown } from "lucide-react";

const PROVINCES = [
  "MIMAROPA REGION",
  "ORIENTAL MINDORO",
  "OCCIDENTAL MINDORO",
  "MARINDUQUE",
  "ROMBLON",
  "PALAWAN",
  "OUTSIDE MIMAROPA",
];

const MIMAROPA_PROVINCES = [
  "ORIENTAL MINDORO",
  "OCCIDENTAL MINDORO",
  "MARINDUQUE",
  "ROMBLON",
  "PALAWAN",
];

export default function AdminClientsLogs({
  initialData = [],
  dbJobsites = [],
  dbPositions = [],
  recorderNameById = {},
  assignedUsers = [],
}) {
  const [selectedProvince, setSelectedProvince] = useState(PROVINCES[0]);
  const [toggleDropdown, setToggleDropdown] = useState(false);

  const filteredData =
    selectedProvince === "MIMAROPA REGION"
      ? initialData
      : selectedProvince === "OUTSIDE MIMAROPA"
        ? initialData.filter(
            (log) => !MIMAROPA_PROVINCES.includes(log.province),
          )
        : initialData.filter((log) => log.province === selectedProvince);

  const normalizeType = (type = "") => {
    const upper = String(type).toUpperCase().trim();
    if (upper === "LB" || upper === "LANDBASED") return "LANDBASED";
    if (upper === "SB" || upper === "SEABASED") return "SEABASED";
    return upper;
  };

  const isMale = (sex = "") => String(sex).toUpperCase().trim() === "M";
  const isFemale = (sex = "") => {
    const upper = String(sex).toUpperCase().trim();
    return upper === "F" || upper === "FEMALE";
  };

  const computeTallyStats = (logs = []) => {
    const landbasedLogs = logs.filter(
      (log) => normalizeType(log.type) === "LANDBASED",
    );
    const seabasedLogs = logs.filter(
      (log) => normalizeType(log.type) === "SEABASED",
    );

    return {
      totalClients: logs.length,
      totalMales: logs.filter((log) => isMale(log.sex)).length,
      totalFemales: logs.filter((log) => isFemale(log.sex)).length,
      totalLandbased: landbasedLogs.length,
      landbasedMales: landbasedLogs.filter((log) => isMale(log.sex)).length,
      landbasedFemales: landbasedLogs.filter((log) => isFemale(log.sex)).length,
      totalSeabased: seabasedLogs.length,
      seabasedMales: seabasedLogs.filter((log) => isMale(log.sex)).length,
      seabasedFemales: seabasedLogs.filter((log) => isFemale(log.sex)).length,
    };
  };

  const [tallyStats, setTallyStats] = useState(() =>
    computeTallyStats(filteredData),
  );

  const updateTallyStats = useCallback((nextStats) => {
    setTallyStats((prev) => {
      if (
        prev.totalClients === nextStats.totalClients &&
        prev.totalMales === nextStats.totalMales &&
        prev.totalFemales === nextStats.totalFemales &&
        prev.totalLandbased === nextStats.totalLandbased &&
        prev.landbasedMales === nextStats.landbasedMales &&
        prev.landbasedFemales === nextStats.landbasedFemales &&
        prev.totalSeabased === nextStats.totalSeabased &&
        prev.seabasedMales === nextStats.seabasedMales &&
        prev.seabasedFemales === nextStats.seabasedFemales
      ) {
        return prev;
      }
      return nextStats;
    });
  }, []);

  return (
    <div className="flex flex-col flex-1 gap-4 p-4 bg-gray-50">
      {/* header */}
      <div className="flex items-center justify-between z-40 relative">
        <div className="relative">
          <div className="flex flex-col">
            <span className="text-gray-500 text-sm">
              Current selected province/region
            </span>
            <button
              onClick={() => setToggleDropdown(!toggleDropdown)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <h1 className="text-xl font-semibold uppercase">
                {selectedProvince}
              </h1>
              <ChevronDown
                strokeWidth={2}
                className={`w-5 h-5 transition-transform duration-200 ${toggleDropdown ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {toggleDropdown && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-300 rounded-lg  z-50 flex flex-col py-1 overflow-hidden">
              {PROVINCES.map((province) => (
                <button
                  key={province}
                  onClick={() => {
                    setSelectedProvince(province);
                    setToggleDropdown(false);
                  }}
                  className={`px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${selectedProvince === province ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700"}`}
                >
                  {province}
                </button>
              ))}
            </div>
          )}
        </div>
        <Link
          href="/admin/add-client"
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
          <div className="flex gap-3">
            {/* total clients */}
            <div className="rounded-2xl px-5 py-4 bg-white  flex flex-1 items-center justify-between gap-1 border border-gray-300">
              <div className="flex flex-col gap-1">
                <span className=" font-semibold text-sm text-gray-500">
                  TOTAL CLIENTS LOGGED
                </span>
                <h1 className="text-2xl font-bold">{tallyStats.totalClients}</h1>
              </div>

              <div className="flex items-center justify-center gap-6">
                {/* males */}
                <div className="flex flex-col items-center justify-cente gap-1">
                  <span className="text-xs text-gray-500 font-medium">
                    Males
                  </span>
                  <h1 className="text- font-bold">{tallyStats.totalMales}</h1>
                </div>

                {/* females */}
                <div className="flex flex-col items-center justify-cente gap-1">
                  <span className="text-xs text-gray-500 font-medium">
                    Females
                  </span>
                  <h1 className="text- font-bold">{tallyStats.totalFemales}</h1>
                </div>
              </div>
            </div>

            {/* land-based */}
            <div className="rounded-2xl px-5 py-4 bg-white  flex flex-1 items-center justify-between gap-1 border border-gray-300">
              <div className="flex flex-col gap-1">
                <span className=" font-semibold text-sm text-gray-500">LAND-BASED OFWS</span>
                <h1 className="text-2xl font-bold">{tallyStats.totalLandbased}</h1>
              </div>

              <div className="flex items-center justify-center gap-6">
                {/* males */}
                <div className="flex flex-col items-center justify-cente gap-1">
                  <span className="text-xs text-gray-500 font-medium">
                    Males
                  </span>
                  <h1 className="text- font-bold">{tallyStats.landbasedMales}</h1>
                </div>

                {/* females */}
                <div className="flex flex-col items-center justify-cente gap-1">
                  <span className="text-xs text-gray-500 font-medium">
                    Females
                  </span>
                  <h1 className="text- font-bold">{tallyStats.landbasedFemales}</h1>
                </div>
              </div>
            </div>

            {/* sea-based */}
            <div className="rounded-2xl px-5 py-4 bg-white  flex flex-1 items-center justify-between gap-1 border border-gray-300">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-sm text-gray-500">SEA-BASED OFWS</span>
                <h1 className="text-2xl font-bold">{tallyStats.totalSeabased}</h1>
              </div>

              <div className="flex items-center justify-center gap-6">
                {/* males */}
                <div className="flex flex-col items-center justify-cente gap-1">
                  <span className="text-xs text-gray-500 font-medium">
                    Males
                  </span>
                  <h1 className="text- font-bold">{tallyStats.seabasedMales}</h1>
                </div>

                {/* females */}
                <div className="flex flex-col items-center justify-cente gap-1">
                  <span className="text-xs text-gray-500 font-medium">
                    Females
                  </span>
                  <h1 className="text- font-bold">{tallyStats.seabasedFemales}</h1>
                </div>
              </div>
            </div>
            {/* most common purpose */}
            {/* <div className="rounded-2xl px-5 py-4 bg-white  flex flex-1  justify-between gap-1 border border-gray-300">
              <div className="flex flex-col gap-">
                <span className="font-semibold text-sm text-gray-500">COMMON PURPOSE</span>
                <h1 className="text-LG font-bold">OEC-EXEMPTION</h1>
              </div>
            </div> */}
          </div>
          {/* main tables */}
          <AdminClientDataTable
            data={filteredData}
            selectedProvince={selectedProvince}
            dbJobsites={dbJobsites}
            dbPositions={dbPositions}
            recorderNameById={recorderNameById}
            assignedUsers={assignedUsers}
            onTallyChange={updateTallyStats}
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
