"use client"; // ← Required for hooks and event handlers

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { createClient } from "../lib/supabaseClient";
import { X } from "lucide-react";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
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
      // If no profile found, maybe redirect to a default page or show error
      setError("User profile not found. Please contact admin.");
      setLoading(false);
      setTimeout(() => setError(null), 5000);
      return;
    }

    // Redirect based on status first
    if (profile.status === "pending") {
      router.push("/change-password");
      return;
    }

    // Redirect based on role
    if (profile.role === "ADMIN") {
      router.push("/admin/dashboard");
    } else {
      router.push("/dashboard"); // normal user dashboard
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
            <h1 className="text-2xl font-bold">
              Department of Migrant Workers
            </h1>
            <span className="text-gray-800 font-semibold">MIMAROPA Region</span>
          </div>

          {/* form */}
          <form className="flex flex-col gap-6" onSubmit={handleLogin}>
            <div className="flex flex-col gap-4">
              {/* email */}
              <div className="flex flex-col gap-1">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150 disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>
              {/* password */}
              <div className="flex flex-col gap-1">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password" // ← changed to password
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150 disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
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
          error ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0 pointer-events-none"
        }`}
      >
        <X strokeWidth={1.5} className="w-5 h-5 shrink-0" />
        <span className="text-sm font-medium">{error}</span>
      </div>
    </main>
  );
}
