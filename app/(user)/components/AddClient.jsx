"use client";

import { useState } from "react";
import { ChevronLeft, CheckCircle, X } from "lucide-react";
import Link from "next/link";
import { addClientLog } from "../../actions/clientLogsActions";
import { ProvincePlaces } from "../../data/ProvincePlaces";

const PROVINCE = [
  "ORIENTAL MINDORO",
  "OCCIDENTAL MINDORO",
  "MARINDUQUE",
  "ROMBLON",
  "PALAWAN",
];

const TYPE = ["LANDBASED", "SEABASED"];

const PURPOSE = [
  "OEC",
  "OEC-EXEMPTION",
  "PEOS",
  "INFOSHEET",
  "DIRECT HIRE",
  "G2G",
  "AKSYON",
  "SPIMS",
  "LPOR",
  "BPBH",
  "LDAP",
  "CONCILIATION-MEDIATION",
  "LEGAL ADVISE",
  "END OF SERVICE BENEFIT CLAIMS",
];

const SEX = ["M", "F"];

const SURVEY = ["GOOD", "BAD"];

export default function AddClient({
  userRole,
  dbJobsites = [],
  dbPositions = [],
}) {
  const allJobsites = [...dbJobsites].sort();
  const allPositions = [...dbPositions].sort();

  const [status, setStatus] = useState("idle"); // 'idle' | 'submitting' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState("");
  const [clientName, setClientName] = useState("");
  const [nameOfOfw, setNameOfOfw] = useState("");
  const [activeProvince, setActiveProvince] = useState("");
  const [isOutsideProvince, setIsOutsideProvince] = useState(false);
  const [isOutsideMimaropa, setIsOutsideMimaropa] = useState(false);
  const [isAddingJobsite, setIsAddingJobsite] = useState(false);
  const [isAddingPosition, setIsAddingPosition] = useState(false);
  const [hoverMessage, setHoverMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Validate required fields explicitly
    const requiredFields = [
      "date",
      "clientName",
      "nameOfOfw",
      "sex",
      "jobsite",
      "type",
      "position",
      "address",
      "purpose",
      "survey",
    ];
    const isMissingData = requiredFields.some(
      (field) => !data[field] || data[field].trim() === ""
    );

    if (isMissingData) {
      setErrorMessage("Please fill-up all fields");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
      return;
    }

    if (!data.contactNo || data.contactNo.trim() === "") {
      data.contactNo = "N/A";
    }

    const isAcronym = (word, allowedList) => {
      const upper = word.toUpperCase().trim();
      if (allowedList.includes(upper)) return false; // Allowed because it's predefined
      if (upper.length <= 4 && !upper.includes(" ")) return true;
      if (upper.includes(".")) return true;
      return false;
    };

    if (isAcronym(data.jobsite, allJobsites)) {
      setErrorMessage("Jobsite must be a complete word, not an acronym.");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 6000);
      return;
    }

    if (isAcronym(data.position, allPositions)) {
      setErrorMessage("Position must be a complete word, not an acronym.");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 6000);
      return;
    }

    // Capitalize all data properties before submitting to Database
    for (const key in data) {
      if (typeof data[key] === "string" && key !== "date") {
        data[key] = data[key].toUpperCase();
      }
    }

    setStatus("submitting");

    try {
      // Execute explicit Database Server Action safely inserting explicit Postgres profiles
      const result = await addClientLog(data);

      if (!result.success) {
        setErrorMessage(
          result.error || "Failed to add client log! Please try again later."
        );
        setStatus("error");
        setTimeout(() => setStatus("idle"), 6000);
        return;
      }

      setStatus("success");
      const submittedDate = data.date; // capture the date before clearing

      e.target.reset(); // clear form
      e.target.date.value = submittedDate; // restore the date

      setClientName("");
      setNameOfOfw("");

      // Hide success message automatically after 3 seconds
      setTimeout(() => setStatus("idle"), 3000);
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to add client log! Please try again later.");
      setStatus("error");

      // Hide error message automatically after 3 seconds
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <div className="relative flex flex-col flex-1 gap-4 p-4 bg-gray-50">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/clients-logs"
            className="flex items-center gap-1 justify-center rounded-full hover:bg-gray-100 px-3 py-1 border border-gray-300 transition-colors duration-150 cursor-pointer"
          >
            <ChevronLeft strokeWidth={1.5} className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <h1 className="text-xl font-semibold">ADD CLIENT FORM</h1>
        </div>
      </div>

      {/* MAIN FORM */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-4 p-6 rounded-2xl border border-gray-300 bg-white"
      >
        <div className="flex flex-col items-baseline gap-2 mb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsOutsideProvince(!isOutsideProvince);
                setIsOutsideMimaropa(false);
                setActiveProvince("");
                setHoverMessage(
                  `Only applicable if the client is outside province of ${userRole}`
                );
              }}
              className={`px-4 py-2 text-xs rounded-md border transition-colors duration-150 cursor-pointer ${
                isOutsideProvince
                  ? "bg-blue-500 text-white hover:bg-blue-600 border-blue-300"
                  : "hover:bg-gray-100 border-gray-300"
              }`}
            >
              CLIENT IS OUTSIDE THE PROVINCE
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOutsideMimaropa(!isOutsideMimaropa);
                setIsOutsideProvince(false);
                setActiveProvince("");
                setHoverMessage(
                  "Only applicable if the client is outside MIMAROPA Region"
                );
              }}
              className={`px-4 py-2 text-xs rounded-md border transition-colors duration-150 cursor-pointer ${
                isOutsideMimaropa
                  ? "bg-blue-500 text-white hover:bg-blue-600 border-blue-300"
                  : "hover:bg-gray-100 border-gray-300"
              }`}
            >
              CLIENT IS OUTSIDE MIMAROPA REGION
            </button>
          </div>
          {isOutsideProvince && (
            <span className="text-xs text-gray-500 h-4">
              {hoverMessage ||
                `Select the appropriate condition if the client is not from province of ${userRole}.`}
            </span>
          )}
          {isOutsideMimaropa && (
            <span className="text-xs text-gray-500 h-4">
              {hoverMessage ||
                `Select the appropriate condition if the client is not from MIMAROPA Region.`}
            </span>
          )}
        </div>

        <fieldset
          disabled={status !== "idle"}
          className="border-none p-0 m-0 flex flex-col gap-4 disabled:opacity-50 disabled:pointer-events-none transition-opacity duration-200"
        >
          <div className="grid grid-cols-7 gap-4">
            {/* date */}
            <div className="col-span-1 flex flex-col gap-1">
              <label htmlFor="" className="text-gray-500 text-sm font-medium">
                DATE
              </label>
              <input
                type="date"
                name="date"
                id="date"
                required
                defaultValue={new Date().toLocaleDateString("en-CA")} // YYYY-MM-DD local timezone fallback
                placeholder="Enter date"
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150"
              />
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
                defaultValue=""
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150 bg-white cursor-pointer"
              >
                <option value="" disabled>
                  Select purpose
                </option>
                {PURPOSE.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* client name */}
            <div className="col-span-2 flex flex-col gap-1">
              <label htmlFor="" className="text-gray-500 text-sm font-medium">
                CLIENT NAME
              </label>
              <input
                type="text"
                name="clientName"
                id="clientName"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter client name"
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150"
              />
            </div>
            {/* name of ofw */}
            <div className="col-span-2 flex flex-col gap-1">
              <label htmlFor="" className="text-gray-500 text-sm font-medium">
                NAME OF OFW
              </label>
              <input
                type="text"
                name="nameOfOfw"
                id="nameOfOfw"
                required
                value={nameOfOfw}
                onChange={(e) => setNameOfOfw(e.target.value)}
                placeholder="Enter name of ofw"
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150"
              />
              {clientName.trim().length > 0 && (
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setNameOfOfw(clientName)}
                    className="text-xs text-blue-500 hover:underline cursor-pointer"
                  >
                    Same with client name
                  </button>
                </div>
              )}
            </div>
            {/* age */}
            <div className="col-span-1 flex flex-col gap-1">
              <label htmlFor="" className="text-gray-500 text-sm font-medium">
                AGE
              </label>
              <input
                type="number"
                name="age"
                id="age"
                required
                placeholder="Enter age"
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
                defaultValue=""
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150 bg-white cursor-pointer"
              >
                <option value="" disabled>
                  Select sex
                </option>
                {SEX.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            {/* contact no */}
            <div className="col-span-1 flex flex-col gap-1">
              <label htmlFor="" className="text-gray-500 text-sm font-medium">
                CONTACT NO
              </label>
              <input
                type="text"
                name="contactNo"
                id="contactNo"
                placeholder="Enter contact no."
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150"
              />
              <span className="text-xs text-gray-500">Optional</span>
            </div>
            {/* type */}
            <div className="col-span-1 flex flex-col gap-1">
              <label htmlFor="" className="text-gray-500 text-sm font-medium">
                TYPE
              </label>
              <select
                name="type"
                id="type"
                required
                defaultValue=""
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150 bg-white cursor-pointer"
              >
                <option value="" disabled>
                  Select type
                </option>
                {TYPE.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            {/* jobsite */}
            <div className="col-span-1 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="" className="text-gray-500 text-sm font-medium">
                  JOBSITE
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingJobsite(!isAddingJobsite)}
                  className="text-xs text-blue-500 cursor-pointer hover:text-blue-600 hover:underline"
                >
                  {isAddingJobsite ? "Select Jobsite" : "Add Jobsite"}
                </button>
              </div>

              {isAddingJobsite ? (
                <>
                  <input
                    type="text"
                    name="jobsite"
                    id="jobsite"
                    required
                    placeholder="Enter new jobsite"
                    className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150 bg-white"
                  />
                  <span className="text-xs text-gray-500">
                    Do not use acronym.
                  </span>
                </>
              ) : (
                <select
                  name="jobsite"
                  id="jobsite"
                  required
                  defaultValue=""
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150 bg-white cursor-pointer"
                >
                  <option value="" disabled>
                    Select jobsite
                  </option>
                  {allJobsites.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {/* position */}
            <div className="col-span-2 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="" className="text-gray-500 text-sm font-medium">
                  POSITION
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingPosition(!isAddingPosition)}
                  className="text-xs text-blue-500 cursor-pointer hover:text-blue-600 hover:underline"
                >
                  {isAddingPosition ? "Select Position" : "Add Position"}
                </button>
              </div>

              {isAddingPosition ? (
                <>
                  <input
                    type="text"
                    name="position"
                    id="position"
                    required
                    placeholder="Enter new position"
                    className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150 bg-white"
                  />
                  <span className="text-xs text-gray-500">
                    Do not use acronym.
                  </span>
                </>
              ) : (
                <select
                  name="position"
                  id="position"
                  required
                  defaultValue=""
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150 bg-white cursor-pointer"
                >
                  <option value="" disabled>
                    Select position
                  </option>
                  {allPositions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* province */}
            <div className="col-span-2 flex flex-col gap-1">
              <label htmlFor="" className="text-gray-500 text-sm font-medium">
                PROVINCE
              </label>
              {isOutsideMimaropa ? (
                <>
                  <input
                    type="text"
                    name="province"
                    id="province"
                    required
                    value={activeProvince}
                    onChange={(e) => setActiveProvince(e.target.value)}
                    placeholder="Enter province"
                    className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150 bg-white"
                  />
                  <span className="text-xs text-gray-500">
                    e.g. Batangas City
                  </span>
                </>
              ) : isOutsideProvince ? (
                <select
                  name="province"
                  id="province"
                  required
                  value={activeProvince}
                  onChange={(e) => setActiveProvince(e.target.value)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150 bg-white cursor-pointer"
                >
                  <option value="" disabled>
                    Select province
                  </option>
                  {PROVINCE.filter((p) => p !== userRole).map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  name="province"
                  id="province"
                  disabled
                  value={userRole || ""}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none transition-colors duration-150 bg-gray-100 text-gray-600 font-medium cursor-not-allowed"
                >
                  <option value={userRole || ""}>
                    {userRole || "Fetching..."}
                  </option>
                </select>
              )}
            </div>
            {/* address */}
            <div className="col-span-4 flex flex-col gap-1">
              <label
                htmlFor="address"
                className="text-gray-500 text-sm font-medium"
              >
                ADDRESS
              </label>
              {isOutsideMimaropa ? (
                <>
                  <input
                    type="text"
                    name="address"
                    id="address"
                    required
                    placeholder="Enter City / Municipality"
                    className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150 bg-white"
                  />
                  <span className="text-xs text-gray-500">
                    City / Municipality (e.g. San Pascual)
                  </span>
                </>
              ) : isOutsideProvince ? (
                <select
                  name="address"
                  id="address"
                  required
                  defaultValue=""
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150 bg-white cursor-pointer"
                >
                  <option value="" disabled>
                    Select City/Municipality
                  </option>
                  {activeProvince &&
                    ProvincePlaces.find(
                      (p) => p.province === activeProvince
                    )?.places.map((place) => (
                      <option key={place} value={`${place}, ${activeProvince}`}>
                        {place}
                      </option>
                    ))}
                </select>
              ) : (
                <select
                  name="address"
                  id="address"
                  required
                  defaultValue=""
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150 bg-white cursor-pointer"
                >
                  <option value="" disabled>
                    Select City/Municipality
                  </option>
                  {userRole &&
                    ProvincePlaces.find(
                      (p) => p.province === userRole
                    )?.places.map((place) => (
                      <option key={place} value={`${place}, ${userRole}`}>
                        {place}
                      </option>
                    ))}
                </select>
              )}
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
                defaultValue=""
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150 bg-white cursor-pointer"
              >
                <option value="" disabled>
                  Select survey
                </option>
                {SURVEY.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* submit button */}
          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={status === "submitting"}
              className="px-4 py-2 text-sm rounded-lg border border-blue-300 bg-blue-500 text-white cursor-pointer hover:bg-blue-600 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "submitting" ? "Submitting..." : "Submit"}
            </button>
          </div>
        </fieldset>
      </form>

      {/* success message */}
      <div
        className={`fixed top-4 right-4 p-4 z-50 bg-green-500 text-white rounded-2xl flex items-center gap-2 shadow-lg transition-all duration-300 transform ${
          status === "success"
            ? "translate-y-0 opacity-100"
            : "-translate-y-10 opacity-0 pointer-events-none"
        }`}
      >
        <CheckCircle strokeWidth={1.5} className="w-5 h-5" />
        Client log added successfully!
      </div>
      {/* error message */}
      <div
        className={`fixed top-4 right-4 p-4 z-50 bg-red-500 text-white rounded-2xl flex items-center gap-2 shadow-lg transition-all duration-300 transform ${
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
