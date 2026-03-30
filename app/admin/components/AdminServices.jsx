"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { revalidateClientLogs } from "../../actions/cacheActions";
import {
  ArrowUpDown,
  ChevronDown,
  ListFilter,
  Plus,
  X,
  CalendarRange,
  FileText
} from "lucide-react";

const PROVINCES = [
  "MIMAROPA REGION",
  "ORIENTAL MINDORO",
  "OCCIDENTAL MINDORO",
  "MARINDUQUE",
  "ROMBLON",
  "PALAWAN",
  "OTHER REGIONS",
];

const MIMAROPA_PROVINCES = new Set([
  "ORIENTAL MINDORO",
  "OCCIDENTAL MINDORO",
  "MARINDUQUE",
  "ROMBLON",
  "PALAWAN",
]);

const SERVICE_TYPES = ["PROCESSING", "REINTEGRATION", "LEGAL ASSISTANCE"];

const REINTEGRATION_PURPOSES = new Set([
  "PEOS",
  "AKSYON",
  "SPIMS",
  "LPOR",
  "BPBH",
  "BALIK PINAY-BALIK HANAPBUHAY",
]);

const LEGAL_ASSISTANCE_PURPOSES = new Set([
  "LDAP",
  "CONCILIATION-MEDIATION",
  "LEGAL ADVISE",
  "END OF SERVICE BENEFIT CLAIMS",
]);

const normalizePurpose = (purpose = "") =>
  String(purpose || "").toUpperCase().trim();

const getServiceType = (purpose = "") => {
  const u = normalizePurpose(purpose);
  if (LEGAL_ASSISTANCE_PURPOSES.has(u)) return "LEGAL ASSISTANCE";
  if (REINTEGRATION_PURPOSES.has(u)) return "REINTEGRATION";
  return "PROCESSING";
};

const MONTH_LABELS = {
  "01": "January",
  "02": "February",
  "03": "March",
  "04": "April",
  "05": "May",
  "06": "June",
  "07": "July",
  "08": "August",
  "09": "September",
  "10": "October",
  "11": "November",
  "12": "December",
};

function getRecorderName(recorderNameById, createdBy) {
  if (!createdBy) return "—";
  const name = recorderNameById?.[createdBy];
  return name && String(name).trim() ? name : "—";
}

function getMostCommonServiceName(logs, serviceNameKey = "serviceName") {
  if (!logs.length) return "N/A";
  const freq = new Map();
  logs.forEach((log) => {
    const key = log[serviceNameKey];
    if (!key) return;
    freq.set(key, (freq.get(key) || 0) + 1);
  });
  let bestName = "N/A";
  let bestCount = -1;
  for (const [name, count] of freq.entries()) {
    if (
      count > bestCount ||
      (count === bestCount && name.localeCompare(bestName) < 0)
    ) {
      bestName = name;
      bestCount = count;
    }
  }
  return bestName;
}

function formatDateCell(dateStr) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function AdminServices({
  initialLogs = [],
  recorderNameById = {},
  variant = "admin", // 'admin' | 'user'
  fixedProvince = null,
}) {
  const router = useRouter();

  // Header scope
  const initialProvince =
    variant === "user" && fixedProvince ? fixedProvince : PROVINCES[0];
  const [selectedProvince, setSelectedProvince] = useState(initialProvince);
  const [toggleDropdown, setToggleDropdown] = useState(false);

  // Top controls
  const [searchQuery, setSearchQuery] = useState("");
  const [toggleSort, setToggleSort] = useState(false);
  const [sortOrder, setSortOrder] = useState("default"); // default | newest | oldest | highest | lowest

  const [toggleFilter, setToggleFilter] = useState(false);

  // Filter: date (same modes as client logs)
  const [dateFilterMode, setDateFilterMode] = useState("specific");
  const [dateSpecific, setDateSpecific] = useState("");
  const [dateYear, setDateYear] = useState("");
  const [dateMonth, setDateMonth] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Filter: service type + service name
  const [selectedServiceTypes, setSelectedServiceTypes] = useState([]); // [] = all
  const [selectedServiceNames, setSelectedServiceNames] = useState([]); // [] = all

  const [currentPage, setCurrentPage] = useState(1);

  // Add services modal (currently visual only; no backend insert wired yet)
  const [toggleAddServices, setToggleAddServices] = useState(false);

  useEffect(() => {
    // Intentionally no auto-refresh: refresh should be manual to avoid DB load.
  }, [router]);

  const enrichedLogs = useMemo(() => {
    return (initialLogs || []).map((log) => {
      const serviceName = normalizePurpose(log.purpose);
      return {
        ...log,
        serviceName,
        serviceType: getServiceType(log.purpose),
      };
    });
  }, [initialLogs]);

  const scopedLogs = useMemo(() => {
    return enrichedLogs.filter((log) => {
      if (selectedProvince === "MIMAROPA REGION") {
        return MIMAROPA_PROVINCES.has(normalizePurpose(log.province));
      }
      if (selectedProvince === "OTHER REGIONS") {
        return !!log.province && !MIMAROPA_PROVINCES.has(normalizePurpose(log.province));
      }
      return normalizePurpose(log.province) === normalizePurpose(selectedProvince);
    });
  }, [enrichedLogs, selectedProvince]);

  const availableYears = useMemo(() => {
    const years = new Set();
    scopedLogs.forEach((log) => {
      const y = String(log.date || "").slice(0, 4);
      if (y && y.length === 4) years.add(y);
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [scopedLogs]);

  const availableMonths = useMemo(() => {
    if (!dateYear) return [];
    const months = new Set();
    scopedLogs.forEach((log) => {
      const s = String(log.date || "");
      if (!s.startsWith(`${dateYear}-`)) return;
      const m = s.slice(5, 7);
      if (MONTH_LABELS[m]) months.add(m);
    });
    return Array.from(months).sort((a, b) => Number(a) - Number(b));
  }, [scopedLogs, dateYear]);

  const serviceNameOptions = useMemo(() => {
    const allowedTypes =
      selectedServiceTypes.length === 0 ? SERVICE_TYPES : selectedServiceTypes;
    const set = new Set();
    scopedLogs.forEach((log) => {
      if (!allowedTypes.includes(log.serviceType)) return;
      if (log.serviceName) set.add(log.serviceName);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [scopedLogs, selectedServiceTypes]);

  const matchesDate = (log) => {
    const logDate = String(log.date || "");

    if (dateFilterMode === "specific") {
      return !dateSpecific || logDate === dateSpecific;
    }
    if (dateFilterMode === "year") {
      return !dateYear || logDate.startsWith(`${dateYear}-`);
    }
    if (dateFilterMode === "month") {
      return !dateYear || !dateMonth || logDate.startsWith(`${dateYear}-${dateMonth}-`);
    }
    // range
    return (!dateFrom || logDate >= dateFrom) && (!dateTo || logDate <= dateTo);
  };

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return scopedLogs.filter((log) => {
      if (!matchesDate(log)) return false;

      const matchesServiceType =
        selectedServiceTypes.length === 0 ||
        selectedServiceTypes.includes(log.serviceType);

      if (!matchesServiceType) return false;

      const matchesServiceName =
        selectedServiceNames.length === 0 ||
        selectedServiceNames.includes(log.serviceName);

      if (!matchesServiceName) return false;

      if (!q) return true;

      const recorderName = getRecorderName(recorderNameById, log.created_by);
      return [
        log.serviceName,
        log.serviceType,
        recorderName,
        log.province,
        log.purpose,
      ].some((field) => field != null && String(field).toLowerCase().includes(q));
    });
  }, [
    scopedLogs,
    searchQuery,
    selectedServiceTypes,
    selectedServiceNames,
    dateFilterMode,
    dateSpecific,
    dateYear,
    dateMonth,
    dateFrom,
    dateTo,
    recorderNameById,
  ]);

  const freqByServiceName = useMemo(() => {
    const freq = new Map();
    filteredLogs.forEach((log) => {
      if (!log.serviceName) return;
      freq.set(log.serviceName, (freq.get(log.serviceName) || 0) + 1);
    });
    return freq;
  }, [filteredLogs]);

  const sortedLogs = useMemo(() => {
    if (sortOrder === "default") return filteredLogs;

    const cloned = [...filteredLogs];

    const timeOf = (d) => {
      const t = new Date(d || 0).getTime();
      return Number.isNaN(t) ? 0 : t;
    };

    if (sortOrder === "newest") {
      return cloned.sort((a, b) => timeOf(b.date) - timeOf(a.date) || String(b.id || "").localeCompare(String(a.id || "")));
    }

    if (sortOrder === "oldest") {
      return cloned.sort((a, b) => timeOf(a.date) - timeOf(b.date) || String(a.id || "").localeCompare(String(b.id || "")));
    }

    if (sortOrder === "highest") {
      return cloned.sort((a, b) => {
        const ca = freqByServiceName.get(a.serviceName) || 0;
        const cb = freqByServiceName.get(b.serviceName) || 0;
        return cb - ca || a.serviceName.localeCompare(b.serviceName);
      });
    }

    // lowest
    return cloned.sort((a, b) => {
      const ca = freqByServiceName.get(a.serviceName) || 0;
      const cb = freqByServiceName.get(b.serviceName) || 0;
      return ca - cb || a.serviceName.localeCompare(b.serviceName);
    });
  }, [filteredLogs, sortOrder, freqByServiceName]);

  // Pagination
  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.max(1, Math.ceil(sortedLogs.length / ITEMS_PER_PAGE));
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedProvince, sortOrder, dateFilterMode, dateSpecific, dateYear, dateMonth, dateFrom, dateTo, selectedServiceTypes, selectedServiceNames]);

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const currentLogs = sortedLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Tallies (based on filteredLogs)
  const tallies = useMemo(() => {
    const logs = filteredLogs;

    const byType = {
      "PROCESSING": [],
      "REINTEGRATION": [],
      "LEGAL ASSISTANCE": [],
    };

    logs.forEach((log) => {
      if (byType[log.serviceType]) byType[log.serviceType].push(log);
    });

    return {
      PROCESSING: {
        total: byType["PROCESSING"].length,
        mostCommon: getMostCommonServiceName(byType["PROCESSING"]),
      },
      REINTEGRATION: {
        total: byType["REINTEGRATION"].length,
        mostCommon: getMostCommonServiceName(byType["REINTEGRATION"]),
      },
      "LEGAL ASSISTANCE": {
        total: byType["LEGAL ASSISTANCE"].length,
        mostCommon: getMostCommonServiceName(byType["LEGAL ASSISTANCE"]),
      },
    };
  }, [filteredLogs]);

  return (
    <div className="flex flex-col flex-1 gap-4 p-4 bg-gray-50 h-full overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between z-40 relative">
        <div className="relative">
          <div className="flex flex-col">
            <span className="text-gray-500 text-sm">
              {variant === "user"
                ? "Designated province"
                : "Current selected province/region"}
            </span>
            {variant === "user" ? (
              <h1 className="text-xl font-semibold uppercase">{selectedProvince}</h1>
            ) : (
              <button
                type="button"
                onClick={() => setToggleDropdown(!toggleDropdown)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <h1 className="text-xl font-semibold uppercase">
                  {selectedProvince}
                </h1>
                <ChevronDown
                  strokeWidth={2}
                  className={`w-5 h-5 transition-transform duration-200 ${
                    toggleDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}
          </div>

          {variant !== "user" && toggleDropdown && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-300 rounded-lg z-50 flex flex-col py-1 overflow-hidden">
              {PROVINCES.map((province) => (
                <button
                  key={province}
                  type="button"
                  onClick={() => {
                    setSelectedProvince(province);
                    setToggleDropdown(false);
                  }}
                  className={`px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                    selectedProvince === province
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-700"
                  }`}
                >
                  {province}
                </button>
              ))}
            </div>
          )}
        </div>

        {variant !== "user" && (
          <button
            type="button"
            onClick={() => setToggleAddServices(true)}
            className="rounded-lg px-4 py-2 bg-blue-500 hover:bg-blue-600 transition-colors duration-150 cursor-pointer text-white flex items-center gap-2 shrink-0"
          >
            <Plus strokeWidth={1.5} className="w-5 h-5" />
            Add Services
          </button>
        )}
      </div>

      {/* tallies */}
      <div className="flex flex-1 gap-6">
        <div className="flex flex-col flex-1 gap-6">
          <div className="flex gap-3 flex-wrap">
            {/* PROCESSING */}
            <div className="rounded-2xl px-5 py-4 bg-white flex flex-1 items-center justify-between gap-1 border border-gray-300 min-w-70">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-sm text-gray-500">PROCESSING SERVICES</span>
                <h1 className="text-2xl font-bold">{tallies["PROCESSING"].total}</h1>
              </div>
              <div className="flex items-center justify-center gap-6">
                <div className="flex flex-col items-center justify-cente gap-1">
                  <span className="text-xs text-gray-500 font-medium">MOST COMMON SERVICE TYPE</span>
                  <h1 className="text-xs font-bold">{tallies["PROCESSING"].mostCommon}</h1>
                </div>
              </div>
            </div>

            {/* REINTEGRATION */}
            <div className="rounded-2xl px-5 py-4 bg-white flex flex-1 items-center justify-between gap-1 border border-gray-300 min-w-70">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-sm text-gray-500">REINTEGRATION SERVICES</span>
                <h1 className="text-2xl font-bold">{tallies["REINTEGRATION"].total}</h1>
              </div>
              <div className="flex items-center justify-center gap-6">
                <div className="flex flex-col items-center justify-cente gap-1">
                  <span className="text-xs text-gray-500 font-medium">MOST COMMON SERVICE TYPE</span>
                  <h1 className="text-xs font-bold">{tallies["REINTEGRATION"].mostCommon}</h1>
                </div>
              </div>
            </div>

            {/* LEGAL ASSISTANCE */}
            <div className="rounded-2xl px-5 py-4 bg-white flex flex-1 items-center justify-between gap-1 border border-gray-300 min-w-70">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-sm text-gray-500">LEGAL ASSISTANCE SERVICES</span>
                <h1 className="text-2xl font-bold">{tallies["LEGAL ASSISTANCE"].total}</h1>
              </div>
              <div className="flex items-center justify-center gap-6">
                <div className="flex flex-col items-center justify-cente gap-1">
                  <span className="text-xs text-gray-500 font-medium">MOST COMMON SERVICE TYPE</span>
                  <h1 className="text-xs font-bold">{tallies["LEGAL ASSISTANCE"].mostCommon}</h1>
                </div>
              </div>
            </div>
          </div>

          {/* controls */}
          <div className="flex flex-col gap-2 bg-white p-4 rounded-2xl border border-gray-300">
            <div className="flex items-center justify-between flex-wrap gap-2">
              {/* search */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await revalidateClientLogs();
                    router.refresh();
                  }}
                  className="px-4 py-2 text-sm rounded-lg flex items-center justify-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                >
                  Refresh Table
                </button>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onInput={() => setCurrentPage(1)}
                  placeholder="Search service name, service type, or logged by..."
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150 w-96"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="px-4 py-2 text-sm rounded-lg flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
                  >
                    Clear search
                  </button>
                )}
              </div>

              {/* sort + filter */}
              <div className="flex items-center gap-2 relative">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setToggleSort(!toggleSort);
                      setToggleFilter(false);
                    }}
                    className="px-4 py-2 border text-sm border-gray-300 bg-white rounded-lg flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                  >
                    <ArrowUpDown strokeWidth={1.5} className="w-4 h-4" />
                    Sort by
                    <ChevronDown
                      strokeWidth={1.5}
                      className={`w-4 h-4 transition-transform duration-200 ${toggleSort ? "rotate-180" : ""}`}
                    />
                  </button>

                  {toggleSort && (
                    <div className="absolute top-full right-0 mt-2 w-60 bg-white border border-gray-300 rounded-lg z-30 flex flex-col py-1 overflow-hidden shadow-lg">
                      {[
                        { value: "default", label: "Default" },
                        { value: "newest", label: "Newest to Oldest" },
                        { value: "oldest", label: "Oldest to Newest" },
                        { value: "highest", label: "Highest to Lowest" },
                        { value: "lowest", label: "Lowest to Highest" },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setSortOrder(opt.value);
                            setToggleSort(false);
                          }}
                          className={`px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${sortOrder === opt.value ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setToggleFilter(!toggleFilter);
                    setToggleSort(false);
                  }}
                  className="px-4 py-2 border text-sm border-gray-300 bg-white rounded-lg flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
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

            {/* filter overlay */}
            <div className="relative">
              <div
                className={`absolute left-0 right-0 top-[calc(100%+8px)] z-40 rounded-lg bg-white border border-gray-300 shadow-xl origin-top transition-all duration-200 overflow-hidden ${
                  toggleFilter
                    ? "opacity-100 scale-y-100 translate-y-2 pointer-events-auto"
                    : "opacity-0 scale-y-95 -translate-y-1 pointer-events-none"
                }`}
              >
                <div className="max-h-115 overflow-y-auto p-4">
                  <div className="mb-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setDateFilterMode("specific");
                        setDateSpecific("");
                        setDateYear("");
                        setDateMonth("");
                        setDateFrom("");
                        setDateTo("");
                        setSelectedServiceTypes([]);
                        setSelectedServiceNames([]);
                      }}
                      className="text-sm rounded-md border border-gray-300 bg-white px-3 py-1.5 font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-50 cursor-pointer"
                    >
                      Reset filters
                    </button>
                  </div>

                  <div className="flex flex-col gap-4">
                    {/* date */}
                    <div>
                      <div className="flex flex-col gap-2">
                        <div className="relative flex items-center w-full">
                          <CalendarRange
                            strokeWidth={1.5}
                            className="w-4 h-4 absolute left-4 z-10 pointer-events-none text-gray-500"
                          />
                          <select
                            value={dateFilterMode}
                            onChange={(e) => {
                              setDateFilterMode(e.target.value);
                              setDateSpecific("");
                              setDateYear("");
                              setDateMonth("");
                              setDateFrom("");
                              setDateTo("");
                            }}
                            className="relative pl-10 pr-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-100 cursor-pointer transition-colors w-full outline-none focus:border-blue-500 bg-white"
                          >
                            <option value="specific">Specific Date</option>
                            <option value="year">Per Year</option>
                            <option value="month">Per Month</option>
                            <option value="range">Day Range</option>
                          </select>
                        </div>

                        {dateFilterMode === "specific" && (
                          <input
                            type="date"
                            value={dateSpecific}
                            onChange={(e) => setDateSpecific(e.target.value)}
                            className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-100 cursor-pointer transition-colors w-full outline-none focus:border-blue-500 bg-white"
                          />
                        )}

                        {dateFilterMode === "year" && (
                          <select
                            value={dateYear}
                            onChange={(e) => {
                              setDateYear(e.target.value);
                              setDateMonth("");
                            }}
                            className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-100 cursor-pointer transition-colors w-full outline-none focus:border-blue-500 bg-white"
                          >
                            <option value="">Select year</option>
                            {availableYears.map((year) => (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            ))}
                          </select>
                        )}

                        {dateFilterMode === "month" && (
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={dateYear}
                              onChange={(e) => {
                                setDateYear(e.target.value);
                                setDateMonth("");
                              }}
                              className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-100 cursor-pointer transition-colors w-full outline-none focus:border-blue-500 bg-white"
                            >
                              <option value="">Select year</option>
                              {availableYears.map((year) => (
                                <option key={year} value={year}>
                                  {year}
                                </option>
                              ))}
                            </select>

                            <select
                              value={dateMonth}
                              onChange={(e) => setDateMonth(e.target.value)}
                              disabled={!dateYear}
                              className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-100 cursor-pointer transition-colors w-full outline-none focus:border-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                              <option value="">Select month</option>
                              {availableMonths.map((month) => (
                                <option key={month} value={month}>
                                  {MONTH_LABELS[month]}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {dateFilterMode === "range" && (
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-1">
                              <label htmlFor="date-from" className="text-xs text-gray-500">
                                From
                              </label>
                              <input
                                id="date-from"
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-100 cursor-pointer transition-colors w-full outline-none focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label htmlFor="date-to" className="text-xs text-gray-500">
                                To
                              </label>
                              <input
                                id="date-to"
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-100 cursor-pointer transition-colors w-full outline-none focus:border-blue-500 bg-white"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* service type */}
                    <div>
                      <div className="flex flex-col gap-2">
                        <span className="text-sm text-gray-500 font-medium">Service Type</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {SERVICE_TYPES.map((type) => (
                            <label
                              key={type}
                              className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={selectedServiceTypes.includes(type)}
                                onChange={() => {
                                  setSelectedServiceTypes((prev) =>
                                    prev.includes(type)
                                      ? prev.filter((x) => x !== type)
                                      : [...prev, type],
                                  );
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                              />
                              <span className="truncate">{type}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* service name */}
                    <div>
                      <div className="flex flex-col gap-2">
                        <span className="text-sm text-gray-500 font-medium">Service Name</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                          {serviceNameOptions.length === 0 ? (
                            <div className="text-sm text-gray-500">No service names found.</div>
                          ) : (
                            serviceNameOptions.map((name) => (
                              <label
                                key={name}
                                className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer text-sm"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedServiceNames.includes(name)}
                                  onChange={() => {
                                    setSelectedServiceNames((prev) =>
                                      prev.includes(name)
                                        ? prev.filter((x) => x !== name)
                                        : [...prev, name],
                                    );
                                  }}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                                />
                                <span className="truncate">{name}</span>
                              </label>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* table */}
          <div className="bg-white rounded-lg border border-gray-300 overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-300 text-gray-700 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-2.5 text-xs font-semibold tracking-wider border-r border-gray-200 text-center w-12">
                      NO.
                    </th>
                    <th className="px-2 py-2.5 text-xs font-semibold tracking-wider border-r border-gray-200">
                      DATE
                    </th>
                    <th className="px-2 py-2.5 text-xs font-semibold tracking-wider border-r border-gray-200">
                      SERVICE TYPE
                    </th>
                    <th className="px-2 py-2.5 text-xs font-semibold tracking-wider border-r border-gray-200">
                      SERVICE NAME
                    </th>
                    <th className="px-2 py-2.5 text-xs font-semibold tracking-wider text-center">
                      LOGGED BY
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {currentLogs.length ? (
                    currentLogs.map((log, index) => (
                      <tr
                        key={log.id}
                        className="hover:bg-blue-50/50 transition-colors duration-150 border-b border-gray-100"
                      >
                        <td className="px-2 py-2.5 text-xs text-gray-500 border-r border-gray-200 text-center">
                          {startIndex + index + 1}
                        </td>
                        <td className="px-2 py-2.5 text-xs text-gray-700 border-r border-gray-200 font-medium whitespace-nowrap">
                          {formatDateCell(log.date)}
                        </td>
                        <td className="px-2 py-2.5 text-xs text-gray-700 border-r border-gray-200">
                          {log.serviceType}
                        </td>
                        <td className="px-2 py-2.5 text-xs text-gray-700 border-r border-gray-200 font-medium whitespace-nowrap">
                          {log.serviceName || "—"}
                        </td>
                        <td className="px-2 py-2.5 text-xs text-gray-700 text-center whitespace-nowrap">
                          {getRecorderName(recorderNameById, log.created_by)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                    <td
                      colSpan="5"
                      className="px-5 py-16 text-center text-gray-500 "
                    >
                      <div className="flex flex-col items-center justify-center">
                        <FileText
                          strokeWidth={1}
                          className="w-16 h-16 text-gray-300 mb-4"
                        />
                        <h3 className="text-lg font-semibold text-gray-700">
                          No services found
                        </h3>
                        <p className="mt-1.5 text-sm text-gray-500">
                          There are currently no services matching your filters or
                          search query.
                        </p>
                      </div>
                    </td>
                  </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {sortedLogs.length > 0 && totalPages > 1 && (
              <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between bg-white sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={safeCurrentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={safeCurrentPage === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>

                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">{startIndex + 1}</span> to{" "}
                      <span className="font-medium">
                        {Math.min(startIndex + ITEMS_PER_PAGE, sortedLogs.length)}
                      </span>{" "}
                      of <span className="font-medium">{sortedLogs.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md" aria-label="Pagination">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={safeCurrentPage === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <span aria-hidden="true">&laquo;</span>
                      </button>

                      {[...Array(totalPages)].map((_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            type="button"
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus-visible:outline-none focus-visible:outline-offset-0 focus-visible:outline-blue-600 ${
                              safeCurrentPage === page
                                ? "z-10 bg-blue-600 text-white"
                                : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={safeCurrentPage === totalPages}
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
      </div>

      {/* toggle add services */}
      {toggleAddServices && (
        <div className="fixed bg-black/50 inset-0 flex items-center justify-center z-50 p-4">
          <div className="relative bg-white rounded-2xl p-6 flex flex-col gap-4 max-w-md w-full shadow-2xl">
            <button
              type="button"
              onClick={() => setToggleAddServices(false)}
              className="absolute top-4 right-4 rounded-full p-2 hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
            >
              <X strokeWidth={1.5} className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold uppercase">Add Services</h2>
            <form className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="serviceType" className="text-sm text-gray-500">
                  Service Type
                </label>
                <select
                  name="serviceType"
                  id="serviceType"
                  required
                  defaultValue=""
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150 bg-white cursor-pointer"
                >
                  <option value="" disabled>
                    Select service type
                  </option>
                  {SERVICE_TYPES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="serviceName" className="text-sm text-gray-500">
                  Service Name
                </label>
                <input
                  id="serviceName"
                  name="serviceName"
                  type="text"
                  required
                  placeholder="Enter service name"
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150"
                />
                <span className="text-xs text-gray-500">Do not use acronym</span>
              </div>

              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setToggleAddServices(false)}
                  className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-150 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  Add Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
