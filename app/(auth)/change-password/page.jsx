"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabaseClient";
import { activateEmployeeStatus } from "../../actions/employeeActions";

export default function ChangePasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Verify user is actually logged in and get their ID
    const verifySession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
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
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    // 1. Update Auth password securely
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // 2. Update Profile status to 'activated' via Server Action to bypass RLS
    const activationResult = await activateEmployeeStatus(userId);

    if (!activationResult.success) {
      setError("Failed to verify account status. Please contact admin.");
      setLoading(false);
      return;
    }

    // 3. Look up their role to route to the correct dashboard
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profile?.role === "admin") {
      router.push("/admin/dashboard");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <main className="text-base text-black bg-white flex min-h-dvh flex-col items-center justify-center p-4">
      <div className="flex flex-col gap-6 max-w-sm w-full">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-bold">Welcome!</h1>
          <p className="text-gray-600 text-sm">
            For security reasons, please change your temporary password before continuing to your dashboard.
          </p>
        </div>

        {error && (
          <div className="px-4 py-2 bg-red-100 text-red-700 rounded-lg border-l-4 border-red-500 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="newPassword" className="text-sm font-medium">New Password</label>
            <input
              id="newPassword"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={loading}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</label>
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
    </main>
  );
}
