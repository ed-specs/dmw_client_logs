"use client";

import { updateClientLog } from "../../../actions/clientLogsActions";
import {
  X,
  CheckCircle,
  ListFilter,
  ArrowUpDown,
  CalendarRange,
  MapPinHouse,
  Earth,
  Briefcase,
  ChevronLeft,
  ChevronDown,
  FileText,
} from "lucide-react";

import { useState, useEffect } from "react";

import { ProvincePlaces } from "../../../data/ProvincePlaces";

const SURVEY = ["GOOD", "BAD"];
const TYPE_OPTIONS = ["LANDBASED", "SEABASED"];

const normalizeType = (type = "") => {
  const upper = String(type).toUpperCase().trim();
  if (upper === "LB" || upper === "LANDBASED") return "LANDBASED";
  if (upper === "SB" || upper === "SEABASED") return "SEABASED";
  return upper;
};

const getTypeAcronym = (type = "") => {
  const normalized = normalizeType(type);
  if (normalized === "LANDBASED") return "LB";
  if (normalized === "SEABASED") return "SB";
  return type;
};

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
    options: [], // Will be dynamically populated
  },
  {
    id: "type",
    label: "Type",
    placeholder: "Select Type",
    icon: Earth,
    colClass: "col-span-2",
    options: TYPE_OPTIONS,
  },
  {
    id: "position",
    label: "Position",
    placeholder: "Select Position",
    icon: Briefcase,
    colClass: "col-span-2",
    options: [], // Will be dynamically populated
  },
  {
    id: "purpose",
    label: "Purpose",
    placeholder: "Select Purpose",
    icon: FileText,
    colClass: "col-span-2",
    options: [
      "OEC",
      "OEC-EXEMPTION",
      "FINANCIAL ASSISTANCE",
      "G2G",
      "PEOS",
      "INFOSHEET",
      "LEGAL ASSISTANCE",
    ],
  },
  {
    id: "survey",
    label: "Survey",
    placeholder: "Select Survey",
    icon: FileText,
    colClass: "col-span-2",
    options: SURVEY,
  },
  {
    id: "address",
    label: "Address",
    placeholder: "Select address",
    icon: MapPinHouse,
    colClass: "col-span-2",
    options: [], // Will be dynamically populated
  },
];

export default function ClientDataTable({
  data,
  userRole,
  dbJobsites = [],
  dbPositions = [],
  selectedProvince,
  setSelectedProvince,
  onTallyChange,
}) {
  const [toggleFilter, setToggleFilter] = useState(false);
  const [modalState, setModalState] = useState({ isOpen: false, data: null });
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [localData, setLocalData] = useState(data);

  const MIMAROPA_PROVINCES = [
    "ORIENTAL MINDORO",
    "OCCIDENTAL MINDORO",
    "MARINDUQUE",
    "ROMBLON",
    "PALAWAN",
  ];

  const getDisplayAddress = (client) => {
    if (!client.province) return client.address;
    if (!MIMAROPA_PROVINCES.includes(client.province.toUpperCase())) {
      return `${client.address}, ${client.province}`;
    }
    return client.address;
  };

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const openEditModal = (log) => setModalState({ isOpen: true, data: log });
  const closeModal = () => setModalState({ isOpen: false, data: null });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const formDataObj = Object.fromEntries(formData.entries());

    const requiredFields = [
      "clientName",
      "nameOfOfw",
      "age",
      "sex",
      "jobsite",
      "type",
      "position",
      "address",
      "purpose",
      "survey",
    ];
    const isMissingData = requiredFields.some(
      (field) => !formDataObj[field] || formDataObj[field].trim() === "",
    );

    if (isMissingData) {
      setErrorMessage("Please fill-up all fields");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
      return;
    }

    if (!formDataObj.contactNo || formDataObj.contactNo.trim() === "") {
      formDataObj.contactNo = "N/A";
    }

    for (const key in formDataObj) {
      if (typeof formDataObj[key] === "string" && key !== "date") {
        formDataObj[key] = formDataObj[key].toUpperCase();
      }
    }

    setStatus("submitting");

    try {
      const result = await updateClientLog(formDataObj, modalState.data.id);
      if (!result.success) throw new Error(result.error);

      setSuccessMessage("Client log updated successfully!");
      setStatus("success");

      setLocalData((prev) =>
        prev.map((log) =>
          log.id === modalState.data.id ? { ...log, ...formDataObj } : log,
        ),
      );

      closeModal();
      setTimeout(() => setStatus("idle"), 6000);
    } catch (err) {
      setErrorMessage(err.message || "Failed to update client log");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 6000);
    }
  };

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
    survey: [],
  });
  const [isFocused, setIsFocused] = useState(false);
  const [dateFilterMode, setDateFilterMode] = useState("specific");
  const [dateSpecific, setDateSpecific] = useState("");
  const [dateYear, setDateYear] = useState("");
  const [dateMonth, setDateMonth] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
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
    10: "October",
    11: "November",
    12: "December",
  };
  const availableYears = Array.from(
    new Set(
      localData
        .map((log) => String(log.date || "").slice(0, 4))
        .filter((year) => year.length === 4),
    ),
  ).sort((a, b) => Number(b) - Number(a));
  const availableMonths = dateYear
    ? Array.from(
        new Set(
          localData
            .filter((log) => String(log.date || "").startsWith(`${dateYear}-`))
            .map((log) => String(log.date || "").slice(5, 7))
            .filter((month) => MONTH_LABELS[month]),
        ),
      ).sort((a, b) => Number(a) - Number(b))
    : [];

  const dynamicFilterOptions = FILTER_OPTIONS.map((opt) => {
    if (opt.id === "jobsite")
      return { ...opt, options: [...dbJobsites].sort() };
    if (opt.id === "position")
      return { ...opt, options: [...dbPositions].sort() };
    if (opt.id === "address") {
      let options = [];
      if (selectedProvince === "ALL CLIENTS") {
        options = Array.from(
          new Set(
            data
              .filter((log) => log.address)
              .map((log) => getDisplayAddress(log)),
          ),
        );
      } else if (selectedProvince === userRole) {
        const pObj = ProvincePlaces.find((p) => p.province === userRole);
        if (pObj) {
          options = pObj.places.map((place) => `${place}, ${userRole}`);
        }
      } else if (selectedProvince === "OTHER PROVINCE") {
        const otherLogs = data.filter(
          (log) =>
            log.province &&
            log.province !== userRole &&
            MIMAROPA_PROVINCES.includes(log.province),
        );
        options = Array.from(new Set(otherLogs.map((log) => log.address)));
      } else if (selectedProvince === "OUTSIDE MIMAROPA") {
        const outsideLogs = data.filter(
          (log) => log.province && !MIMAROPA_PROVINCES.includes(log.province),
        );
        options = Array.from(
          new Set(outsideLogs.map((log) => `${log.address}, ${log.province}`)),
        );
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

  const filteredData = localData.filter((log) => {
    // 0. Region Scope Filter
    let matchesRegion = true;
    if (selectedProvince === "ALL CLIENTS") {
      matchesRegion = true;
    } else if (selectedProvince === userRole) {
      matchesRegion = log.province === userRole;
    } else if (selectedProvince === "OTHER PROVINCE") {
      matchesRegion =
        log.province &&
        log.province !== userRole &&
        MIMAROPA_PROVINCES.includes(log.province);
    } else if (selectedProvince === "OUTSIDE MIMAROPA") {
      matchesRegion =
        log.province && !MIMAROPA_PROVINCES.includes(log.province);
    }

    // 1. Search Query (startsWith for literal exact-prefix matching)
    const matchesSearch =
      searchQuery === "" ||
      log.clientName?.toLowerCase().startsWith(searchQuery.toLowerCase()) ||
      log.nameOfOfw?.toLowerCase().startsWith(searchQuery.toLowerCase());

    // 2. Exact Value Filters
    const logDate = String(log.date || "");
    const matchesDate =
      dateFilterMode === "specific"
        ? !dateSpecific || logDate === dateSpecific
        : dateFilterMode === "year"
          ? !dateYear || logDate.startsWith(`${dateYear}-`)
          : dateFilterMode === "month"
            ? !dateYear ||
              !dateMonth ||
              logDate.startsWith(`${dateYear}-${dateMonth}-`)
            : (!dateFrom || logDate >= dateFrom) &&
              (!dateTo || logDate <= dateTo);
    const matchesJobsite =
      selectedFilters.jobsite?.length === 0 || !selectedFilters.jobsite
        ? true
        : selectedFilters.jobsite.includes(log.jobsite);
    const matchesType =
      selectedFilters.type?.length === 0 || !selectedFilters.type
        ? true
        : selectedFilters.type.includes(normalizeType(log.type));
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
        : selectedFilters.address.includes(getDisplayAddress(log));
    const matchesSurvey =
      selectedFilters.survey?.length === 0 || !selectedFilters.survey
        ? true
        : selectedFilters.survey.includes(log.survey);

    return (
      matchesRegion &&
      matchesSearch &&
      matchesDate &&
      matchesJobsite &&
      matchesType &&
      matchesPosition &&
      matchesPurpose &&
      matchesAddress &&
      matchesSurvey
    );
  });

  const filteredLandbased = filteredData.filter(
    (log) => normalizeType(log.type) === "LANDBASED",
  );
  const filteredSeabased = filteredData.filter(
    (log) => normalizeType(log.type) === "SEABASED",
  );
  const filteredStats = {
    totalClients: filteredData.length,
    totalMales: filteredData.filter(
      (log) => String(log.sex).toUpperCase() === "M",
    ).length,
    totalFemales: filteredData.filter((log) =>
      ["F", "FEMALE"].includes(String(log.sex).toUpperCase()),
    ).length,
    totalLandbased: filteredLandbased.length,
    landbasedMales: filteredLandbased.filter(
      (log) => String(log.sex).toUpperCase() === "M",
    ).length,
    landbasedFemales: filteredLandbased.filter((log) =>
      ["F", "FEMALE"].includes(String(log.sex).toUpperCase()),
    ).length,
    totalSeabased: filteredSeabased.length,
    seabasedMales: filteredSeabased.filter(
      (log) => String(log.sex).toUpperCase() === "M",
    ).length,
    seabasedFemales: filteredSeabased.filter((log) =>
      ["F", "FEMALE"].includes(String(log.sex).toUpperCase()),
    ).length,
  };

  useEffect(() => {
    if (typeof onTallyChange === "function") {
      onTallyChange(filteredStats);
    }
  }, [
    onTallyChange,
    filteredStats.totalClients,
    filteredStats.totalMales,
    filteredStats.totalFemales,
    filteredStats.totalLandbased,
    filteredStats.landbasedMales,
    filteredStats.landbasedFemales,
    filteredStats.totalSeabased,
    filteredStats.seabasedMales,
    filteredStats.seabasedFemales,
  ]);

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
          <div className="flex items-center gap-4">
            {/* search bar */}
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
                placeholder="Search client here..."
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

          <div className="flex items-center gap-2 relative">
            {/* Province Toggle / Navigation */}
            <div className="flex">
              <select
                className="px-4 py-2 text-sm rounded-lg transition-colors duration-150 outline-none cursor-pointer border border-gray-300"
                value={selectedProvince}
                onChange={(e) => {
                  setSelectedProvince(e.target.value);
                  setSelectedFilters({ ...selectedFilters, address: [] });
                  setCurrentPage(1);
                }}
              >
                <option value="ALL CLIENTS">ALL CLIENTS</option>
                <option value={userRole}>{userRole}</option>
                <option value="OTHER PROVINCE">OTHER PROVINCE</option>
                <option value="OUTSIDE MIMAROPA">OUTSIDE MIMAROPA</option>
              </select>
            </div>
            <div className="relative">
              <button
                onClick={() => {
                  setToggleSort(!toggleSort);
                  setToggleFilter(false); // close filter if sort is opened
                }}
                className="px-4 py-2 border text-sm border-gray-300 bg-white rounded-lg flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
              >
                <ArrowUpDown strokeWidth={1.5} className="w-4 h-4" />
                Sort by
                <ChevronDown
                  strokeWidth={1.5}
                  className={`w-4 h-4 transition-transform duration-200 ${toggleSort ? "rotate-180" : ""}`}
                />{" "}
                {/* Changed from ChevronDown */}
              </button>

              {toggleSort && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-300 rounded-lg z-30 flex flex-col py-1 overflow-hidden">
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
              className="px-4 py-2 border text-sm border-gray-300 bg-white  rounded-lg flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
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
          <div className="rounded-lg bg-white border border-gray-300 p-4 flex flex-wrap items-start gap-3 z-20">
            
            {dynamicFilterOptions.map((filter) => {
              const Icon = filter.icon;
              return (
                <div
                  key={filter.id}
                  className={`flex flex-col gap-1 relative ${
                    filter.id === "date"
                      ? "flex-[2_1_360px] min-w-[300px]"
                      : "flex-[1_1_220px] min-w-[220px]"
                  }`}
                >
                  <span className="text-sm text-gray-500">{filter.label}</span>
                  {filter.id === "date" ? (
                    <div className="flex flex-col gap-4">
                      <div className="relative flex items-center w-full">
                        <Icon
                          strokeWidth={1.5}
                          className="w-4 h-4 absolute left-4 z-10 pointer-events-none"
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
                            setCurrentPage(1);
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
                          onChange={(e) => {
                            setDateSpecific(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-100 cursor-pointer transition-colors w-full outline-none focus:border-blue-500 bg-white"
                        />
                      )}

                      {dateFilterMode === "year" && (
                        <select
                          value={dateYear}
                          onChange={(e) => {
                            setDateYear(e.target.value);
                            setDateMonth("");
                            setCurrentPage(1);
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
                              setCurrentPage(1);
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
                            onChange={(e) => {
                              setDateMonth(e.target.value);
                              setCurrentPage(1);
                            }}
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
                            <label
                              htmlFor="date-from"
                              className="text-xs text-gray-500"
                            >
                              From
                            </label>
                            <input
                              type="date"
                              value={dateFrom}
                              onChange={(e) => {
                                setDateFrom(e.target.value);
                                setCurrentPage(1);
                              }}
                              className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-100 cursor-pointer transition-colors w-full outline-none focus:border-blue-500 bg-white"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label
                              htmlFor="date-to"
                              className="text-xs text-gray-500"
                            >
                              To
                            </label>
                            <input
                              type="date"
                              value={dateTo}
                              onChange={(e) => {
                                setDateTo(e.target.value);
                                setCurrentPage(1);
                              }}
                              className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-100 cursor-pointer transition-colors w-full outline-none focus:border-blue-500 bg-white"
                            />
                          </div>
                        </div>
                      )}
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
                        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-md  z-10 max-h-60 overflow-y-auto">
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
                    onClick={() => openEditModal(log)}
                    className="hover:bg-blue-50/50 transition-colors duration-200 border-b border-gray-100 cursor-pointer"
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
                      title={getDisplayAddress(log)}
                    >
                      {getDisplayAddress(log)}
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
                      {getTypeAcronym(log.type)}
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
                  className="isolate inline-flex -space-x-px rounded-md "
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

      {/* update client log modal */}
      {modalState.isOpen && (
        <div className="fixed bg-black/50 inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="relative bg-white rounded-2xl p-6 flex flex-col gap-4 w-full max-w-7xl shadow-2xl my-auto">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 rounded-full p-2 hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
            >
              <X strokeWidth={1.5} className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold">EDIT CLIENT FORM</h1>
            </div>

            <form
              onSubmit={handleSubmit}
              noValidate
              className="flex flex-col gap-4"
            >
              <fieldset
                disabled={status === "submitting"}
                className="border-none p-0 m-0 flex flex-col gap-4 disabled:opacity-50"
              >
                <div className="grid grid-cols-7 gap-4 py-4 rounded-2xl">
                  {/* date (disabled) */}
                  <div className="col-span-1 flex flex-col gap-1">
                    <label className="text-gray-500 text-sm font-medium">
                      DATE
                    </label>
                    <input
                      type="date"
                      disabled
                      defaultValue={modalState.data?.date || ""}
                      className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  {/* province (disabled) */}
                  <div className="col-span-2 flex flex-col gap-1">
                    <label className="text-gray-500 text-sm font-medium">
                      PROVINCE
                    </label>
                    <input
                      type="text"
                      disabled
                      defaultValue={modalState.data?.province || userRole}
                      className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  {/* client name */}
                  <div className="col-span-2 flex flex-col gap-1">
                    <label
                      htmlFor="clientName"
                      className="text-gray-500 text-sm font-medium"
                    >
                      CLIENT NAME
                    </label>
                    <input
                      type="text"
                      name="clientName"
                      id="clientName"
                      required
                      defaultValue={modalState.data?.clientName || ""}
                      className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150"
                    />
                  </div>
                  {/* name of ofw */}
                  <div className="col-span-2 flex flex-col gap-1">
                    <label
                      htmlFor="nameOfOfw"
                      className="text-gray-500 text-sm font-medium"
                    >
                      NAME OF OFW
                    </label>
                    <input
                      type="text"
                      name="nameOfOfw"
                      id="nameOfOfw"
                      required
                      defaultValue={modalState.data?.nameOfOfw || ""}
                      className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150"
                    />
                  </div>

                  {/* age */}
                  <div className="col-span-1 flex flex-col gap-1">
                    <label
                      htmlFor="age"
                      className="text-gray-500 text-sm font-medium"
                    >
                      AGE
                    </label>
                    <input
                      type="number"
                      name="age"
                      id="age"
                      required
                      defaultValue={modalState.data?.age || ""}
                      className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150"
                    />
                  </div>
                  {/* sex */}
                  <div className="col-span-1 flex flex-col gap-1">
                    <label
                      htmlFor="sex"
                      className="text-gray-500 text-sm font-medium"
                    >
                      SEX
                    </label>
                    <select
                      name="sex"
                      id="sex"
                      required
                      defaultValue={modalState.data?.sex || ""}
                      className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150 bg-white cursor-pointer"
                    >
                      <option value="M">M</option>
                      <option value="F">F</option>
                    </select>
                  </div>
                  {/* contact no */}
                  <div className="col-span-1 flex flex-col gap-1">
                    <label
                      htmlFor="contactNo"
                      className="text-gray-500 text-sm font-medium"
                    >
                      CONTACT NO
                    </label>
                    <input
                      type="text"
                      name="contactNo"
                      id="contactNo"
                      defaultValue={
                        modalState.data?.contactNo !== "N/A"
                          ? modalState.data?.contactNo
                          : ""
                      }
                      className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150"
                    />
                  </div>
                  {/* jobsite */}
                  <div className="col-span-1 flex flex-col gap-1">
                    <label
                      htmlFor="jobsite"
                      className="text-gray-500 text-sm font-medium"
                    >
                      JOBSITE
                    </label>
                    <input
                      list="edit-jobsites-list"
                      name="jobsite"
                      id="jobsite"
                      required
                      defaultValue={modalState.data?.jobsite || ""}
                      className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150"
                    />
                    <datalist id="edit-jobsites-list">
                      {[...dbJobsites].sort().map((opt) => (
                        <option key={opt} value={opt} />
                      ))}
                    </datalist>
                  </div>
                  {/* position */}
                  <div className="col-span-2 flex flex-col gap-1">
                    <label
                      htmlFor="position"
                      className="text-gray-500 text-sm font-medium"
                    >
                      POSITION
                    </label>
                    <input
                      list="edit-positions-list"
                      name="position"
                      id="position"
                      required
                      defaultValue={modalState.data?.position || ""}
                      className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150"
                    />
                    <datalist id="edit-positions-list">
                      {[...dbPositions].sort().map((opt) => (
                        <option key={opt} value={opt} />
                      ))}
                    </datalist>
                  </div>
                  {/* type */}
                  <div className="col-span-1 flex flex-col gap-1">
                    <label
                      htmlFor="type"
                      className="text-gray-500 text-sm font-medium"
                    >
                      TYPE
                    </label>
                    <select
                      name="type"
                      id="type"
                      required
                      defaultValue={normalizeType(modalState.data?.type || "")}
                      className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150 bg-white cursor-pointer"
                    >
                      <option value="LANDBASED">LANDBASED</option>
                      <option value="SEABASED">SEABASED</option>
                    </select>
                  </div>

                  {/* address */}
                  <div className="col-span-4 flex flex-col gap-1">
                    <label
                      htmlFor="address"
                      className="text-gray-500 text-sm font-medium"
                    >
                      ADDRESS
                    </label>
                    <select
                      name="address"
                      id="address"
                      required
                      defaultValue={modalState.data?.address || ""}
                      className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150 bg-white cursor-pointer"
                    >
                      <option value="" disabled>
                        Select address
                      </option>
                      {ProvincePlaces.find(
                        (p) =>
                          p.province ===
                          (modalState.data?.province || userRole),
                      )?.places.map((place) => (
                        <option
                          key={place}
                          value={`${place}, ${modalState.data?.province || userRole}`}
                        >
                          {place}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* purpose */}
                  <div className="col-span-2 flex flex-col gap-1">
                    <label
                      htmlFor="purpose"
                      className="text-gray-500 text-sm font-medium"
                    >
                      PURPOSE
                    </label>
                    <select
                      name="purpose"
                      id="purpose"
                      required
                      defaultValue={modalState.data?.purpose || ""}
                      className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150 bg-white cursor-pointer"
                    >
                      <option value="" disabled>
                        Select purpose
                      </option>
                      {[
                        "OEC",
                        "OEC-EXEMPTION",
                        "FINANCIAL ASSISTANCE",
                        "G2G",
                        "PEOS",
                        "INFOSHEET",
                        "LEGAL ASSISTANCE",
                      ].map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* survey */}
                  <div className="col-span-1 flex flex-col gap-1">
                    <label
                      htmlFor="survey"
                      className="text-gray-500 text-sm font-medium"
                    >
                      SURVEY
                    </label>
                    <select
                      name="survey"
                      id="survey"
                      required
                      defaultValue={modalState.data?.survey || ""}
                      className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150 bg-white cursor-pointer"
                    >
                      <option value="GOOD">GOOD</option>
                      <option value="BAD">BAD</option>
                    </select>
                  </div>
                </div>

                {/* submit buttons */}
                <div className="flex items-center justify-end gap-3 mt-2">
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 outline-none text-white rounded-lg transition-colors duration-150 cursor-pointer text-sm font-medium disabled:opacity-50"
                  >
                    {status === "submitting" ? "Updating..." : "Update Log"}
                  </button>
                </div>
              </fieldset>
            </form>
          </div>
        </div>
      )}

      {/* success message */}
      <div
        className={`fixed top-4 right-4 p-4 z-60 bg-green-500 text-white rounded-2xl flex items-center gap-2 transition-all duration-300 transform ${
          status === "success"
            ? "translate-y-0 opacity-100"
            : "-translate-y-10 opacity-0 pointer-events-none"
        }`}
      >
        <CheckCircle strokeWidth={1.5} className="w-5 h-5 shrink-0" />
        <span className="text-sm font-medium">{successMessage}</span>
      </div>

      {/* error message */}
      <div
        className={`fixed top-4 right-4 p-4 z-60 bg-red-500 text-white rounded-2xl flex items-center gap-2 transition-all duration-300 transform ${
          status === "error"
            ? "translate-y-0 opacity-100"
            : "-translate-y-10 opacity-0 pointer-events-none"
        }`}
      >
        <X strokeWidth={1.5} className="w-5 h-5 shrink-0" />
        <span className="text-sm font-medium">{errorMessage}</span>
      </div>
    </div>
  );
}
