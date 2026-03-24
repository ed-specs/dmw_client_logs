"use client";

import { useState } from "react";
import { X } from "lucide-react";

export default function AdminJobsitesPositions() {
  const [toggleAddJobsite, setToggleAddJobsite] = useState(false);
  const [toggleAddPosition, setToggleAddPosition] = useState(false);
  return (
    <div className="flex flex-col flex-1 gap-4 p-6 bg-gray-50">
      {/* header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold uppercase">
          Jobsites & Positions
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setToggleAddJobsite(true)}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-150 cursor-pointer flex items-center gap-2"
          >
            Add Jobsite
          </button>
          <button
            onClick={() => setToggleAddPosition(true)}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-150 cursor-pointer flex items-center gap-2"
          >
            Add Position
          </button>
        </div>
      </div>

      {/* main */}
      <div className="flex flex-1 gap-6">
        {/* jobsites */}
        <div className="flex flex-col flex-1">asd</div>
        {/* positions */}
        <div className="flex flex-col flex-1">asd</div>
      </div>

      {/* modal jobsite */}
      {toggleAddJobsite && (
        <div className="fixed bg-black/50 inset-0 flex items-center justify-center z-50">
          <div className="relative bg-white rounded-2xl p-6 flex flex-col gap-4 max-w-md w-full shadow-2xl">
            {/* close button */}
            <button
              onClick={() => setToggleAddJobsite(false)}
              className="absolute top-4 right-4 rounded-full p-2 hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
            >
              <X strokeWidth={1.5} className="w-5 h-5" />
            </button>

            {/* header */}
            <h2 className="text-lg font-semibold uppercase">Add Jobsite</h2>

            {/* input */}
            <form action="" className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="" className="text-sm text-gray-500">
                  New Jobsite
                </label>
                <input
                  placeholder="Enter new jobsite"
                  type="text"
                  className="px-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150"
                />
                <span className="text-xs text-gray-500">
                  Do not use acronym.
                </span>
              </div>
              <div className="flex items-center justify-center">
                <button className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-150 cursor-pointer flex items-center gap-2">
                  Add Jobsite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* modal position */}
      {toggleAddPosition && (
        <div className="fixed bg-black/50 inset-0 flex items-center justify-center z-50">
          <div className="relative bg-white rounded-2xl p-6 flex flex-col gap-4 max-w-md w-full shadow-2xl">
            {/* close button */}
            <button
              onClick={() => setToggleAddPosition(false)}
              className="absolute top-4 right-4 rounded-full p-2 hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
            >
              <X strokeWidth={1.5} className="w-5 h-5" />
            </button>

            {/* header */}
            <h2 className="text-lg font-semibold uppercase">Add Position</h2>

            {/* input */}
            <form action="" className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="" className="text-sm text-gray-500">
                  New Position
                </label>
                <input
                  placeholder="Enter new position"
                  type="text"
                  className="px-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150"
                />
                <span className="text-xs text-gray-500">
                  Do not use acronym.
                </span>
              </div>
              <div className="flex items-center justify-center">
                <button className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-150 cursor-pointer flex items-center gap-2">
                  Add Position
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
