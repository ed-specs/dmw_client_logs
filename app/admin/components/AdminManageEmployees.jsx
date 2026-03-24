"use client";

import {
  Plus,
  X,
  CheckCircle,
  ListFilter,
  ChevronDown,
  Briefcase,
  ShieldCheck,
  FileText,
  Trash2,
  ArrowUpDown,
} from "lucide-react";
import { useState } from "react";
import {
  addEmployee,
  updateEmployee,
  deleteEmployee,
} from "../../actions/employeeActions";

const ROLE = [
  "ORIENTAL MINDORO",
  "OCCIDENTAL MINDORO",
  "MARINDUQUE",
  "ROMBLON",
  "PALAWAN",
];

const STATUS = ["ACTIVATED", "PENDING"];

const FILTER_OPTIONS = [
  {
    id: "role",
    label: "Role",
    placeholder: "Select Role",
    icon: Briefcase,
    colClass: "col-span-3",
    options: ROLE,
  },
  {
    id: "status",
    label: "Status",
    placeholder: "Select Status",
    icon: ShieldCheck,
    colClass: "col-span-3",
    options: STATUS,
  },
];

export default function AdminManageEmployees({ initialData = [] }) {
  // State for optimistic updates (could also use router.refresh in real scenario)
  const [employees, setEmployees] = useState(initialData);

  // Modal State: mode can be 'add' or 'edit'. data holds the employee being edited
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: "add",
    data: null,
  });

  // Toast States
  const [status, setStatus] = useState("idle"); // 'idle' | 'submitting' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState(
    "Employee added successfully!",
  );

  // Filter, Sort & Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [toggleFilter, setToggleFilter] = useState(false);
  const [toggleSort, setToggleSort] = useState(false);
  const [sortOrder, setSortOrder] = useState("default"); // 'default' | 'newest' | 'oldest'
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFilters, setSelectedFilters] = useState({
    role: [],
    status: [],
  });
  const [isFocused, setIsFocused] = useState(false);

  // Derived Filtered Data
  const filteredEmployees = employees.filter((emp) => {
    // 1. Search Query
    const matchesSearch =
      searchQuery === "" ||
      emp.name?.toLowerCase().startsWith(searchQuery.toLowerCase()) ||
      emp.email?.toLowerCase().startsWith(searchQuery.toLowerCase());

    // 2. Role Filter (Upper vs lower fallback)
    const matchesRole =
      selectedFilters.role.length === 0 ||
      selectedFilters.role.includes(emp.role?.toUpperCase());

    // 3. Status Filter
    const matchesStatus =
      selectedFilters.status.length === 0 ||
      selectedFilters.status.includes(emp.status?.toLowerCase());

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Derived Sorted Data
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    if (sortOrder === "default") return 0;

    const dateA = new Date(a.created_at || 0).getTime();
    const dateB = new Date(b.created_at || 0).getTime();

    if (sortOrder === "newest") {
      return dateB - dateA; // descending
    } else {
      return dateA - dateB; // ascending
    }
  });

  const totalEmployees = sortedEmployees.length;
  const hasRecords = totalEmployees > 0;

  // Pagination Logic
  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.ceil(totalEmployees / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentLogs = sortedEmployees.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

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
    setCurrentPage(1); // Reset to first page when filtering
  };

  const openAddModal = () =>
    setModalState({ isOpen: true, mode: "add", data: null });
  const openEditModal = (emp) =>
    setModalState({ isOpen: true, mode: "edit", data: emp });
  const closeModal = () =>
    setModalState({ isOpen: false, mode: "add", data: null });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    const requiredFields = ["name", "role"]; // allow disabled email bypass
    if (modalState.mode === "add" && !data.email) requiredFields.push("email");

    const isMissingData = requiredFields.some(
      (field) => !data[field] || data[field].trim() === "",
    );

    if (isMissingData) {
      setErrorMessage("Please fill-up all required fields");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
      return;
    }

    setStatus("submitting");

    if (modalState.mode === "add") {
      try {
        const result = await addEmployee(formData);

        if (!result.success) {
          setErrorMessage(
            result.error || "Failed to add employee! Please try again later.",
          );
          setStatus("error");
          setTimeout(() => setStatus("idle"), 6000);
          return;
        }

        setSuccessMessage("Employee added successfully!");
        setStatus("success");
        e.target.reset(); // clear form

        // Optimistically insert
        setEmployees((prev) => [
          {
            id: Math.random().toString(),
            name: data.name,
            email: data.email,
            role: data.role.toUpperCase(),
            status: "pending",
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);

        setTimeout(() => setStatus("idle"), 6000);
      } catch (error) {
        console.error(error);
        setErrorMessage(
          "An unexpected error occurred. Please try again later.",
        );
        setStatus("error");
        setTimeout(() => setStatus("idle"), 6000);
      }
    } else {
      // EDIT MODE
      try {
        const result = await updateEmployee(formData, modalState.data.id);
        if (!result.success) throw new Error(result.error);

        setSuccessMessage("Employee updated successfully!");
        setStatus("success");
        setEmployees((prev) =>
          prev.map((emp) =>
            emp.id === modalState.data.id
              ? { ...emp, ...data, role: data.role.toUpperCase() }
              : emp,
          ),
        );
        closeModal();
        setTimeout(() => setStatus("idle"), 6000);
      } catch (err) {
        setErrorMessage(err.message || "Failed to update employee");
        setStatus("error");
        setTimeout(() => setStatus("idle"), 6000);
      }
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to completely delete ${modalState.data.name}? This removes their secure access.`,
      )
    )
      return;

    setStatus("submitting");
    try {
      const result = await deleteEmployee(modalState.data.id);
      if (!result.success) throw new Error(result.error);

      setSuccessMessage("Employee deleted successfully!");
      setStatus("success");
      setEmployees((prev) =>
        prev.filter((emp) => emp.id !== modalState.data.id),
      );
      closeModal();
      setTimeout(() => setStatus("idle"), 6000);
    } catch (err) {
      setErrorMessage(err.message || "Failed to delete employee");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 6000);
    }
  };

  return (
    <div className="flex flex-col flex-1 gap-4 p-6 bg-gray-50 h-full overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold w-full">MANAGE EMPLOYEES</h1>
        <button
          onClick={openAddModal}
          className="rounded-lg px-4 py-2 bg-blue-500 hover:bg-blue-600 transition-colors duration-150 cursor-pointer text-white flex items-center gap-2 shrink-0"
        >
          <Plus strokeWidth={1.5} className="w-5 h-5" />
          Add Employee
        </button>
      </div>

      {/* main table and filters */}
      <div className="flex flex-col gap-2 flex-1 mt-2 min-h-0">
        <div className="flex flex-col gap-3 bg-white p-4 rounded-2xl border border-gray-300">
          {/* filter header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="text"
                name="search"
                placeholder="Search employee by name or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                onInput={() => setIsFocused(true)}
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

            <div className="flex gap-2 relative">
              <div className="relative">
                <button
                  onClick={() => {
                    setToggleSort(!toggleSort);
                    setToggleFilter(false); // close filter if sort is opened
                  }}
                  className="px-4 py-2 border text-sm border-gray-300 bg-white  rounded-lg flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                >
                  <ArrowUpDown strokeWidth={1.5} className="w-4 h-4" />
                  Sort by
                  <ChevronDown
                    strokeWidth={1.5}
                    className={`w-4 h-4 transition-transform duration-200 ${toggleSort ? "rotate-180" : ""}`}
                  />
                </button>

                {toggleSort && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-300 rounded-lg  z-30 flex flex-col py-1 overflow-hidden">
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

              <button
                onClick={() => {
                  setToggleFilter(!toggleFilter);
                  setToggleSort(false); // close sort if filter is opened
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
            <div className="rounded-lg bg-white border border-gray-300 p-4 grid grid-cols-6 gap-3 z-20">
              {FILTER_OPTIONS.map((filter) => {
                const Icon = filter.icon;
                return (
                  <div
                    key={filter.id}
                    className={`${filter.colClass} flex flex-col gap-1 flex-1 relative`}
                  >
                    <span className="text-sm text-gray-500">
                      {filter.label}
                    </span>
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
                        className={`w-5 h-5 absolute right-2 transition-transform duration-200 ${activeDropdown === filter.id ? "rotate-180" : ""}`}
                      />
                    </button>

                    {/* Dropdown Options */}
                    {activeDropdown === filter.id && (
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
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* tables */}
        <div className="bg-white rounded-lg  border border-gray-300 overflow-hidden flex flex-col mt-2 flex-1 min-h-0">
          <div className="overflow-x-auto overflow-y-auto flex-1 h-0 w-full relative">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-300 text-gray-700 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-3 text-xs font-semibold tracking-wider border-r border-gray-200 text-center w-12">
                    NO.
                  </th>
                  <th className="px-3 py-3 text-xs font-semibold tracking-wider border-r border-gray-200">
                    NAME
                  </th>
                  <th className="px-3 py-3 text-xs font-semibold tracking-wider border-r border-gray-200">
                    EMAIL
                  </th>
                  <th className="px-3 py-3 text-xs font-semibold tracking-wider border-r border-gray-200">
                    ROLE
                  </th>
                  <th className="px-3 py-3 text-xs font-semibold tracking-wider border-r border-gray-200 text-center">
                    STATUS
                  </th>
                  <th className="px-3 py-3 text-xs font-semibold tracking-wider border-r border-gray-200">
                    DATE CREATED
                  </th>
                  <th className="px-3 py-3 text-xs font-semibold tracking-wider text-center w-24">
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {hasRecords ? (
                  currentLogs.map((emp, index) => (
                    <tr
                      key={emp.id}
                      className="hover:bg-blue-50/50 transition-colors duration-200 border-b border-gray-100"
                    >
                      <td className="px-3 py-3 text-xs text-gray-500 border-r border-gray-200 text-center">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-900 border-r border-gray-200 font-semibold">
                        {emp.name || "N/A"}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-700 border-r border-gray-200">
                        {emp.email || "N/A"}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-700 border-r border-gray-200 font-medium">
                        {emp.role?.toUpperCase() || "N/A"}
                      </td>
                      <td className="px-3 py-3 text-xs border-r border-gray-200 text-center">
                        <span
                          className={`px-2 py-1 rounded-full font-medium ${emp.status === "activated" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                        >
                          {emp.status?.toUpperCase() || "PENDING"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-500 border-r border-gray-200 font-medium">
                        {emp.created_at
                          ? new Date(emp.created_at).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )
                          : "N/A"}
                      </td>
                      <td className="px-3 py-3 text-xs text-center border-gray-200 align-middle">
                        <button
                          onClick={() => openEditModal(emp)}
                          className="text-blue-500 hover:text-blue-700 hover:underline font-medium p-1 cursor-pointer"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-5 py-16 text-center text-gray-500 "
                    >
                      <div className="flex flex-col items-center justify-center">
                        <FileText
                          strokeWidth={1}
                          className="w-16 h-16 text-gray-300 mb-4"
                        />
                        <h3 className="text-lg font-semibold text-gray-700">
                          No employees found
                        </h3>
                        <p className="mt-1.5 text-sm text-gray-500">
                          There are currently no employees matching your filters
                          or search query.
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
            <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between bg-white sm:px-6 z-10 shrink-0">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
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
                    Showing{" "}
                    <span className="font-medium">{startIndex + 1}</span> to{" "}
                    <span className="font-medium">
                      {Math.min(startIndex + ITEMS_PER_PAGE, totalEmployees)}
                    </span>{" "}
                    of <span className="font-medium">{totalEmployees}</span>{" "}
                    results
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
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus-visible:outline-none focus-visible:outline-offset-0 focus-visible:outline-blue-600 ${currentPage === i + 1 ? "z-10 bg-blue-600 text-white" : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"}`}
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

      {/* add/update new employee modal */}
      {modalState.isOpen && (
        <div className="fixed bg-black/50 inset-0 flex items-center justify-center z-50">
          <div className="relative bg-white rounded-2xl p-6 flex flex-col gap-4 max-w-lg w-full shadow-2xl">
            {/* close button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 rounded-full p-2 hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
            >
              <X strokeWidth={1.5} className="w-5 h-5" />
            </button>
            {/* header */}
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold">
                {modalState.mode === "add"
                  ? "Add New Employee"
                  : "Manage Employee"}
              </h1>
            </div>
            {/* form */}
            <form
              onSubmit={handleSubmit}
              noValidate
              className="flex flex-col gap-4"
            >
              {/* name */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="name"
                  className="text-gray-500 text-sm font-medium"
                >
                  NAME
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  defaultValue={modalState.data?.name || ""}
                  placeholder="Enter name"
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150"
                />
              </div>

              {/* email */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="email"
                  className="text-gray-500 text-sm font-medium"
                >
                  EMAIL
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required={modalState.mode === "add"} // Only strictly required HTML-side if add mode because its disabled in edit
                  disabled={modalState.mode === "edit"} // Don't let them edit email if auth handles it
                  defaultValue={modalState.data?.email || ""}
                  placeholder="Enter email"
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150 disabled:bg-gray-100 disabled:text-gray-400"
                />
                {modalState.mode === "add" && (
                  <span className="text-xs text-gray-500">
                    Note: This email will be used to sent the invitation
                    alongside the temporary password.
                  </span>
                )}
              </div>

              {/* role */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="role"
                  className="text-gray-500 text-sm font-medium"
                >
                  ROLE
                </label>
                <select
                  name="role"
                  id="role"
                  required
                  defaultValue={modalState.data?.role?.toUpperCase() || ""}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150 bg-white cursor-pointer"
                >
                  <option value="" disabled>
                    Select role
                  </option>
                  {ROLE.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {/* submit buttons */}
              <div className="flex items-center justify-center gap-3 mt-2">
                {modalState.mode === "add" ? (
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="rounded-lg px-4 py-2 bg-blue-500 hover:bg-blue-600 transition-colors duration-150 cursor-pointer text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus strokeWidth={1.5} className="w-5 h-5 shrink-0" />
                    {status === "submitting" ? "Submitting..." : "Add Employee"}
                  </button>
                ) : (
                  <>
                    <button
                      type="submit"
                      disabled={status === "submitting"}
                      className="rounded-lg flex-1 py-2 bg-blue-500 hover:bg-blue-600 transition-colors duration-150 cursor-pointer text-white disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {status === "submitting" ? "Updating..." : "Update"}
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={status === "submitting"}
                      className="rounded-lg flex-1 py-2 bg-red-500 hover:bg-red-600 transition-colors duration-150 cursor-pointer text-white flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      <Trash2 strokeWidth={1.5} className="w-4 h-4" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* success message */}
      <div
        className={`fixed top-4 right-4 p-4 z-60 bg-green-500 text-white rounded-2xl flex items-center gap-2  transition-all duration-300 transform max-w-sm ${status === "success" ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0 pointer-events-none"}`}
      >
        <CheckCircle strokeWidth={1.5} className="w-5 h-5 shrink-0" />
        <span className="text-sm font-medium leading-tight">
          {successMessage}
        </span>
      </div>

      {/* error message */}
      <div
        className={`fixed top-4 right-4 p-4 z-60 bg-red-500 text-white rounded-2xl flex items-center gap-2  transition-all duration-300 transform ${status === "error" ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0 pointer-events-none"}`}
      >
        <X strokeWidth={1.5} className="w-5 h-5" />
        {errorMessage}
      </div>
    </div>
  );
}
