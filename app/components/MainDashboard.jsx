"use client";

import { useMemo, useState, useRef } from "react";
import { Handshake, Mars, Venus, FileText } from "lucide-react";

const PROVINCES = [
  "ORIENTAL MINDORO",
  "OCCIDENTAL MINDORO",
  "PALAWAN",
  "ROMBLON",
  "MARINDUQUE",
];

export default function MainDashboard() {
  const [selectedProvince, setSelectedProvince] = useState(PROVINCES[0]);
  const dateInputRef = useRef(null);

  const today = useMemo(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  }, []);

  const [selectedDate, setSelectedDate] = useState(today);

  const selectedDateLabel = useMemo(() => {
    const d = new Date(selectedDate);
    return d
      .toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
      .toUpperCase();
  }, [selectedDate]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 bg-gray-50">
      {/* Main Header */}
      <div className="flex items-center justify-center">
        <div className="flex flex-col gap- ">
          <h1 className="text-lg font-bold">CLIENT'S LOGS REPORT</h1>
          <span className="text-gray-500 text-sm font-semibold">
            MIMAROPA REGION
          </span>
        </div>
        {/* Date */}
        <div
          className="flex flex-col flex-1 items-center justify-center cursor-pointer"
          onClick={() => {
            if (
              dateInputRef.current &&
              typeof dateInputRef.current.showPicker === "function"
            ) {
              try {
                dateInputRef.current.showPicker();
              } catch (e) {
                console.error(e);
              }
            }
          }}
        >
          <label className="relative flex flex-col items-center justify-center cursor-pointer">
            <span className="text-sm text-gray-500">
              {selectedDate === today ? "As of Today" : "As of previous date"}
            </span>
            <h1 className="text-lg font-bold">{selectedDateLabel}</h1>
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              max={today}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Select date"
            />
          </label>
        </div>
        {/* button */}
        <div className="flex items-center justify-center">
          <button className="px-4 py-3 rounded-lg flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 transition-colors duration-150 text-white cursor-pointer">
            <FileText strokeWidth={1.5} className="w-5 h-5" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Total Served */}
      <div className="flex flex-col gap-4">
        {/* Total No. of Clients Served (MIMAROPA REGION) */}
        <div className="flex flex-col gap-1">
          <div className="grid grid-cols-3 items-center gap-4">
            {/* Total No. of Clients Served */}
            <div className="col-span-1 flex items-center justify-center gap-4 rounded-2xl bg-blue-500 border border-blue-300 p-4 text-white">
              {/* left */}
              {/* icon here */}
              <div className="flex">
                <div className="flex items-center justify-center rounded-full bg-blue-400 size-14">
                  <Handshake strokeWidth={1.5} className="size-6" />
                </div>
              </div>
              {/* right */}
              <div className="flex flex-col flex-1">
                <span className=" font-semibold">
                  Total No. of Clients Served
                </span>
                <h1 className="text-xl font-bold">0</h1>
              </div>
            </div>
            {/* Total No. of Males */}
            <div className="col-span-1 flex items-center justify-center gap-4 rounded-2xl bg-yellow-400 border border-yellow-300 p-4 text-white">
              {/* left */}
              {/* icon here */}
              <div className="flex">
                <div className="flex items-center justify-center rounded-full bg-yellow-300 size-14">
                  <Mars strokeWidth={1.5} className="size-6" />
                </div>
              </div>
              {/* right */}
              <div className="flex flex-col flex-1">
                <span className="font-semibold">Total No. of Males Served</span>
                <h1 className="text-xl font-bold">0</h1>
              </div>
            </div>
            {/* Total No. of Females */}
            <div className="col-span-1 flex items-center justify-center gap-4 rounded-2xl bg-green-500 border border-green-300 p-4 text-white">
              {/* left */}
              {/* icon here */}
              <div className="flex">
                <div className="flex items-center justify-center rounded-full bg-green-400 size-14">
                  <Venus strokeWidth={1.5} className="size-6" />
                </div>
              </div>
              {/* right */}
              <div className="flex flex-col flex-1">
                <span className=" font-semibold">
                  Total No. of Females Served
                </span>
                <h1 className="text-xl font-bold">0</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Total No. of Clients Served (Per Province) */}
        <div className="grid grid-cols-5 gap-4">
          {/* Oriental */}
          <div className="flex flex-col gap-2 items-center justify-center p-4 rounded-2xl bg-white border border-gray-300">
            <h1 className=" font-semibold">ORIENTAL MINDORO</h1>

            <div className="col-span-1 grid grid-cols-2 gap-2 ">
              <div className="col-span-2 p-4 rounded-2xl  bg-white flex flex-col items-center justify-center gap-2">
                <span className=" font-semibold">
                  Total No. of Clients Served
                </span>
                <h1 className="text-xl font-bold">0</h1>
              </div>
              <div className="col-span-1 px-2 py-4 rounded-2xl border border-gray-300 bg-white flex flex-col items-center justify-center gap-2">
                <span className="text-sm font-semibold text-center">
                  Total No. of Males Served
                </span>
                <h1 className="text-lg font-bold">0</h1>
              </div>
              <div className="col-span-1 px-2 py-4 rounded-2xl border border-gray-300 bg-white flex flex-col items-center justify-center gap-2">
                <span className="text-sm font-semibold text-center">
                  Total No. of Females Served
                </span>
                <h1 className="text-lg font-bold">0</h1>
              </div>
            </div>
          </div>

          {/* Occidental */}
          <div className="flex flex-col gap-2 items-center justify-center p-4 rounded-2xl bg-white border border-gray-300">
            <h1 className=" font-semibold">OCCIDENTAL MINDORO</h1>

            <div className="col-span-1 grid grid-cols-2 gap-2 ">
              <div className="col-span-2 p-4 rounded-2xl  bg-white flex flex-col items-center justify-center gap-2">
                <span className=" font-semibold">
                  Total No. of Clients Served
                </span>
                <h1 className="text-xl font-bold">0</h1>
              </div>
              <div className="col-span-1 px-2 py-4 rounded-2xl border border-gray-300 bg-white flex flex-col items-center justify-center gap-2">
                <span className="text-sm font-semibold text-center">
                  Total No. of Males Served
                </span>
                <h1 className="text-lg font-bold">0</h1>
              </div>
              <div className="col-span-1 px-2 py-4 rounded-2xl border border-gray-300 bg-white flex flex-col items-center justify-center gap-2">
                <span className="text-sm font-semibold text-center">
                  Total No. of Females Served
                </span>
                <h1 className="text-lg font-bold">0</h1>
              </div>
            </div>
          </div>

          {/* Palawan */}
          <div className="flex flex-col gap-2 items-center justify-center p-4 rounded-2xl bg-white border border-gray-300">
            <h1 className="text-lg font-semibold">PALAWAN</h1>

            <div className="col-span-1 grid grid-cols-2 gap-2 ">
              <div className="col-span-2 p-4 rounded-2xl  bg-white flex flex-col items-center justify-center gap-2">
                <span className=" font-semibold">
                  Total No. of Clients Served
                </span>
                <h1 className="text-xl font-bold">0</h1>
              </div>
              <div className="col-span-1 px-2 py-4 rounded-2xl border border-gray-300 bg-white flex flex-col items-center justify-center gap-2">
                <span className="text-sm font-semibold text-center">
                  Total No. of Males Served
                </span>
                <h1 className="text-lg font-bold">0</h1>
              </div>
              <div className="col-span-1 px-2 py-4 rounded-2xl border border-gray-300 bg-white flex flex-col items-center justify-center gap-2">
                <span className="text-sm font-semibold text-center">
                  Total No. of Females Served
                </span>
                <h1 className="text-lg font-bold">0</h1>
              </div>
            </div>
          </div>

          {/* Romblon */}
          <div className="flex flex-col gap-2 items-center justify-center p-4 rounded-2xl bg-white border border-gray-300">
            <h1 className="text-lg font-semibold">ROMBLON</h1>

            <div className="col-span-1 grid grid-cols-2 gap-2 ">
              <div className="col-span-2 p-4 rounded-2xl  bg-white flex flex-col items-center justify-center gap-2">
                <span className=" font-semibold">
                  Total No. of Clients Served
                </span>
                <h1 className="text-xl font-bold">0</h1>
              </div>
              <div className="col-span-1 px-2 py-4 rounded-2xl border border-gray-300 bg-white flex flex-col items-center justify-center gap-2">
                <span className="text-sm font-semibold text-center">
                  Total No. of Males Served
                </span>
                <h1 className="text-lg font-bold">0</h1>
              </div>
              <div className="col-span-1 px-2 py-4 rounded-2xl border border-gray-300 bg-white flex flex-col items-center justify-center gap-2">
                <span className="text-sm font-semibold text-center">
                  Total No. of Females Served
                </span>
                <h1 className="text-lg font-bold">0</h1>
              </div>
            </div>
          </div>

          {/* Marinduque */}
          <div className="flex flex-col gap-2 items-center justify-center p-4 rounded-2xl bg-white border border-gray-300">
            <h1 className="text-lg font-semibold">MARINDUQUE</h1>

            <div className="col-span-1 grid grid-cols-2 gap-2 ">
              <div className="col-span-2 p-4 rounded-2xl  bg-white flex flex-col items-center justify-center gap-2">
                <span className=" font-semibold">
                  Total No. of Clients Served
                </span>
                <h1 className="text-xl font-bold">0</h1>
              </div>
              <div className="col-span-1 px-2 py-4 rounded-2xl border border-gray-300 bg-white flex flex-col items-center justify-center gap-2">
                <span className="text-sm font-semibold text-center">
                  Total No. of Males Served
                </span>
                <h1 className="text-lg font-bold">0</h1>
              </div>
              <div className="col-span-1 px-2 py-4 rounded-2xl border border-gray-300 bg-white flex flex-col items-center justify-center gap-2">
                <span className="text-sm font-semibold text-center">
                  Total No. of Females Served
                </span>
                <h1 className="text-lg font-bold">0</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* City/Municipality */}
      <div className="flex flex-col gap-3">
        {/* header */}
        <div className="flex">
          <h1 className=" font-semibold">CITY/MUNICIPALITY</h1>
        </div>
        {/* options */}
        <div className="flex items-center gap-2">
          {PROVINCES.map((province) => (
            <button
              key={province}
              onClick={() => setSelectedProvince(province)}
              className={`px-4 py-2 rounded-lg border flex flex-1 items-center justify-center cursor-pointer transition-colors duration-150 ${
                selectedProvince === province
                  ? "border-blue-300 bg-blue-500 text-white hover:bg-blue-600"
                  : "border-gray-300 bg-white text-black hover:bg-gray-100"
              }`}
            >
              {province}
            </button>
          ))}
        </div>
      </div>

      
    </div>
  );
}
