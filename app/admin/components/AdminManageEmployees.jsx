"use client";
import { useEffect, useState } from "react";

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
  Eye,
  EyeOff,
} from "lucide-react";

import {
  addEmployee,
  updateEmployee,
  deactivateEmployee,
  activateEmployeeStatus,
  fetchEmployeesForAdmin,
  resetEmployeePassword,
} from "../../actions/employeeActions";

import { createClient } from "../../lib/supabaseClient";
import { useToaster } from "../../hooks/useToaster";
import Toaster from "../../components/Toaster";

const ROLE = [
  "ORIENTAL MINDORO",
  "OCCIDENTAL MINDORO",
  "MARINDUQUE",
  "ROMBLON",
  "PALAWAN",
  "ADMIN",
];

const STATUS = ["ACTIVATED", "PENDING", "DEACTIVATED"];

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

  // Used for add-mode UX: lock role selection until name + email are filled.
  const [draftName, setDraftName] = useState("");
  const [draftEmail, setDraftEmail] = useState("");
  const [draftRole, setDraftRole] = useState("");
  const [status, setStatus] = useState("idle"); // 'idle' | 'submitting'
  
  // Toaster system
  const { toasts, showSuccess, showError, removeToast } = useToaster();

  // Modal State: mode can be 'add' or 'edit'. data holds the employee being edited
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: "add",
    data: null,
  });

  // Action state for edit mode
  const [selectedAction, setSelectedAction] = useState(null); // 'name', 'email', 'role', 'reset-password'
  
  // State for tracking edited values in edit mode
  const [editedValues, setEditedValues] = useState({
    name: "",
    email: "",
    role: "",
  });

  // Validation states
  const [validationErrors, setValidationErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [showPasswords, setShowPasswords] = useState({
    admin_password: false,
    admin_password_confirm: false,
  });

  // Keep local optimistic state in sync with fresh server data.
  useEffect(() => {
    if (!modalState.isOpen) setEmployees(initialData);
  }, [initialData, modalState.isOpen]);

  // Realtime updates for presence (last_seen_at/last_offline_at) and
  // account status (activated/deactivated).
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("profiles-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          const updated = payload.new;
          if (!updated?.id) return;

          setEmployees((prev) =>
            prev.map((emp) =>
              emp.id === updated.id ? { ...emp, ...updated } : emp,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          const inserted = payload.new;
          if (!inserted?.id) return;

          setEmployees((prev) =>
            prev.some((emp) => emp.id === inserted.id)
              ? prev
              : [inserted, ...prev],
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Confirmation Modal State
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    action: null, // 'deactivate' or 'activate' or 'update'
    employee: null,
    changes: null, // for update action
  });

  const openConfirmationModal = (action, employee, changes = null) => {
    setConfirmationModal({ isOpen: true, action, employee, changes });
    setStatus("idle"); // Ensure status is idle when opening confirmation modal
  };

  const closeConfirmationModal = () => {
    setConfirmationModal({
      isOpen: false,
      action: null,
      employee: null,
      changes: null,
    });
    setStatus("idle"); // Reset status when closing confirmation modal
    // Clear validation errors for confirmation modal
    setValidationErrors((prev) => {
      const { admin_password_confirm, ...rest } = prev;
      return rest;
    });
    setTouchedFields((prev) => {
      const { admin_password_confirm, ...rest } = prev;
      return rest;
    });
  };

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

  const normalizeAccountStatus = (s) =>
    String(s || "")
      .trim()
      .toUpperCase();

  // Validation functions
  const validateField = (fieldName, value, mode = "add") => {
    const errors = { ...validationErrors };

    switch (fieldName) {
      case "name":
        if (!value || value.trim() === "") {
          errors[fieldName] = "Name is required";
        } else if (value.trim().length < 2) {
          errors[fieldName] = "Name must be at least 2 characters";
        } else if (!/^[a-zA-Z\s\.\-']+$/.test(value.trim())) {
          errors[fieldName] =
            "Name can only contain letters, spaces, dots, hyphens, and apostrophes";
        } else {
          delete errors[fieldName];
        }
        break;

      case "email":
        if (mode === "add" && (!value || value.trim() === "")) {
          errors[fieldName] = "Email is required";
        } else if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          errors[fieldName] = "Please enter a valid email address";
        } else {
          delete errors[fieldName];
        }
        break;

      case "role":
        if (!value || value.trim() === "") {
          errors[fieldName] = "Role is required";
        } else {
          delete errors[fieldName];
        }
        break;

      case "admin_password":
        if (!value || value.trim() === "") {
          errors[fieldName] = "Admin password is required";
        } else if (value.length < 6) {
          errors[fieldName] = "Password must be at least 6 characters";
        } else {
          delete errors[fieldName];
        }
        break;

      case "admin_password_confirm":
        if (!value || value.trim() === "") {
          errors[fieldName] = "Admin password confirmation is required";
        } else {
          delete errors[fieldName];
        }
        break;

      default:
        break;
    }

    setValidationErrors(errors);
    return !errors[fieldName];
  };

  const handleFieldChange = (fieldName, value, mode = "add") => {
    validateField(fieldName, value, mode);

    // Update draft states for add mode
    if (mode === "add") {
      if (fieldName === "name") setDraftName(value);
      if (fieldName === "email") setDraftEmail(value);
    } else if (mode === "edit") {
      // Update edited values for edit mode
      if (fieldName === "name" || fieldName === "email" || fieldName === "role") {
        setEditedValues(prev => ({
          ...prev,
          [fieldName]: value
        }));
      }
    }
  };

  const handleFieldBlur = (fieldName, value, mode = "add") => {
    setTouchedFields((prev) => ({ ...prev, [fieldName]: true }));
    validateField(fieldName, value, mode);
  };

  const handleFieldFocus = (fieldName) => {
    setTouchedFields((prev) => ({ ...prev, [fieldName]: false }));
  };

  const togglePasswordVisibility = (fieldName) => {
    setShowPasswords((prev) => ({ ...prev, [fieldName]: !prev[fieldName] }));
  };

  // Helper function to convert form data to uppercase (excluding email and password fields)
  const convertToUpperCase = (data) => {
    const upperCaseData = { ...data };
    const fieldsToExclude = ['email', 'admin_password', 'admin_password_confirm', 'password', 'password_confirm'];
    
    Object.keys(upperCaseData).forEach(key => {
      if (!fieldsToExclude.includes(key) && typeof upperCaseData[key] === 'string') {
        upperCaseData[key] = upperCaseData[key].toUpperCase();
      }
    });
    
    return upperCaseData;
  };

  // Presence is tracked with:
  // - `profiles.last_seen_at`: set while user is logged in
  // - `profiles.last_offline_at`: set when user logs out (offline start time)
  const getOfflineSinceMs = (emp) => {
    if (!emp.last_offline_at) return null;
    const ms = new Date(emp.last_offline_at).getTime();
    return Number.isFinite(ms) ? ms : null;
  };

  const formatOfflineDuration = (sinceMs) => {
    if (!sinceMs) return "";
    const diffMs = Date.now() - sinceMs;
    if (diffMs < 0) return "";

    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`;

    const hours = Math.floor(diffMs / 3600000);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"}`;

    const days = Math.floor(diffMs / 86400000);
    if (days < 30) return `${days} day${days === 1 ? "" : "s"}`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;

    const years = Math.floor(months / 12);
    return `${years} year${years === 1 ? "" : "s"}`;
  };

  const isOnline = (emp) =>
    emp.last_seen_at != null && String(emp.last_seen_at).trim() !== "";

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
      selectedFilters.status.includes(String(emp.status || "").toUpperCase());

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

  const openAddModal = () => {
    setDraftName("");
    setDraftEmail("");
    setDraftRole("");
    setValidationErrors({});
    setTouchedFields({});
    setShowPasswords({
      admin_password: false,
      admin_password_confirm: false,
    });
    setModalState({ isOpen: true, mode: "add", data: null });
  };
  const openEditModal = (emp) => {
    setValidationErrors({});
    setTouchedFields({});
    setShowPasswords({
      admin_password: false,
      admin_password_confirm: false,
    });
    // Initialize edited values with current employee data
    setEditedValues({
      name: emp.name || "",
      email: emp.email || "",
      role: emp.role?.toUpperCase() || "",
    });
    setModalState({ isOpen: true, mode: "edit", data: emp });
    setSelectedAction(null); // Reset selected action when opening modal
  };
  const closeModal = () => {
    setDraftName("");
    setDraftEmail("");
    setDraftRole("");
    setValidationErrors({});
    setTouchedFields({});
    setShowPasswords({
      admin_password: false,
      admin_password_confirm: false,
    });
    setModalState({ isOpen: false, mode: "add", data: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Define required fields for add mode
    const requiredFields = ["name", "email", "admin_password", "role"];
    let hasValidationErrors = false;

    if (modalState.mode === "add") {
      // ADD MODE - Validate all fields

      // Validate all required fields
      for (const field of requiredFields) {
        const isValid = validateField(field, data[field], "add");
        if (!isValid) {
          hasValidationErrors = true;
        }
      }
    }

    // Mark all required fields as touched
    const touched = {};
    requiredFields.forEach((field) => {
      touched[field] = true;
    });
    setTouchedFields(touched);

    if (hasValidationErrors) {
      showError("Please fix all validation errors before submitting");
      return;
    }

    setStatus("submitting");

    if (modalState.mode === "add") {
      try {
        // Convert form data to uppercase (excluding email and password)
        const upperCaseData = convertToUpperCase(data);
        const upperCaseFormData = new FormData();
        Object.keys(upperCaseData).forEach(key => {
          upperCaseFormData.append(key, upperCaseData[key]);
        });

        const result = await addEmployee(upperCaseFormData);

        if (!result.success) {
          showError(result.error || "Failed to add employee! Please try again later.");
          return;
        }

        showSuccess("Employee added successfully!");
        e.target.reset(); // clear form
        setDraftName("");
        setDraftEmail("");

        // Optimistically insert
        setEmployees((prev) => [
          {
            id: Math.random().toString(),
            name: upperCaseData.name,
            email: data.email, // Keep email as-is
            role: upperCaseData.role,
            status: "pending",
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);

        setTimeout(() => setStatus("idle"), 6000);
      } catch (error) {
        console.error(error);
        showError("An unexpected error occurred. Please try again later.");
      }
    } else {
      // EDIT MODE - Only validate the specific field being updated
      if (!selectedAction || (!data[selectedAction] && !editedValues[selectedAction])) {
        showError("Please select an action and make changes");
        return;
      }

      // Validate only the specific field being updated
      const fieldToValidate =
        selectedAction === "reset-password"
          ? "admin_password_confirm"
          : selectedAction;
      const isValid = validateField(
        fieldToValidate,
        data[fieldToValidate],
        "edit",
      );

      if (!isValid) {
        setTouchedFields({ [fieldToValidate]: true });
        showError("Please fix the validation error");
        return;
      }

      // Determine what changed based on selectedAction
      let changes = {};
      if (selectedAction && (data[selectedAction] || editedValues[selectedAction])) {
        const field = selectedAction;
        // Use editedValues for edit mode, form data for reset-password
        const newValue = field === "reset-password" ? data[field] : editedValues[field];
        const oldValue = modalState.data[field];
        if (field === "role") {
          if (newValue !== oldValue?.toUpperCase()) {
            changes[field] = newValue;
          }
        } else {
          if (newValue !== oldValue) {
            changes[field] = newValue;
          }
        }
      }

      if (Object.keys(changes).length > 0) {
        openConfirmationModal("update", modalState.data, changes);
      } else if (selectedAction === "reset-password") {
        // Reset password is handled separately, no confirmation needed
        setSelectedAction(null);
      } else {
        showError("No changes detected. Please select an action and make changes.");
      }
    }
  };

  const handleUpdate = async () => {
    // Validate confirmation password before proceeding
    const confirmationForm = document.querySelector(
      '[name="admin_password_confirm"]',
    );
    const adminPassword = confirmationForm ? confirmationForm.value : "";

    // Validate the confirmation password
    const isPasswordValid = validateField(
      "admin_password_confirm",
      adminPassword,
      "edit",
    );
    setTouchedFields((prev) => ({ ...prev, admin_password_confirm: true }));

    if (!isPasswordValid) {
      showError("Please enter a valid admin password");
      return;
    }

    setStatus("submitting");
    try {
      // Apply the changes from confirmationModal.changes
      const updateData = {
        name: confirmationModal.changes.name || confirmationModal.employee.name,
        email:
          confirmationModal.changes.email || confirmationModal.employee.email,
        role: confirmationModal.changes.role || confirmationModal.employee.role,
        admin_password: adminPassword,
      };

      // Convert update data to uppercase (excluding email and password)
      const upperCaseUpdateData = convertToUpperCase(updateData);

      const result = await updateEmployee(
        upperCaseUpdateData,
        confirmationModal.employee.id,
      );
      if (!result.success) throw new Error(result.error);

      const successMessage = result.emailChanged
        ? "Employee updated successfully! Email change requires user confirmation."
        : "Employee updated successfully!";

      showSuccess(successMessage);
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === confirmationModal.employee.id
            ? {
                ...emp,
                ...upperCaseUpdateData,
                role: upperCaseUpdateData.role,
                ...(result.emailChanged && { email: upperCaseUpdateData.email }),
              }
            : emp,
        ),
      );
      closeModal();
      closeConfirmationModal();
      setSelectedAction(null);
      setTimeout(() => setStatus("idle"), 6000);
    } catch (err) {
      showError(err.message || "Failed to update employee");
    }
  };

  const handleActivate = async () => {
    setStatus("submitting");
    try {
      const result = await activateEmployeeStatus(
        confirmationModal.employee.id,
      );
      if (!result.success) throw new Error(result.error);

      showSuccess("Employee activated successfully!");
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === confirmationModal.employee.id
            ? { ...emp, status: "ACTIVATED" }
            : emp,
        ),
      );
      closeModal();
      closeConfirmationModal();
      setTimeout(() => setStatus("idle"), 6000);
    } catch (err) {
      showError(err.message || "Failed to activate employee");
    }
  };

  const handleDeactivate = async () => {
    setStatus("submitting");
    try {
      const result = await deactivateEmployee(confirmationModal.employee.id);
      if (!result.success) throw new Error(result.error);

      showSuccess("Employee deactivated successfully!");
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === confirmationModal.employee.id
            ? { ...emp, status: "DEACTIVATED" }
            : emp,
        ),
      );
      closeModal();
      closeConfirmationModal();
      setTimeout(() => setStatus("idle"), 6000);
    } catch (err) {
      showError(err.message || "Failed to deactivate employee");
    }
  };

  const handleResetPassword = async () => {
    if (
      !window.confirm(
        `Are you sure you want to reset the password for ${modalState.data.name}? A temporary password will be sent to their email.`,
      )
    ) {
      return;
    }

    setStatus("submitting");
    try {
      const result = await resetEmployeePassword(modalState.data.id);
      if (!result.success) throw new Error(result.error);

      showSuccess(
        "Password reset successfully! Temporary password sent to employee's email.",
      );
      setTimeout(() => setStatus("idle"), 6000);
    } catch (err) {
      showError(err.message || "Failed to reset password");
    }
  };

  const handleRefreshTable = async () => {
    setStatus("submitting");
    try {
      const result = await fetchEmployeesForAdmin();
      if (!result.success) throw new Error(result.error);
      setEmployees(result.employees || []);
      showSuccess("Table refreshed.");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      showError(err.message || "Failed to refresh table");
    }
  };

  const totalEmployeesCount = employees.length;
  const loggedInEmployeesCount = employees.filter((emp) =>
    isOnline(emp),
  ).length;
  const notLoggedInEmployeesCount =
    totalEmployeesCount - loggedInEmployeesCount;

  return (
    <div className="flex flex-col flex-1 gap-4 p-4 bg-gray-50 h-full overflow-hidden">
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

      {/* main */}
      <div className="flex flex-col flex-1 gap-6 min-h-0">
        <div className="flex flex-col flex-1 gap-6 min-h-0">
          {/* tallys */}
          <div className="flex gap-3">
            {/* total employees */}
            <div className="rounded-2xl px-5 py-4 bg-white  flex flex-1 items-center justify-between gap-1 border border-gray-300">
              <div className="flex flex-col gap-1">
                <span className=" font-semibold text-sm text-gray-500">
                  TOTAL EMPLOYEES
                </span>
                <h1 className="text-2xl font-bold">{totalEmployeesCount}</h1>
              </div>

              <div className="flex items-center justify-center gap-6">
                {/* males */}
                <div className="flex flex-col items-center justify-cente gap-1">
                  <span className="text-xs text-gray-500 font-medium">
                    LOGGED IN
                  </span>
                  <h1 className="text-2xl font-bold">
                    {loggedInEmployeesCount}
                  </h1>
                </div>

                {/* females */}
                <div className="flex flex-col items-center justify-cente gap-1">
                  <span className="text-xs text-gray-500 font-medium">
                    NOT LOGGED IN
                  </span>
                  <h1 className="text-2xl font-bold">
                    {notLoggedInEmployeesCount}
                  </h1>
                </div>
              </div>
            </div>
          </div>

          {/* main table and filters */}
          <div className="flex flex-col gap-2 flex-1">
            <div className="relative flex flex-col gap-3 bg-white p-4 rounded-2xl border border-gray-300">
              {/* filter header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRefreshTable}
                    disabled={status === "submitting"}
                    className="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Refresh Table
                  </button>
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

                <div className="flex items-center gap-2 relative">
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
                      setActiveDropdown(null);
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
              <div
                className={`absolute left-4 right-4 top-[calc(100%-2px)] rounded-lg bg-white border border-gray-300 p-4 z-20 shadow-xl origin-top transition-all duration-200 ${
                  toggleFilter
                    ? "opacity-100 scale-y-100 translate-y-2 pointer-events-auto"
                    : "opacity-0 scale-y-95 -translate-y-1 pointer-events-none"
                }`}
              >
                <div className="mb-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFilters({ role: [], status: [] });
                      setActiveDropdown(null);
                      setCurrentPage(1);
                    }}
                    className="text-sm rounded-md border border-gray-300 bg-white px-3 py-1.5 font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-50 cursor-pointer"
                  >
                    Reset filters
                  </button>
                </div>
                <div className="grid grid-cols-6 gap-3">
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
                          <Icon
                            strokeWidth={1.5}
                            className="w-4 h-4 shrink-0"
                          />
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
              </div>
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
                        ACCOUNT STATUS
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
                              className={`px-2 py-1 rounded-full font-medium ${
                                normalizeAccountStatus(emp.status) ===
                                "ACTIVATED"
                                  ? "bg-green-100 text-green-700"
                                  : normalizeAccountStatus(emp.status) ===
                                      "DEACTIVATED"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {normalizeAccountStatus(emp.status) || "PENDING"}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-xs border-r border-gray-200 text-center">
                            {isOnline(emp) ? (
                              <span className="px-2 py-1 rounded-full font-medium bg-green-100 text-green-700">
                                online
                              </span>
                            ) : (
                              <span className="inline-flex flex-col">
                                <span className="px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-700">
                                  offline
                                </span>
                                <span className="mt-1 block text-[11px] text-gray-500">
                                  {(() => {
                                    const sinceMs = getOfflineSinceMs(emp);
                                    const duration =
                                      formatOfflineDuration(sinceMs);
                                    return duration ? `${duration} ago` : "";
                                  })()}
                                </span>
                              </span>
                            )}
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
                          colSpan="8"
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
                              There are currently no employees matching your
                              filters or search query.
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
                          {Math.min(
                            startIndex + ITEMS_PER_PAGE,
                            totalEmployees,
                          )}
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
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages),
                            )
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
        </div>
      </div>

      {/* add/update new employee modal */}
      {modalState.isOpen && (
        <div className="fixed bg-black/50 inset-0 flex items-center justify-center z-50">
          <div className="relative bg-white rounded-2xl p-6 flex flex-col gap-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* close button */}
            <button
              onClick={() => {
                closeModal();
                setSelectedAction(null);
              }}
              className="absolute top-4 right-4 rounded-full p-2 hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
            >
              <X strokeWidth={1.5} className="w-5 h-5" />
            </button>
            {/* header */}
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold">
                {modalState.mode === "add"
                  ? "Add New Employee"
                  : "Manage Employee"}
              </h1>
            </div>

            {/* form */}
            <form
              onSubmit={handleSubmit}
              noValidate
              className="flex flex-col gap-6"
            >
              {/* INFORMATION SECTION */}
              <div className="flex flex-col gap-4">
                <h2 className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  INFORMATION
                </h2>

                {/* name */}
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="name"
                    className="text-gray-500 text-sm font-medium"
                  >
                    NAME
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      disabled={
                        modalState.mode === "edit" && selectedAction !== "name"
                      }
                      value={
                        modalState.mode === "add"
                          ? draftName
                          : selectedAction === "name"
                          ? editedValues.name
                          : modalState.data?.name || ""
                      }
                      onChange={(e) => {
                        handleFieldChange(
                          "name",
                          e.target.value,
                          modalState.mode,
                        );
                      }}
                      onFocus={() => handleFieldFocus("name")}
                      onBlur={(e) =>
                        handleFieldBlur("name", e.target.value, modalState.mode)
                      }
                      placeholder="Enter name"
                      className={`w-full px-4 py-2 text-sm rounded-lg border transition-colors duration-150 ${
                        modalState.mode === "edit" && selectedAction !== "name"
                          ? "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                          : touchedFields.name && validationErrors.name
                            ? "border-red-500 focus:border-red-500"
                            : "border-gray-300 focus:border-blue-500"
                      }`}
                    />
                    {touchedFields.name && validationErrors.name && (
                      <span className="absolute -bottom-5 right-0 text-xs text-red-500">
                        {validationErrors.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* email */}
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="email"
                    className="text-gray-500 text-sm font-medium"
                  >
                    EMAIL
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      required={modalState.mode === "add"}
                      disabled={
                        modalState.mode === "edit" && selectedAction !== "email"
                      }
                      value={
                        modalState.mode === "add"
                          ? draftEmail
                          : selectedAction === "email"
                          ? editedValues.email
                          : modalState.data?.email || ""
                      }
                      onChange={(e) => {
                        handleFieldChange(
                          "email",
                          e.target.value,
                          modalState.mode,
                        );
                      }}
                      onFocus={() => handleFieldFocus("email")}
                      onBlur={(e) =>
                        handleFieldBlur(
                          "email",
                          e.target.value,
                          modalState.mode,
                        )
                      }
                      placeholder="Enter email"
                      className={`w-full px-4 py-2 text-sm rounded-lg border transition-colors duration-150 ${
                        modalState.mode === "edit" && selectedAction !== "email"
                          ? "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                          : touchedFields.email && validationErrors.email
                            ? "border-red-500 focus:border-red-500"
                            : "border-gray-300 focus:border-blue-500"
                      }`}
                    />
                    {touchedFields.email && validationErrors.email && (
                      <span className="absolute -bottom-5 right-0 text-xs text-red-500">
                        {validationErrors.email}
                      </span>
                    )}
                  </div>
                  {modalState.mode === "edit" && selectedAction === "email" && (
                    <span className="text-xs text-gray-500 mt-4">
                      Changing email will require user confirmation via email.
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
                  <div className="relative">
                    <select
                      name="role"
                      id="role"
                      required
                      disabled={
                        modalState.mode === "edit" && selectedAction !== "role"
                      }
                      value={
                        modalState.mode === "add"
                          ? draftRole
                          : selectedAction === "role"
                          ? editedValues.role
                          : modalState.data?.role?.toUpperCase() || ""
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        if (modalState.mode === "add") {
                          setDraftRole(value);
                        }
                        handleFieldChange("role", value, modalState.mode);
                      }}
                      onFocus={() => handleFieldFocus("role")}
                      onBlur={(e) =>
                        handleFieldBlur("role", e.target.value, modalState.mode)
                      }
                      className={`w-full px-4 py-2 text-sm rounded-lg border transition-colors duration-150 bg-white ${
                        modalState.mode === "edit" && selectedAction !== "role"
                          ? "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                          : touchedFields.role && validationErrors.role
                            ? "border-red-500 focus:border-red-500"
                            : "border-gray-300 focus:border-blue-500 cursor-pointer"
                      }`}
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
                    {touchedFields.role && validationErrors.role && (
                      <span className="absolute -bottom-5 right-0 text-xs text-red-500">
                        {validationErrors.role}
                      </span>
                    )}
                  </div>
                </div>

                {/* admin password (add mode only) */}
                {modalState.mode === "add" && (
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="admin_password"
                      className="text-gray-500 text-sm font-medium"
                    >
                      ADMIN PASSWORD
                    </label>
                    <div className="relative">
                      <input
                        type={
                          showPasswords.admin_password ? "text" : "password"
                        }
                        name="admin_password"
                        id="admin_password"
                        required
                        placeholder="Enter your admin password"
                        onChange={(e) => {
                          handleFieldChange(
                            "admin_password",
                            e.target.value,
                            modalState.mode,
                          );
                        }}
                        onFocus={() => handleFieldFocus("admin_password")}
                        onBlur={(e) =>
                          handleFieldBlur(
                            "admin_password",
                            e.target.value,
                            modalState.mode,
                          )
                        }
                        className={`w-full px-4 py-2 pr-10 text-sm rounded-lg border transition-colors duration-150 ${
                          touchedFields.admin_password &&
                          validationErrors.admin_password
                            ? "border-red-500 focus:border-red-500"
                            : "border-gray-300 focus:border-blue-500"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          togglePasswordVisibility("admin_password")
                        }
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      >
                        {showPasswords.admin_password ? (
                          <EyeOff strokeWidth={1.5} className="w-4 h-4" />
                        ) : (
                          <Eye strokeWidth={1.5} className="w-4 h-4" />
                        )}
                      </button>
                      {touchedFields.admin_password &&
                        validationErrors.admin_password && (
                          <span className="absolute -bottom-5 right-0 text-xs text-red-500">
                            {validationErrors.admin_password}
                          </span>
                        )}
                    </div>
                  </div>
                )}
              </div>

              {/* ACTIONS SECTION (edit mode only) */}
              {modalState.mode === "edit" && (
                <div className="flex flex-col gap-4">
                  <h2 className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-2">
                    ACTIONS
                  </h2>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const newAction = selectedAction === "name" ? null : "name";
                        setSelectedAction(newAction);
                        // Reset edited values when switching to this action
                        if (newAction === "name") {
                          setEditedValues(prev => ({
                            ...prev,
                            name: modalState.data?.name || ""
                          }));
                        }
                      }}
                      className={`px-4 py-3 text-sm rounded-lg border transition-colors duration-150 font-medium ${
                        selectedAction === "name"
                          ? "border-blue-300 bg-blue-500 text-white"
                          : "border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      Change Name
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const newAction = selectedAction === "email" ? null : "email";
                        setSelectedAction(newAction);
                        // Reset edited values when switching to this action
                        if (newAction === "email") {
                          setEditedValues(prev => ({
                            ...prev,
                            email: modalState.data?.email || ""
                          }));
                        }
                      }}
                      className={`px-4 py-3 text-sm rounded-lg border transition-colors duration-150 font-medium ${
                        selectedAction === "email"
                          ? "border-blue-300 bg-blue-500 text-white"
                          : "border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      Change Email
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const newAction = selectedAction === "role" ? null : "role";
                        setSelectedAction(newAction);
                        // Reset edited values when switching to this action
                        if (newAction === "role") {
                          setEditedValues(prev => ({
                            ...prev,
                            role: modalState.data?.role?.toUpperCase() || ""
                          }));
                        }
                      }}
                      className={`px-4 py-3 text-sm rounded-lg border transition-colors duration-150 font-medium ${
                        selectedAction === "role"
                          ? "border-blue-300 bg-blue-500 text-white"
                          : "border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      Change Role
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (selectedAction === "reset-password") {
                          setSelectedAction(null);
                        } else {
                          setSelectedAction("reset-password");
                          handleResetPassword();
                        }
                      }}
                      className={`px-4 py-3 text-sm rounded-lg border transition-colors duration-150 font-medium ${
                        selectedAction === "reset-password"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      Reset Password
                    </button>
                  </div>
                </div>
              )}

              {/* submit buttons */}
              <div className="flex items-center justify-center gap-3 mt-2">
                {modalState.mode === "add" ? (
                  <button
                    type="submit"
                    disabled={
                      status === "submitting" ||
                      (modalState.mode === "add" &&
                        (!draftName.trim() ||
                          !draftEmail.trim() ||
                          Object.keys(validationErrors).some(
                            (key) => validationErrors[key],
                          )))
                    }
                    className="rounded-lg px-4 py-2 bg-blue-500 hover:bg-blue-600 transition-colors duration-150 cursor-pointer text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus strokeWidth={1.5} className="w-5 h-5 shrink-0" />
                    {status === "submitting" ? "Submitting..." : "Add Employee"}
                  </button>
                ) : (
                  <div className="flex flex-col gap-3 w-full">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="submit"
                        disabled={
                          status === "submitting" ||
                          !selectedAction ||
                          Object.keys(validationErrors).some(
                            (key) => validationErrors[key],
                          )
                        }
                        className="rounded-lg flex-1 py-2 bg-blue-500 hover:bg-blue-600 transition-colors duration-150 cursor-pointer text-white disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {status === "submitting" ? "Processing..." : "Update"}
                      </button>
                      {normalizeAccountStatus(modalState.data?.status) ===
                      "DEACTIVATED" ? (
                        <button
                          type="button"
                          onClick={() =>
                            openConfirmationModal("activate", modalState.data)
                          }
                          disabled={status === "submitting"}
                          className="rounded-lg flex-1 py-2 bg-green-500 hover:bg-green-600 transition-colors duration-150 cursor-pointer text-white flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                          <CheckCircle strokeWidth={1.5} className="w-4 h-4" />
                          Activate
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            openConfirmationModal("deactivate", modalState.data)
                          }
                          disabled={status === "submitting"}
                          className="rounded-lg flex-1 py-2 bg-red-500 hover:bg-red-600 transition-colors duration-150 cursor-pointer text-white flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                          <Trash2 strokeWidth={1.5} className="w-4 h-4" />
                          Deactivate
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* confirmation modal */}
      {confirmationModal.isOpen && (
        <div className="fixed bg-black/50 inset-0 flex items-center justify-center z-60">
          <div className="relative bg-white rounded-2xl p-6 flex flex-col gap-6 max-w-md w-full shadow-2xl">
            {/* close button */}
            <button
              onClick={closeConfirmationModal}
              className="absolute top-4 right-4 rounded-full p-2 hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
            >
              <X strokeWidth={1.5} className="w-5 h-5" />
            </button>
            {/* header */}
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold">
                {confirmationModal.action === "deactivate"
                  ? "Deactivate Employee"
                  : confirmationModal.action === "activate"
                    ? "Activate Employee"
                    : "Confirm Update"}
              </h1>
            </div>
            {/* content */}
            <div className="flex flex-col gap-4">
              {confirmationModal.action === "update" ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <CheckCircle
                        strokeWidth={1.5}
                        className="w-10 h-10 text-green-600"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-gray-600">
                        You are about to update employee information. Please
                        confirm the changes below:
                      </p>
                      <div className="text-sm bg-gray-100 p-3 rounded-lg">
                        {confirmationModal.changes &&
                          Object.entries(confirmationModal.changes).map(
                            ([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="font-medium capitalize">
                                  {key}:
                                </span>
                                <span className="text-gray-700">{value}</span>
                              </div>
                            ),
                          )}
                      </div>
                    </div>
                  </div>
                  {/* admin password for update confirmation */}
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="admin_password_confirm"
                      className="text-gray-500 text-sm font-medium"
                    >
                      ADMIN PASSWORD
                    </label>
                    <div className="relative">
                      <input
                        type={
                          showPasswords.admin_password_confirm
                            ? "text"
                            : "password"
                        }
                        name="admin_password_confirm"
                        id="admin_password_confirm"
                        required
                        placeholder="Enter your admin password to confirm"
                        onChange={(e) => {
                          handleFieldChange(
                            "admin_password_confirm",
                            e.target.value,
                            "edit",
                          );
                        }}
                        onFocus={() =>
                          handleFieldFocus("admin_password_confirm")
                        }
                        onBlur={(e) =>
                          handleFieldBlur(
                            "admin_password_confirm",
                            e.target.value,
                            "edit",
                          )
                        }
                        className={`w-full px-4 py-2 pr-10 text-sm rounded-lg border transition-colors duration-150 ${
                          touchedFields.admin_password_confirm &&
                          validationErrors.admin_password_confirm
                            ? "border-red-500 focus:border-red-500"
                            : "border-gray-300 focus:border-blue-500"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          togglePasswordVisibility("admin_password_confirm")
                        }
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      >
                        {showPasswords.admin_password_confirm ? (
                          <EyeOff strokeWidth={1.5} className="w-4 h-4" />
                        ) : (
                          <Eye strokeWidth={1.5} className="w-4 h-4" />
                        )}
                      </button>
                      {touchedFields.admin_password_confirm &&
                        validationErrors.admin_password_confirm && (
                          <span className="absolute -bottom-5 right-0 text-xs text-red-500">
                            {validationErrors.admin_password_confirm}
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  {confirmationModal.action === "deactivate" ? (
                    <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <Trash2
                        strokeWidth={1.5}
                        className="w-10 h-10 text-red-600"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <CheckCircle
                        strokeWidth={1.5}
                        className="w-10 h-10 text-green-600"
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-gray-600">
                      {confirmationModal.action === "deactivate"
                        ? "Are you sure you want to deactivate this employee? They will no longer be able to log in, but their client logs will remain visible."
                        : "Are you sure you want to activate this employee? They will regain access to log in again."}
                    </p>
                  </div>
                </div>
              )}
              {/* buttons */}
              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  onClick={closeConfirmationModal}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors duration-150 cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={
                    confirmationModal.action === "deactivate"
                      ? handleDeactivate
                      : confirmationModal.action === "activate"
                        ? handleActivate
                        : handleUpdate
                  }
                  disabled={
                    status === "submitting" ||
                    (confirmationModal.action === "update" &&
                      Object.keys(validationErrors).some(
                        (key) =>
                          key.includes("admin_password_confirm") &&
                          validationErrors[key],
                      ))
                  }
                  className={`px-4 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                    confirmationModal.action === "deactivate"
                      ? "bg-red-500 hover:bg-red-600"
                      : confirmationModal.action === "activate"
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-green-500 text-white hover:bg-green-600"
                  } transition-colors duration-150 cursor-pointer`}
                >
                  {status === "submitting"
                    ? "Processing..."
                    : confirmationModal.action === "deactivate"
                      ? "Deactivate"
                      : confirmationModal.action === "activate"
                        ? "Activate"
                        : "Confirm Update"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toaster Component */}
      <Toaster toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
