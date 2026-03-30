"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "../lib/supabaseClient";
import { X } from "lucide-react";
import { useValidation, ValidatedInput, showToasterError } from "../hooks/useValidation";

export default function LoginClient() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle");
  
  const validation = useValidation();

  // Show login error toast when middleware redirects deactivated users.
  // Query param is set by `proxy.jsx` as `?error=deactivated`.
  useEffect(() => {
    const qError = searchParams.get("error");
    if (qError === "deactivated") {
      setError("Your account is deactivated. Please contact the administrator.");
      setTimeout(() => setError(null), 5000);
    }
  }, [searchParams]);

  // If there's already an authenticated session, ensure deactivated users see the message.
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", user.id)
        .single();

      const statusNorm = String(profile?.status || "").trim().toUpperCase();
      if (statusNorm === "DEACTIVATED") {
        setError("Your account is deactivated. Please contact the administrator.");
        // Clear the session so they have to log in again, but keep the toast.
        try {
          await supabase.auth.signOut();
        } catch {
          // ignore
        }
        setTimeout(() => setError(null), 5000);
      }
    };

    checkSession();
  }, [supabase]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    const formData = { email, password };
    const isValid = validation.validateForm(formData, ['email', 'password']);
    
    if (!isValid) {
      showToasterError(setError, setStatus, "Please fix all validation errors before logging in");
      return;
    }
    
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      setTimeout(() => setError(null), 5000);
      return;
    }

    // User is authenticated – fetch their profile to get role and status
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      setError("User profile not found. Please contact admin.");
      setLoading(false);
      setTimeout(() => setError(null), 5000);
      return;
    }

    const roleNorm = String(profile.role || "").trim().toUpperCase();
    const statusNorm = String(profile.status || "").trim().toUpperCase();

    if (statusNorm === "DEACTIVATED") {
      setError("Your account is deactivated. Please contact the administrator.");
      setLoading(false);
      setTimeout(() => setError(null), 5000);
      return;
    }

    if (statusNorm === "PENDING") {
      router.replace(
        roleNorm === "ADMIN" ? "/admin/change-password" : "/change-password",
      );
      return;
    }

    if (roleNorm === "ADMIN") {
      router.replace("/admin/dashboard");
    } else {
      router.replace("/dashboard");
    }

    setLoading(false);
  };

  return (
    <main className="text-base text-black bg-white">
      <div className="h-dvh container mx-auto flex items-center justify-center">
        <div className="flex flex-col gap-8 max-w-md w-full">
          {/* header */}
          <div className="flex flex-col gap-1 items-center justify-center">
            <Image src="/dmw_logo.png" alt="DMW Logo" width={65} height={65} />
            <h1 className="text-2xl font-bold">Department of Migrant Workers</h1>
            <span className="text-gray-800 font-semibold">MIMAROPA Region</span>
          </div>

          {/* form */}
          <form className="flex flex-col gap-6" onSubmit={handleLogin}>
            <div className="flex flex-col gap-4">
              {/* email */}
              <ValidatedInput
                type="email"
                name="email"
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required={true}
                disabled={loading}
                validationHook={validation}
                validationOptions={{ rule: 'email' }}
              />
              
              {/* password */}
              <ValidatedInput
                type="password"
                name="password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required={true}
                disabled={loading}
                validationHook={validation}
                validationOptions={{ rule: 'password' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading || validation.hasFormErrors()}
              className="bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600 transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* contact admin */}
          <div className="flex flex-col items-center justify-center gap-1 text-sm">
            <span className="text-gray-500">Having problems?</span>
            <Link
              href="mailto:admin@dmw.gov.ph"
              className="text-blue-500 hover:underline"
            >
              Contact Admin
            </Link>
          </div>
        </div>
      </div>

      {/* error message toaster */}
      <div
        className={`fixed top-4 right-4 p-4 z-60 bg-red-500 text-white rounded-2xl flex items-center gap-2 transition-all duration-300 transform ${
          status === "error" || error
            ? "translate-y-0 opacity-100"
            : "-translate-y-10 opacity-0 pointer-events-none"
        }`}
      >
        <X strokeWidth={1.5} className="w-5 h-5 shrink-0" />
        <span className="text-sm font-medium">{error}</span>
      </div>
    </main>
  );
}

