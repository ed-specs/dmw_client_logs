"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, CheckCircle } from "lucide-react";
import { createClient } from "../../lib/supabaseClient";

export default function UserChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [status, setStatus] = useState("idle"); // 'idle' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const supabase = createClient();

  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

  const criteriaCount = [
    hasMinLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
  ].filter(Boolean).length;

  let strengthScore = 0;
  if (newPassword.length > 0) {
    if (criteriaCount <= 2) strengthScore = 1;
    else if (criteriaCount <= 4) strengthScore = 2;
    else if (criteriaCount === 5) strengthScore = 3;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword) {
      setErrorMessage("Please enter your current password.");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 6000);
      return;
    }

    if (criteriaCount < 5) {
      setErrorMessage("New password does not meet all security requirements.");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 6000);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New passwords do not match.");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 6000);
      return;
    }

    setLoading(true);

    // 1. Get current logged in user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMessage(
        "Failed to get current user session. Please log in again.",
      );
      setStatus("error");
      setTimeout(() => setStatus("idle"), 6000);
      setLoading(false);
      return;
    }

    // 2. Verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      setErrorMessage("Current password is incorrect.");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 6000);
      setLoading(false);
      return;
    }

    // 3. Update to the new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setErrorMessage(updateError.message);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 6000);
    } else {
      setSuccessMessage("Password successfully changed! Logging out...");
      setStatus("success");
      setTimeout(async () => {
        setStatus("idle");
        await supabase.auth.signOut();
        router.push("/");
      }, 6000);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col flex-1 gap-4 p-4 bg-gray-50 h-full overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold w-full">CHANGE PASSWORD</h1>
      </div>

      {/* main */}
      <div className="flex items-center justify-center bg-white p-6 rounded-2xl border border-gray-300">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 max-w-lg w-full"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="currentPassword" className="text-sm text-gray-500">
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="newPassword" className="text-sm text-gray-500">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150"
            />
            {/* password validation */}
            {isFocused && criteriaCount < 5 && (
              <div className="mt-1 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex flex-1 p-0.5 rounded-full transition-colors duration-300 ${strengthScore >= 1 ? (strengthScore === 1 ? "bg-red-500" : strengthScore === 2 ? "bg-yellow-500" : "bg-green-500") : "bg-gray-300"}`}
                  ></div>
                  <div
                    className={`flex flex-1 p-0.5 rounded-full transition-colors duration-300 ${strengthScore >= 2 ? (strengthScore === 2 ? "bg-yellow-500" : "bg-green-500") : "bg-gray-300"}`}
                  ></div>
                  <div
                    className={`flex flex-1 p-0.5 rounded-full transition-colors duration-300 ${strengthScore >= 3 ? "bg-green-500" : "bg-gray-300"}`}
                  ></div>
                </div>

                <div className="flex flex-col p-2 rounded-lg bg-gray-50 gap-1.5">
                  <div className="flex items-center gap-2">
                    {hasMinLength ? (
                      <Check
                        strokeWidth={3}
                        className="w-3.5 h-3.5 text-green-600"
                      />
                    ) : (
                      <X
                        strokeWidth={3}
                        className="w-3.5 h-3.5 text-gray-400"
                      />
                    )}
                    <p
                      className={`text-sm ${hasMinLength ? "text-green-600 font-medium" : "text-gray-500"}`}
                    >
                      Password must be at least 8 characters long
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasUpper ? (
                      <Check
                        strokeWidth={3}
                        className="w-3.5 h-3.5 text-green-600"
                      />
                    ) : (
                      <X
                        strokeWidth={3}
                        className="w-3.5 h-3.5 text-gray-400"
                      />
                    )}
                    <p
                      className={`text-sm ${hasUpper ? "text-green-600 font-medium" : "text-gray-500"}`}
                    >
                      Password must contain at least one uppercase letter
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasLower ? (
                      <Check
                        strokeWidth={3}
                        className="w-3.5 h-3.5 text-green-600"
                      />
                    ) : (
                      <X
                        strokeWidth={3}
                        className="w-3.5 h-3.5 text-gray-400"
                      />
                    )}
                    <p
                      className={`text-sm ${hasLower ? "text-green-600 font-medium" : "text-gray-500"}`}
                    >
                      Password must contain at least one lowercase letter
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasNumber ? (
                      <Check
                        strokeWidth={3}
                        className="w-3.5 h-3.5 text-green-600"
                      />
                    ) : (
                      <X
                        strokeWidth={3}
                        className="w-3.5 h-3.5 text-gray-400"
                      />
                    )}
                    <p
                      className={`text-sm ${hasNumber ? "text-green-600 font-medium" : "text-gray-500"}`}
                    >
                      Password must contain at least one number
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasSpecial ? (
                      <Check
                        strokeWidth={3}
                        className="w-3.5 h-3.5 text-green-600"
                      />
                    ) : (
                      <X
                        strokeWidth={3}
                        className="w-3.5 h-3.5 text-gray-400"
                      />
                    )}
                    <p
                      className={`text-sm ${hasSpecial ? "text-green-600 font-medium" : "text-gray-500"}`}
                    >
                      Password must contain at least one special character
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="confirmPassword" className="text-sm text-gray-500">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition-colors duration-150"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 transition-colors duration-150 cursor-pointer text-white rounded-lg px-4 py-2 disabled:opacity-50"
          >
            {loading ? "Updating..." : "Change Password"}
          </button>
        </form>
      </div>

      {/* success message toast */}
      <div
        className={`fixed top-4 right-4 p-4 z-60 bg-green-500 text-white rounded-2xl flex items-center gap-2 shadow-lg transition-all duration-300 transform max-w-sm ${status === "success" ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0 pointer-events-none"}`}
      >
        <CheckCircle strokeWidth={1.5} className="w-5 h-5 shrink-0" />
        <span className="text-sm font-medium leading-tight">
          {successMessage}
        </span>
      </div>

      {/* error message toast */}
      <div
        className={`fixed top-4 right-4 p-4 z-60 bg-red-500 text-white rounded-2xl flex items-center gap-2 shadow-lg transition-all duration-300 transform ${status === "error" ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0 pointer-events-none"}`}
      >
        <X strokeWidth={1.5} className="w-5 h-5" />
        {errorMessage}
      </div>
    </div>
  );
}
