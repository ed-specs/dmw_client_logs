"use client";
import { useState } from "react";
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
];

const DUMMY_LOGS = [
  {
    id: 1,
    date: "JANUARY 2, 2026",
    clientName: "EDWARD C. GATBONTON",
    age: 22,
    sex: "M",
    address: "VICTORIA, ORIENTAL MINDORO",
    contactNo: "09162561433",
    nameOfOfw: "EDWARD C. GATBONTON",
    jobsite: "QATAR",
    type: "LB",
    position: "CAREGIVER",
    purpose: "OEC",
    survey: "GOOD",
  },
  {
    id: 2,
    date: "JANUARY 5, 2026",
    clientName: "MARIA CLARA SANTOS",
    age: 28,
    sex: "F",
    address: "CALAPAN, ORIENTAL MINDORO",
    contactNo: "09123456789",
    nameOfOfw: "MARIA CLARA SANTOS",
    jobsite: "JAPAN",
    type: "LB",
    position: "DOMESTIC HELPER",
    purpose: "OEC",
    survey: "GOOD",
  },
  {
    id: 3,
    date: "JANUARY 10, 2026",
    clientName: "JUAN DELA CRUZ",
    age: 45,
    sex: "M",
    address: "NAUJAN, ORIENTAL MINDORO",
    contactNo: "09987654321",
    nameOfOfw: "JUAN DELA CRUZ",
    jobsite: "SAUDI ARABIA",
    type: "LB",
    position: "ELECTRICIAN",
    purpose: "FINANCIAL ASSISTANCE",
    survey: "GOOD",
  },
];

export default function AdminClientsLogs({ initialData = [] }) {
  const [selectedProvince, setSelectedProvince] = useState(PROVINCES[0]);
  const [toggleDropdown, setToggleDropdown] = useState(false);

  const filteredData =
    selectedProvince === "MIMAROPA REGION"
      ? initialData
      : initialData.filter((log) => log.province === selectedProvince);

  const totalClients = filteredData.length;
  const totalMales = filteredData.filter((log) => log.sex === "M").length;
  const totalFemales = filteredData.filter(
    (log) => log.sex === "F" || log.sex === "Female",
  ).length;

  return (
    <div className="flex flex-col flex-1 gap-4 p-6 bg-gray-50">
      {/* header */}
      <div className="flex items-center justify-between z-40 relative">
        <div className="relative">
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

          {toggleDropdown && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-300 rounded-lg shadow-lg z-50 flex flex-col py-1 overflow-hidden">
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
          <AdminClientDataTable data={filteredData} selectedProvince={selectedProvince} />
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
