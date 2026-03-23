"use client";

import {
  X,
  ListFilter,
  ArrowUpDown,
  CalendarRange,
  MapPinHouse,
  Earth,
  Briefcase,
  FileText,
  ChevronLeft,
  ChevronDown,
} from "lucide-react";

import { useState } from "react";
import { ProvincePlaces } from "../../../data/ProvincePlaces";

const JOBSITE = [
  "U.A.E",
  "SAUDI ARABIA",
  "QATAR",
  "KUWAIT",
  "BAHRAIN",
  "SINGAPORE",
  "MALAYSIA",
  "TAIWAN",
  "HONGKONG",
  "SOUTH KOREA",
  "JAPAN",
  "ITALY",
  "GERMANY",
  "UK",
  "USA",
  "CANADA",
  "AUSTRALIA",
  "NEW ZEALAND",
  "FRANCE",
  "SPAIN",
  "PORTUGAL",
  "SWITZERLAND",
  "SWEDEN",
  "NORWAY",
  "DENMARK",
  "FINLAND",
  "ICELAND",
  "IRELAND",
  "SCOTLAND",
  "WALES",
  "ENGLAND",
  "NORTHERN IRELAND",
  "SCOTLAND",
  "WALES",
  "ENGLAND",
  "NORTHERN IRELAND",
];

const POSITION = [
  "DOMESTIC HELPER",
  "CARPENTER",
  "ELECTRICIAN",
  "PLUMBER",
  "PAINTER",
  "WELDER",
  "MASON",
  "LABORER",
  "DRIVER",
  "COOK",
  "WAITER",
  "NURSE",
  "TEACHER",
  "ENGINEER",
  "ACCOUNTANT",
  "IT",
  "OTHERS",
];

const PURPOSE = [
  "OEC",
  "OEC-EXEMPTION",
  "FINANCIAL ASSISTANCE",
  "G2G",
  "PEOS",
  "INFOSHEET",
  "LEGAL ASSISTANCE",
];

const ADDRESS = [
  "VICTORIA, ORIENTAL MINDORO",
  "BACO, ORIENTAL MINDORO",
  "CALAPAN, ORIENTAL MINDORO",
  "NAUJAN, ORIENTAL MINDORO",
];

const TYPE = ["LB", "SB"];

const FILTER_OPTIONS = [
  {
    id: "date",
    label: "Date",
    placeholder: "Select date",
    icon: CalendarRange,
    colClass: "col-span-2",
    options: null,
  },
  {
    id: "jobsite",
    label: "Jobsite",
    placeholder: "Select Jobsite",
    icon: Earth,
    colClass: "col-span-2",
    options: JOBSITE,
  },
  {
    id: "type",
    label: "Type",
    placeholder: "Select Type",
    icon: Earth,
    colClass: "col-span-2",
    options: TYPE,
  },
  {
    id: "position",
    label: "Position",
    placeholder: "Select Position",
    icon: Briefcase,
    colClass: "col-span-2",
    options: POSITION,
  },
  {
    id: "purpose",
    label: "Purpose",
    placeholder: "Select Purpose",
    icon: FileText,
    colClass: "col-span-2",
    options: PURPOSE,
  },
  {
    id: "address",
    label: "Address",
    placeholder: "Select address",
    icon: MapPinHouse,
    colClass: "col-span-2",
    options: ADDRESS,
  },
];

export default function AdminClientDataTable({ data, selectedProvince }) {
  const [toggleFilter, setToggleFilter] = useState(false);
  const [toggleSort, setToggleSort] = useState(false);
  const [sortOrder, setSortOrder] = useState("default"); // 'default' | 'newest' | 'oldest'
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({
    date: [],
    jobsite: [],
    type: [],
    position: [],
    purpose: [],
    address: [],
  });

  const dynamicFilterOptions = FILTER_OPTIONS.map((opt) => {
    if (opt.id === "address") {
      let options = [];
      if (selectedProvince === "MIMAROPA REGION") {
        ProvincePlaces.forEach((p) => {
          p.places.forEach((place) => {
            options.push(`${place}, ${p.province}`);
          });
        });
      } else {
        const pObj = ProvincePlaces.find(
          (p) => p.province === selectedProvince,
        );
        if (pObj) {
          options = pObj.places.map((place) => `${place}, ${selectedProvince}`);
        }
      }
      return { ...opt, options: options.sort() };
    }
    return opt;
  });

  const handleSelectFilter = (filterId, option) => {
    setSelectedFilters((prev) => {
      const currentSelected = prev[filterId] || [];
      if (currentSelected.includes(option)) {
        return {
          ...prev,
          [filterId]: currentSelected.filter((item) => item !== option),
        };
      } else {
        return {
          ...prev,
          [filterId]: [...currentSelected, option],
        };
      }
    });
  };

  const filteredData = data.filter((log) => {
    // 1. Search Query (startsWith for literal exact-prefix matching)
    const matchesSearch =
      searchQuery === "" ||
      log.clientName?.toLowerCase().startsWith(searchQuery.toLowerCase()) ||
      log.nameOfOfw?.toLowerCase().startsWith(searchQuery.toLowerCase());

    // 2. Exact Value Filters
    const matchesDate =
      selectedFilters.date?.length === 0 || !selectedFilters.date
        ? true
        : selectedFilters.date.includes(log.date);
    const matchesJobsite =
      selectedFilters.jobsite?.length === 0 || !selectedFilters.jobsite
        ? true
        : selectedFilters.jobsite.includes(log.jobsite);
    const matchesType =
      selectedFilters.type?.length === 0 || !selectedFilters.type
        ? true
        : selectedFilters.type.includes(log.type);
    const matchesPosition =
      selectedFilters.position?.length === 0 || !selectedFilters.position
        ? true
        : selectedFilters.position.includes(log.position);
    const matchesPurpose =
      selectedFilters.purpose?.length === 0 || !selectedFilters.purpose
        ? true
        : selectedFilters.purpose.includes(log.purpose);
    const matchesAddress =
      selectedFilters.address?.length === 0 || !selectedFilters.address
        ? true
        : selectedFilters.address.includes(log.address);

    return (
      matchesSearch &&
      matchesDate &&
      matchesJobsite &&
      matchesType &&
      matchesPosition &&
      matchesPurpose &&
      matchesAddress
    );
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortOrder === "default") return 0;

    const timeA = new Date(a.date).getTime() || a.id || 0;
    const timeB = new Date(b.date).getTime() || b.id || 0;

    if (sortOrder === "newest") {
      if (timeB !== timeA) return timeB - timeA;
      return (b.id || 0) - (a.id || 0);
    } else {
      if (timeA !== timeB) return timeA - timeB;
      return (a.id || 0) - (b.id || 0);
    }
  });

  const totalClients = sortedData.length;
  const hasRecords = totalClients > 0;

  // Pagination logic
  const ITEMS_PER_PAGE = 30;
  const totalPages = Math.ceil(totalClients / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentLogs = sortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="flex flex-col gap-2 flex-1">
      <div className="flex flex-col gap-3 bg-white p-4 rounded-2xl border border-gray-300">
        {/* filter */}
        <div className="flex items-center justify-between">
          {/* search bar */}
          <input
            type="text"
            name="search"
            id="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search client here..."
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150 w-96"
          />
          <div className="flex items-center gap-2 relative">
            <div className="relative">
              <button
                onClick={() => {
                  setToggleSort(!toggleSort);
                  setToggleFilter(false); // close filter if sort is opened
                }}
                className="px-4 py-2 border text-sm border-gray-300 bg-white rounded-lg flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors duration-150 shadow-sm"
              >
                <ArrowUpDown strokeWidth={1.5} className="w-4 h-4" />
                Sort by
                <ChevronDown
                  strokeWidth={1.5}
                  className={`w-4 h-4 transition-transform duration-200 ${toggleSort ? "rotate-180" : ""}`}
                />
              </button>

              {toggleSort && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-30 flex flex-col py-1 overflow-hidden">
                  <button
                    onClick={() => {
                      setSortOrder("default");
                      setToggleSort(false);
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${sortOrder === "default" ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700"}`}
                  >
                    Default
                  </button>
                  <button
                    onClick={() => {
                      setSortOrder("newest");
                      setToggleSort(false);
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${sortOrder === "newest" ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700"}`}
                  >
                    Newest to Oldest
                  </button>
                  <button
                    onClick={() => {
                      setSortOrder("oldest");
                      setToggleSort(false);
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${sortOrder === "oldest" ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700"}`}
                  >
                    Oldest to Newest
                  </button>
                </div>
              )}
            </div>

            {/* insert filter by date / address / country / position / purpose */}
            <button
              onClick={() => {
                setToggleFilter(!toggleFilter);
                setToggleSort(false);
              }}
              className="px-4 py-2 border text-sm border-gray-300 bg-white rounded-lg flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors duration-150 shadow-sm"
            >
              {toggleFilter ? (
                <X strokeWidth={1.5} className="w-4 h-4" />
              ) : (
                <ListFilter strokeWidth={1.5} className="w-4 h-4" />
              )}
              {toggleFilter ? "Close Filter" : "Filter by"}
            </button>
          </div>
        </div>
        {/* toggle filter */}
        {toggleFilter && (
          // insert filter by date / address / country / position / purpose
          <div className="rounded-lg bg-white border border-gray-300 p-4 grid grid-cols-6 gap-3 z-20">
            {dynamicFilterOptions.map((filter) => {
              const Icon = filter.icon;
              return (
                <div
                  key={filter.id}
                  className={`${filter.colClass} flex flex-col gap-1 flex-1 relative`}
                >
                  <span className="text-sm text-gray-500">{filter.label}</span>
                  {filter.id === "date" ? (
                    <div className="relative flex items-center w-full">
                      <Icon
                        strokeWidth={1.5}
                        className="w-4 h-4 absolute left-4 z-10 pointer-events-none"
                      />
                      <input
                        type="date"
                        value={selectedFilters[filter.id]?.[0] || ""}
                        onChange={(e) =>
                          setSelectedFilters((prev) => ({
                            ...prev,
                            [filter.id]: e.target.value ? [e.target.value] : [],
                          }))
                        }
                        className="relative pl-10 pr-10 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-100 cursor-pointer transition-colors w-full outline-none focus:border-blue-500 bg-transparent [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      />
                      <ChevronDown
                        strokeWidth={1.5}
                        className="w-5 h-5 absolute right-2 z-10 pointer-events-none"
                      />
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() =>
                          setActiveDropdown(
                            activeDropdown === filter.id ? null : filter.id,
                          )
                        }
                        className="relative px-4 py-2 text-sm rounded-md border border-gray-300 flex items-center gap-2 hover:bg-gray-100 cursor-pointer transition-colors w-full text-left"
                      >
                        <Icon strokeWidth={1.5} className="w-4 h-4 shrink-0" />
                        <span className="truncate flex-1">
                          {selectedFilters[filter.id]?.length > 0
                            ? `${filter.placeholder} (${selectedFilters[filter.id].length})`
                            : filter.placeholder}
                        </span>
                        <ChevronDown
                          strokeWidth={1.5}
                          className={`w-5 h-5 absolute right-2 transition-transform duration-200 ${
                            activeDropdown === filter.id ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {/* Dropdown Options */}
                      {activeDropdown === filter.id && filter.options && (
                        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                          {filter.options.map((option, idx) => (
                            <label
                              key={idx}
                              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={selectedFilters[filter.id]?.includes(
                                  option,
                                )}
                                onChange={() =>
                                  handleSelectFilter(filter.id, option)
                                }
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                              />
                              <span className="truncate">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* tables */}
      <div className="bg-white rounded-lg border border-gray-300 overflow-hidden flex flex-col mt-2 flex-1 min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1 h-0 w-full">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-300  text-gray-700 sticky top-0 z-10">
              <tr>
                <th className="px-2 py-2.5 text-xs font-semibold tracking-wider border-r border-gray-200 text-center w-12">
                  NO.
                </th>
                <th className="px-2 py-2.5 text-xs font-semibold tracking-wider border-r border-gray-200">
                  DATE
                </th>
                <th className="px-2 py-2.5 text-xs font-semibold tracking-wider border-r border-gray-200">
                  CLIENT NAME
                </th>
                <th className="px-2 py-2.5 text-xs font-semibold tracking-wider border-r border-gray-200 text-center">
                  AGE
                </th>
                <th className="px-2 py-2.5 text-xs font-semibold tracking-wider border-r border-gray-200 text-center">
                  SEX
                </th>
                <th className="px-2 py-2.5 text-xs font-semibold tracking-wider border-r border-gray-200">
                  ADDRESS
                </th>
                <th className="px-2 py-2.5 text-xs font-semibold tracking-wider border-r border-gray-200">
                  CONTACT NO.
                </th>
                <th className="px-2 py-2.5 text-xs font-semibold tracking-wider border-r border-gray-200">
                  NAME OF OFW
                </th>
                <th className="px-2 py-2.5 text-xs font-semibold tracking-wider border-r border-gray-200">
                  JOBSITE
                </th>
                <th className="px-2 py-2.5 text-xs font-semibold tracking-wider border-r border-gray-200">
                  TYPE
                </th>
                <th className="px-2 py-2.5 text-xs font-semibold tracking-wider border-r border-gray-200">
                  POSITION
                </th>
                <th className="px-2 py-2.5 text-xs font-semibold tracking-wider border-r border-gray-200">
                  PURPOSE
                </th>
                <th className="px-2 py-2.5 text-xs font-semibold tracking-wider text-center">
                  SURVEY
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {hasRecords ? (
                currentLogs.map((log, index) => (
                  <tr
                    key={log.id}
                    className="hover:bg-blue-50/50 transition-colors duration-200 border-b border-gray-100"
                  >
                    <td className="px-2 py-2.5 text-xs text-gray-500 border-r border-gray-200 text-center">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-2 py-2.5 text-xs text-gray-700 border-r border-gray-200 font-medium whitespace-nowrap">
                      {log.date
                        ? new Date(log.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "N/A"}
                    </td>
                    <td className="px-2 py-2.5 text-xs text-gray-900 border-r border-gray-200 font-semibold whitespace-nowrap">
                      {log.clientName}
                    </td>
                    <td className="px-2 py-2.5 text-xs text-gray-700 border-r border-gray-200 text-center">
                      {log.age}
                    </td>
                    <td className="px-2 py-2.5 text-xs text-gray-700 border-r border-gray-200 text-center">
                      {log.sex}
                    </td>
                    <td
                      className="px-2 py-2.5 text-xs text-gray-700 border-r border-gray-200 max-w-xs truncate"
                      title={log.address}
                    >
                      {log.address}
                    </td>
                    <td className="px-2 py-2.5 text-xs text-gray-700 border-r border-gray-200 font-medium">
                      {log.contactNo}
                    </td>
                    <td className="px-2 py-2.5 text-xs text-gray-700 border-r border-gray-200">
                      {log.nameOfOfw}
                    </td>
                    <td className="px-2 py-2.5 text-xs text-gray-700 border-r border-gray-200 font-medium">
                      {log.jobsite}
                    </td>
                    <td className="px-2 py-2.5 text-xs text-gray-700 border-r border-gray-200">
                      {log.type}
                    </td>
                    <td className="px-2 py-2.5 text-xs text-gray-700 border-r border-gray-200">
                      {log.position}
                    </td>
                    <td className="px-2 py-2.5 text-xs text-gray-700 border-r border-gray-200">
                      {log.purpose}
                    </td>
                    <td className="px-2 py-2.5 text-xs text-center align-middle">
                      {log.survey}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="12"
                    className="px-5 py-16 text-center text-gray-500 "
                  >
                    <div className="flex flex-col items-center justify-center">
                      <FileText
                        strokeWidth={1}
                        className="w-16 h-16 text-gray-300 mb-4"
                      />
                      <h3 className="text-lg font-semibold text-gray-700">
                        No records found
                      </h3>
                      <p className="mt-1.5 text-sm text-gray-500">
                        There are currently no clients matching your filters or
                        search query.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {hasRecords && totalPages > 1 && (
          <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between bg-white sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(startIndex + ITEMS_PER_PAGE, totalClients)}
                  </span>{" "}
                  of <span className="font-medium">{totalClients}</span> results
                </p>
              </div>
              <div>
                <nav
                  className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <span aria-hidden="true">&laquo;</span>
                  </button>

                  {/* Page Numbers */}
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus-visible:outline-none
                               focus-visible:outline-offset-0 focus-visible:outline-blue-600 ${
                                 currentPage === i + 1
                                   ? "z-10 bg-blue-600 text-white"
                                   : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                               }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <span aria-hidden="true">&raquo;</span>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
