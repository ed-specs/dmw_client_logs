"use client";
import { useState } from "react";

export default function AdminJobsitePositionsDataTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  return (
    <div className="flex gap-3 ">
        {/* jobsites table */}
      <div className="relative flex flex-1 flex-col gap-3 bg-white p-4 rounded-2xl border border-gray-300">
        <div className="flex items-center justify-between">
          {/* search and filters */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              name="search"
              id="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              onInput={() => setIsFocused(true)}
              placeholder="Search jobsite"
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150 w-96"
            />
            {isFocused && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setIsFocused(false);
                }}
                className="px-4 py-2 text-sm rounded-lg flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
              >
                Clear search
              </button>
            )}
          </div>
        </div>
      </div>

      {/* position table */}
      <div className="relative flex flex-1 flex-col gap-3 bg-white p-4 rounded-2xl border border-gray-300">
        <div className="flex items-center justify-between">
          {/* search and filters */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              name="search"
              id="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              onInput={() => setIsFocused(true)}
              placeholder="Search jobsite"
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150 w-96"
            />
            {isFocused && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setIsFocused(false);
                }}
                className="px-4 py-2 text-sm rounded-lg flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
              >
                Clear search
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
