"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, X, CheckCircle } from "lucide-react";
import { createClient } from "../../lib/supabaseClient";
import { activateEmployeeStatus } from "../../actions/employeeActions";

export default function ChangePasswordPage() {
  const supabase = createClient();
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("idle"); // 'idle' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    // Verify user is actually logged in and get their ID
    const verifySession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
      } else {
        setUserId(user.id);
      }
    };
    verifySession();
  }, [supabase, router]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

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

    if (criteriaCount < 5) {
      setErrorMessage(
        "Please ensure your new password meets all security requirements.",
      );
      setStatus("error");
      setTimeout(() => setStatus("idle"), 6000);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 6000);
      return;
    }

    setLoading(true);

    // 1. Update Auth password securely
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setErrorMessage(updateError.message);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 6000);
      setLoading(false);
      return;
    }

    // 2. Update Profile status to 'activated' via Server Action to bypass RLS
    const activationResult = await activateEmployeeStatus(userId);

    if (!activationResult.success) {
      setErrorMessage("Failed to verify account status. Please contact admin.");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 6000);
      setLoading(false);
      return;
    }

    // 3. Look up their role to route to the correct dashboard
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    setSuccessMessage("Account fully secured!");
    setStatus("success");

    // Quick delay so they can see the success toast before unmounting
    setTimeout(() => {
      if (profile?.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    }, 1500);
  };

  return (
    <main className="text-base text-black bg-white flex min-h-dvh flex-col items-center justify-center p-4">
      <div className="flex flex-col gap-6 max-w-sm w-full">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-bold">Welcome!</h1>
          <p className="text-gray-600 text-sm">
            For security reasons, please change your temporary password before
            continuing to your dashboard.
          </p>
        </div>

        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="newPassword" className="text-sm font-medium">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              required
              disabled={loading}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
            {/* password validation */}
            {(() => {
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

              if (!isFocused || criteriaCount === 5) return null;

              let strengthScore = 0;
              if (newPassword.length > 0) {
                if (criteriaCount <= 2) strengthScore = 1;
                else if (criteriaCount <= 4) strengthScore = 2;
                else if (criteriaCount === 5) strengthScore = 3;
              }

              return (
                <div className="mt-2 flex flex-col gap-2">
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

                  <div className="flex flex-col p-3 rounded-lg bg-gray-50 border border-gray-100 gap-2 mt-1">
                    <div className="flex items-center gap-2">
                      {hasMinLength ? (
                        <Check
                          strokeWidth={3}
                          className="w-4 h-4 text-green-600 shrink-0"
                        />
                      ) : (
                        <X
                          strokeWidth={3}
                          className="w-4 h-4 text-gray-400 shrink-0"
                        />
                      )}
                      <p
                        className={`text-sm leading-tight ${hasMinLength ? "text-green-600 font-medium" : "text-gray-500"}`}
                      >
                        Must be at least 8 characters long
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasUpper ? (
                        <Check
                          strokeWidth={3}
                          className="w-4 h-4 text-green-600 shrink-0"
                        />
                      ) : (
                        <X
                          strokeWidth={3}
                          className="w-4 h-4 text-gray-400 shrink-0"
                        />
                      )}
                      <p
                        className={`text-sm leading-tight ${hasUpper ? "text-green-600 font-medium" : "text-gray-500"}`}
                      >
                        Must contain at least one uppercase letter
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasLower ? (
                        <Check
                          strokeWidth={3}
                          className="w-4 h-4 text-green-600 shrink-0"
                        />
                      ) : (
                        <X
                          strokeWidth={3}
                          className="w-4 h-4 text-gray-400 shrink-0"
                        />
                      )}
                      <p
                        className={`text-sm leading-tight ${hasLower ? "text-green-600 font-medium" : "text-gray-500"}`}
                      >
                        Must contain at least one lowercase letter
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasNumber ? (
                        <Check
                          strokeWidth={3}
                          className="w-4 h-4 text-green-600 shrink-0"
                        />
                      ) : (
                        <X
                          strokeWidth={3}
                          className="w-4 h-4 text-gray-400 shrink-0"
                        />
                      )}
                      <p
                        className={`text-sm leading-tight ${hasNumber ? "text-green-600 font-medium" : "text-gray-500"}`}
                      >
                        Must contain at least one number
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasSpecial ? (
                        <Check
                          strokeWidth={3}
                          className="w-4 h-4 text-green-600 shrink-0"
                        />
                      ) : (
                        <X
                          strokeWidth={3}
                          className="w-4 h-4 text-gray-400 shrink-0"
                        />
                      )}
                      <p
                        className={`text-sm leading-tight ${hasSpecial ? "text-green-600 font-medium" : "text-gray-500"}`}
                      >
                        Must contain at least one special character
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white rounded-lg px-4 py-2 mt-2 hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Password & Continue"}
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
    </main>
  );
}
