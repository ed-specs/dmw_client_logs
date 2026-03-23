"use client";

import { Plus, X, CheckCircle } from "lucide-react";
import { useState } from "react";
import { addEmployee } from "../../actions/employeeActions";
const ROLE = [
  "ORIENTAL MINDORO",
  "OCCIDENTAL MINDORO",
  "MARINDUQUE",
  "ROMBLON",
  "PALAWAN",
];

export default function AdminManageEmployeesPage() {
  const [openAddNewEmployee, setOpenAddNewEmployee] = useState(false);
  const [status, setStatus] = useState("idle"); // 'idle' | 'submitting' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("Employee added successfully!");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Validate required fields explicitly
    const requiredFields = ["name", "email", "role"];
    const isMissingData = requiredFields.some((field) => !data[field] || data[field].trim() === "");

    if (isMissingData) {
      setErrorMessage("Please fill-up all fields");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
      return;
    }

    setStatus("submitting");

    try {
      const result = await addEmployee(formData);

      if (!result.success) {
        setErrorMessage(result.error || "Failed to add employee! Please try again later.");
        setStatus("error");
        setTimeout(() => setStatus("idle"), 6000);
        return;
      }

      setSuccessMessage("Employee added successfully!");

      setStatus("success");
      e.target.reset(); // clear form

      setTimeout(() => setStatus("idle"), 6000);
    } catch (error) {
      console.error(error);
      setErrorMessage("An unexpected error occurred. Please try again later.");
      setStatus("error");
      
      setTimeout(() => setStatus("idle"), 6000);
    }
  };

  return (
    <div className="flex flex-col flex-1 gap-4 p-6 bg-gray-50">
      {/* header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">MANAGE EMPLOYEES</h1>
        <button
          onClick={() => setOpenAddNewEmployee(true)}
          className="rounded-lg px-4 py-2 bg-blue-500 hover:bg-blue-600 transition-colors duration-150 cursor-pointer text-white flex items-center gap-2"
        >
          <Plus strokeWidth={1.5} className="w-5 h-5" />
          Add Employee
        </button>
      </div>

      {/* main */}
      <div className="flex flex-col flex-1 gap-4 ">asd</div>

      {/* add new employee modal */}
      {openAddNewEmployee && (
        <div className="fixed bg-black/50 inset-0 flex items-center justify-center">
          {/* form */}
          <div className="relative bg-white rounded-2xl p-6 flex flex-col gap-4 max-w-lg w-full">
            {/* close button */}
            <button
              onClick={() => setOpenAddNewEmployee(false)}
              className="absolute top-4 right-4 rounded-full p-2 hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
            >
              <X strokeWidth={1.5} className="w-5 h-5" />
            </button>
            {/* header */}
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold">Add New Employee</h1>
            </div>
            {/* form */}
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
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
                  required
                  placeholder="Enter email"
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150"
                />
                <span className="text-xs text-gray-500">
                  Note: This email will be used to sent the invitation alongside
                  the temporary password.
                </span>
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
                  defaultValue=""
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
              {/* submit button */}
              <div className="flex items-center justify-center">
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="rounded-lg px-4 py-2 bg-blue-500 mt-2 hover:bg-blue-600 transition-colors duration-150 cursor-pointer text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus strokeWidth={1.5} className="w-5 h-5 shrink-0" />
                  {status === "submitting" ? "Submitting..." : "Add Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* success message */}
      <div 
        className={`fixed top-4 right-4 p-4 z-60 bg-green-500 text-white rounded-2xl flex items-center gap-2 shadow-lg transition-all duration-300 transform max-w-sm ${
          status === "success"
            ? "translate-y-0 opacity-100"
            : "-translate-y-10 opacity-0 pointer-events-none"
        }`}
      >
        <CheckCircle strokeWidth={1.5} className="w-5 h-5 shrink-0" />
        <span className="text-sm font-medium leading-tight">{successMessage}</span>
      </div>
      {/* error message */}
      <div 
        className={`fixed top-4 right-4 p-4 z-60 bg-red-500 text-white rounded-2xl flex items-center gap-2 shadow-lg transition-all duration-300 transform ${
          status === "error"
            ? "translate-y-0 opacity-100"
            : "-translate-y-10 opacity-0 pointer-events-none"
        }`}
      >
        <X strokeWidth={1.5} className="w-5 h-5" />
        {errorMessage}
      </div>
    </div>
  );
}
