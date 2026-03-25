"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, ChevronDown, Plus, X, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  addJobsiteName,
  addPositionName,
} from "../actions/jobsitesPositionsActions";

const ADMIN_PROVINCES = [
  "MIMAROPA REGION",
  "ORIENTAL MINDORO",
  "OCCIDENTAL MINDORO",
  "MARINDUQUE",
  "ROMBLON",
  "PALAWAN",
  "OUTSIDE MIMAROPA",
];

const MIMAROPA_PROVINCES = new Set([
  "ORIENTAL MINDORO",
  "OCCIDENTAL MINDORO",
  "MARINDUQUE",
  "ROMBLON",
  "PALAWAN",
]);

const SORT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "newest", label: "Newest to Oldest" },
  { value: "oldest", label: "Oldest to Newest" },
  { value: "highest", label: "Highest to Lowest" },
  { value: "lowest", label: "Lowest to Highest" },
];

function buildAggregates(logs, key) {
  const map = new Map();
  logs.forEach((log) => {
    const raw = log[key];
    const name = String(raw || "")
      .trim()
      .toUpperCase();
    if (!name) return;
    const existing = map.get(name) || {
      name,
      count: 0,
      latestDate: "",
      earliestDate: "",
    };
    existing.count += 1;
    const logDate = String(log.date || "");
    if (logDate) {
      if (!existing.latestDate || logDate > existing.latestDate) {
        existing.latestDate = logDate;
      }
      if (!existing.earliestDate || logDate < existing.earliestDate) {
        existing.earliestDate = logDate;
      }
    }
    map.set(name, existing);
  });
  return Array.from(map.values());
}

function normalizeMasterList(names) {
  return [
    ...new Set(
      (names || [])
        .map((n) =>
          String(n || "")
            .trim()
            .toUpperCase(),
        )
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b));
}

/** Every row from master list; counts from aggregates (0 when no logs). */
function mergeMasterWithAggregates(masterNames, aggregates) {
  const aggMap = new Map();
  aggregates.forEach((r) => aggMap.set(r.name, r));
  return normalizeMasterList(masterNames).map((name) => {
    const a = aggMap.get(name);
    return {
      name,
      count: a?.count ?? 0,
      latestDate: a?.latestDate ?? "",
      earliestDate: a?.earliestDate ?? "",
    };
  });
}

function sortRows(rows, sortOrder) {
  if (sortOrder === "default") return rows;
  const cloned = [...rows];
  if (sortOrder === "highest") {
    return cloned.sort(
      (a, b) => b.count - a.count || a.name.localeCompare(b.name),
    );
  }
  if (sortOrder === "lowest") {
    return cloned.sort(
      (a, b) => a.count - b.count || a.name.localeCompare(b.name),
    );
  }
  if (sortOrder === "newest") {
    return cloned.sort(
      (a, b) =>
        String(b.latestDate || "").localeCompare(String(a.latestDate || "")) ||
        b.count - a.count,
    );
  }
  return cloned.sort(
    (a, b) =>
      String(a.earliestDate || "").localeCompare(
        String(b.earliestDate || ""),
      ) || b.count - a.count,
  );
}

function topByCount(rows) {
  const positive = rows.filter((r) => r.count > 0);
  if (!positive.length) return "N/A";
  return [...positive].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name),
  )[0].name;
}

/**
 * @param {object} props
 * @param {Array} props.initialLogs
 * @param {string[]} props.dbJobsites
 * @param {string[]} props.dbPositions
 * @param {string} [props.userRole] — province role from `profiles.role` (user variant only)
 * @param {"admin" | "user"} props.variant
 */
export default function JobsitesPositionsView({
  initialLogs = [],
  dbJobsites = [],
  dbPositions = [],
  userRole = "",
  variant,
}) {
  const router = useRouter();
  const isAdmin = variant === "admin";

  const userScopeOptions = useMemo(() => {
    const role = String(userRole || "").trim();
    if (!role) {
      return ["ALL CLIENTS", "OTHER PROVINCE", "OUTSIDE MIMAROPA"];
    }
    return ["ALL CLIENTS", role, "OTHER PROVINCE", "OUTSIDE MIMAROPA"];
  }, [userRole]);

  const [selectedProvince, setSelectedProvince] = useState(ADMIN_PROVINCES[0]);
  const [userScope, setUserScope] = useState(
    () => String(userRole || "").trim() || "ALL CLIENTS",
  );
  const [toggleProvinceDropdown, setToggleProvinceDropdown] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [toggleSort, setToggleSort] = useState(false);
  const [sortOrder, setSortOrder] = useState("default");
  const [isFocused, setIsFocused] = useState(false);

  const [toggleAddJobsite, setToggleAddJobsite] = useState(false);
  const [toggleAddPosition, setToggleAddPosition] = useState(false);
  const [addJobsiteStatus, setAddJobsiteStatus] = useState("idle");
  const [addPositionStatus, setAddPositionStatus] = useState("idle");
  const [addJobsiteError, setAddJobsiteError] = useState("");
  const [addPositionError, setAddPositionError] = useState("");

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    const interval = setInterval(() => router.refresh(), 60000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
    };
  }, [router]);

  const scopedLogs = useMemo(() => {
    if (isAdmin) {
      return initialLogs.filter((log) => {
        const province = String(log.province || "").toUpperCase();
        if (selectedProvince === "MIMAROPA REGION") {
          return true;
        }
        if (selectedProvince === "OUTSIDE MIMAROPA") {
          return !!province && !MIMAROPA_PROVINCES.has(province);
        }
        return province === String(selectedProvince || "").toUpperCase();
      });
    }

    const roleNorm = String(userRole || "")
      .trim()
      .toUpperCase();

    return initialLogs.filter((log) => {
      const provinceRaw = log.province;
      const provinceNorm = String(provinceRaw || "").toUpperCase();

      if (userScope === "ALL CLIENTS") return true;

      if (userScope === "OTHER PROVINCE") {
        return (
          !!provinceRaw &&
          provinceNorm !== roleNorm &&
          MIMAROPA_PROVINCES.has(provinceNorm)
        );
      }

      if (userScope === "OUTSIDE MIMAROPA") {
        return !!provinceRaw && !MIMAROPA_PROVINCES.has(provinceNorm);
      }

      return provinceNorm === roleNorm;
    });
  }, [initialLogs, isAdmin, selectedProvince, userScope, userRole]);

  const q = searchQuery.trim().toLowerCase();
  const searchedLogs = useMemo(() => {
    if (!q) return scopedLogs;
    return scopedLogs.filter((log) => {
      const jobsite = String(log.jobsite || "").toLowerCase();
      const position = String(log.position || "").toLowerCase();
      return jobsite.includes(q) || position.includes(q);
    });
  }, [q, scopedLogs]);

  const jobsiteAggregates = useMemo(
    () => buildAggregates(searchedLogs, "jobsite"),
    [searchedLogs],
  );
  const positionAggregates = useMemo(
    () => buildAggregates(searchedLogs, "position"),
    [searchedLogs],
  );

  const jobsiteRowsBase = useMemo(
    () => mergeMasterWithAggregates(dbJobsites, jobsiteAggregates),
    [dbJobsites, jobsiteAggregates],
  );
  const positionRowsBase = useMemo(
    () => mergeMasterWithAggregates(dbPositions, positionAggregates),
    [dbPositions, positionAggregates],
  );

  const jobsiteRows = useMemo(
    () => sortRows(jobsiteRowsBase, sortOrder),
    [jobsiteRowsBase, sortOrder],
  );
  const positionRows = useMemo(
    () => sortRows(positionRowsBase, sortOrder),
    [positionRowsBase, sortOrder],
  );

  const topJobsite = useMemo(
    () => topByCount(jobsiteRowsBase),
    [jobsiteRowsBase],
  );
  const topPosition = useMemo(
    () => topByCount(positionRowsBase),
    [positionRowsBase],
  );

  const totalJobsiteCatalog = jobsiteRowsBase.length;
  const totalPositionCatalog = positionRowsBase.length;

  const totalDeployed = searchedLogs.length;
  const totalMales = searchedLogs.filter(
    (log) => String(log.sex || "").toUpperCase() === "M",
  ).length;
  const totalFemales = searchedLogs.filter((log) =>
    ["F", "FEMALE"].includes(String(log.sex || "").toUpperCase()),
  ).length;

  const headerLabel = isAdmin ? selectedProvince : userScope;

  async function submitAddJobsite(e) {
    e.preventDefault();
    setAddJobsiteError("");
    setAddJobsiteStatus("submitting");
    const fd = new FormData(e.target);
    const result = await addJobsiteName(fd);
    if (!result.success) {
      setAddJobsiteError(result.error || "Failed to add jobsite");
      setAddJobsiteStatus("idle");
      return;
    }
    setAddJobsiteStatus("idle");
    setToggleAddJobsite(false);
    e.target.reset();
    router.refresh();
  }

  async function submitAddPosition(e) {
    e.preventDefault();
    setAddPositionError("");
    setAddPositionStatus("submitting");
    const fd = new FormData(e.target);
    const result = await addPositionName(fd);
    if (!result.success) {
      setAddPositionError(result.error || "Failed to add position");
      setAddPositionStatus("idle");
      return;
    }
    setAddPositionStatus("idle");
    setToggleAddPosition(false);
    e.target.reset();
    router.refresh();
  }

  return (
    <div className="flex flex-col flex-1 gap-4 p-4 bg-gray-50 min-h-0">
      <div className="flex items-center justify-between z-40 relative">
        <div className="relative">
          <div className="flex flex-col">
            <span className="text-gray-500 text-sm">
              Current selected province/region
            </span>
            {isAdmin ? (
              <>
                <button
                  type="button"
                  onClick={() => setToggleProvinceDropdown((v) => !v)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer text-left"
                >
                  <h1 className="text-xl font-semibold uppercase">
                    {headerLabel}
                  </h1>
                  <ChevronDown
                    strokeWidth={2}
                    className={`w-5 h-5 shrink-0 transition-transform duration-200 ${toggleProvinceDropdown ? "rotate-180" : ""}`}
                  />
                </button>
                {toggleProvinceDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-300 rounded-lg z-50 flex flex-col py-1 overflow-hidden shadow-lg">
                    {ADMIN_PROVINCES.map((province) => (
                      <button
                        key={province}
                        type="button"
                        onClick={() => {
                          setSelectedProvince(province);
                          setToggleProvinceDropdown(false);
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
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setToggleProvinceDropdown((v) => !v)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer text-left"
                >
                  <h1 className="text-xl font-semibold uppercase">
                    {userScope}
                  </h1>
                  <ChevronDown
                    strokeWidth={2}
                    className={`w-5 h-5 shrink-0 transition-transform duration-200 ${toggleProvinceDropdown ? "rotate-180" : ""}`}
                  />
                </button>
                {toggleProvinceDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-300 rounded-lg z-50 flex flex-col py-1 overflow-hidden shadow-lg">
                    {userScopeOptions.map((scope) => (
                      <button
                        key={scope}
                        type="button"
                        onClick={() => {
                          setUserScope(scope);
                          setToggleProvinceDropdown(false);
                        }}
                        className={`px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                          userScope === scope
                            ? "bg-blue-50 text-blue-600 font-medium"
                            : "text-gray-700"
                        }`}
                      >
                        {scope}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setToggleAddJobsite(true);
              setAddJobsiteError("");
            }}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-150 cursor-pointer flex items-center gap-2"
          >
            <Plus strokeWidth={1.5} className="w-5 h-5" />
            Add Jobsite
          </button>
          <button
            type="button"
            onClick={() => {
              setToggleAddPosition(true);
              setAddPositionError("");
            }}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-150 cursor-pointer flex items-center gap-2"
          >
            <Plus strokeWidth={1.5} className="w-5 h-5" />
            Add Position
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="rounded-2xl px-5 py-4 bg-white flex flex-1 items-center justify-between gap-1 border border-gray-300">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-sm text-gray-500">
              TOTAL DEPLOYED OFWS
            </span>
            <h1 className="text-2xl font-bold">{totalDeployed}</h1>
          </div>
          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-gray-500 font-medium">MALES</span>
              <h1 className="font-bold">{totalMales}</h1>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-gray-500 font-medium">FEMALES</span>
              <h1 className="font-bold">{totalFemales}</h1>
            </div>
          </div>
        </div>
        <div className="rounded-2xl px-5 py-4 bg-white flex flex-1 items-center justify-between gap-1 border border-gray-300">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-sm text-gray-500">
              TOTAL JOBSITES
            </span>
            <h1 className="text-2xl font-bold">{totalJobsiteCatalog}</h1>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-gray-500 font-medium">
              TOP JOBSITE
            </span>
            <h1 className="font-bold truncate max-w-[200px] text-center">
              {topJobsite}
            </h1>
          </div>
        </div>
        <div className="rounded-2xl px-5 py-4 bg-white flex flex-1 items-center justify-between gap-1 border border-gray-300">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-sm text-gray-500">
              TOTAL POSITIONS
            </span>
            <h1 className="text-2xl font-bold">{totalPositionCatalog}</h1>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-gray-500 font-medium">
              TOP POSITION
            </span>
            <h1 className="font-bold truncate max-w-[200px] text-center">
              {topPosition}
            </h1>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 bg-white p-4 rounded-2xl border border-gray-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onInput={() => setIsFocused(true)}
              placeholder="Search jobsite or position..."
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150 w-96"
            />
            {isFocused && (
              <button
                type="button"
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
          <div className="relative">
            <button
              type="button"
              onClick={() => setToggleSort((prev) => !prev)}
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
              <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-300 rounded-lg z-30 flex flex-col py-1 overflow-hidden shadow-lg">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setSortOrder(option.value);
                      setToggleSort(false);
                    }}
                    className={`px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                      sortOrder === option.value
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3 flex-1 min-h-0">
        <div className="overflow-hidden flex flex-1 flex-col min-h-0 gap-2">
          <h2 className="text-sm font-semibold text-gray-700">JOBSITE TABLE</h2>
          <div className="overflow-auto flex-1 min-h-0 bg-white rounded-lg border border-gray-300">
            <table className="w-full text-left border-collapse">
              <thead className="border-b border-gray-300 text-gray-700 sticky top-0 z-10 bg-gray-50">
                <tr>
                  <th className="px-3 py-2.5 text-xs font-semibold tracking-wider border-r border-gray-200 text-center w-12">
                    NO.
                  </th>
                  <th className="px-3 py-2.5 text-xs font-semibold tracking-wider border-r border-gray-200">
                    JOBSITE
                  </th>
                  <th className="px-3 py-2.5 text-xs font-semibold tracking-wider text-center">
                    ACTIVE OFWS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {jobsiteRows.length > 0 ? (
                  jobsiteRows.map((row, index) => (
                    <tr
                      key={row.name}
                      className="hover:bg-blue-50/50 transition-colors duration-200 border-b border-gray-100"
                    >
                      <td className="px-3 py-2.5 text-xs text-gray-500 border-r border-gray-200 text-center">
                        {index + 1}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-900 border-r border-gray-200 font-semibold">
                        {row.name}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-center text-gray-700 font-medium">
                        {row.count}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-5 py-16 text-center text-gray-500 "
                    >
                      <div className="flex flex-col items-center justify-center">
                        <FileText
                          strokeWidth={1}
                          className="w-16 h-16 text-gray-300 mb-4"
                        />
                        <h3 className="text-lg font-semibold text-gray-700">
                          No jobsites found
                        </h3>
                        <p className="mt-1.5 text-sm text-gray-500">
                          There are currently no jobsites matching your filters
                          or search query.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden flex flex-1 flex-col min-h-0 gap-2">
          <h2 className="text-sm font-semibold text-gray-700">
            POSITION TABLE
          </h2>
          <div className="overflow-auto flex-1 min-h-0 bg-white rounded-lg border border-gray-300">
            <table className="w-full text-left border-collapse">
              <thead className="border-b border-gray-300 text-gray-700 sticky top-0 z-10 bg-gray-50">
                <tr>
                  <th className="px-3 py-2.5 text-xs font-semibold tracking-wider border-r border-gray-200 text-center w-12">
                    NO.
                  </th>
                  <th className="px-3 py-2.5 text-xs font-semibold tracking-wider border-r border-gray-200">
                    POSITION
                  </th>
                  <th className="px-3 py-2.5 text-xs font-semibold tracking-wider text-center">
                    ACTIVE CLIENTS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {positionRows.length > 0 ? (
                  positionRows.map((row, index) => (
                    <tr
                      key={row.name}
                      className="hover:bg-blue-50/50 transition-colors duration-200 border-b border-gray-100"
                    >
                      <td className="px-3 py-2.5 text-xs text-gray-500 border-r border-gray-200 text-center">
                        {index + 1}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-900 border-r border-gray-200 font-semibold">
                        {row.name}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-center text-gray-700 font-medium">
                        {row.count}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-5 py-16 text-center text-gray-500 "
                    >
                      <div className="flex flex-col items-center justify-center">
                        <FileText
                          strokeWidth={1}
                          className="w-16 h-16 text-gray-300 mb-4"
                        />
                        <h3 className="text-lg font-semibold text-gray-700">
                          No positions found
                        </h3>
                        <p className="mt-1.5 text-sm text-gray-500">
                          There are currently no positions matching your filters
                          or search query.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {toggleAddJobsite && (
        <div className="fixed bg-black/50 inset-0 flex items-center justify-center z-50 p-4">
          <div className="relative bg-white rounded-2xl p-6 flex flex-col gap-4 max-w-md w-full shadow-2xl">
            <button
              type="button"
              onClick={() => setToggleAddJobsite(false)}
              className="absolute top-4 right-4 rounded-full p-2 hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
            >
              <X strokeWidth={1.5} className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold uppercase">Add Jobsite</h2>
            <form
              onSubmit={submitAddJobsite}
              className="flex flex-col gap-4 mt-2"
            >
              <div className="flex flex-col gap-1">
                <label htmlFor="new-jobsite" className="text-sm text-gray-500">
                  New Jobsite
                </label>
                <input
                  id="new-jobsite"
                  name="name"
                  placeholder="Enter new jobsite"
                  type="text"
                  required
                  disabled={addJobsiteStatus === "submitting"}
                  className="px-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150 disabled:opacity-50"
                />
                <span className="text-xs text-gray-500">
                  Do not use acronym.
                </span>
              </div>
              {addJobsiteError ? (
                <p className="text-sm text-red-600">{addJobsiteError}</p>
              ) : null}
              <div className="flex items-center justify-center">
                <button
                  type="submit"
                  disabled={addJobsiteStatus === "submitting"}
                  className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-150 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {addJobsiteStatus === "submitting"
                    ? "Adding..."
                    : "Add Jobsite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toggleAddPosition && (
        <div className="fixed bg-black/50 inset-0 flex items-center justify-center z-50 p-4">
          <div className="relative bg-white rounded-2xl p-6 flex flex-col gap-4 max-w-md w-full shadow-2xl">
            <button
              type="button"
              onClick={() => setToggleAddPosition(false)}
              className="absolute top-4 right-4 rounded-full p-2 hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
            >
              <X strokeWidth={1.5} className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold uppercase">Add Position</h2>
            <form
              onSubmit={submitAddPosition}
              className="flex flex-col gap-4 mt-2"
            >
              <div className="flex flex-col gap-1">
                <label htmlFor="new-position" className="text-sm text-gray-500">
                  New Position
                </label>
                <input
                  id="new-position"
                  name="name"
                  placeholder="Enter new position"
                  type="text"
                  required
                  disabled={addPositionStatus === "submitting"}
                  className="px-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150 disabled:opacity-50"
                />
                <span className="text-xs text-gray-500">
                  Do not use acronym.
                </span>
              </div>
              {addPositionError ? (
                <p className="text-sm text-red-600">{addPositionError}</p>
              ) : null}
              <div className="flex items-center justify-center">
                <button
                  type="submit"
                  disabled={addPositionStatus === "submitting"}
                  className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-150 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {addPositionStatus === "submitting"
                    ? "Adding..."
                    : "Add Position"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
