"use server";

import { createServerSupabase } from "../lib/supabaseServer";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function requireAuthUser() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return { user: null, error: "Unauthorized session. Please log in again." };
  }
  return { user, error: null };
}

export async function addJobsiteName(formData) {
  const raw = formData.get("name");
  const name = String(raw || "")
    .trim()
    .toUpperCase();
  if (!name) {
    return { success: false, error: "Jobsite name is required." };
  }

  const { user, error: authErr } = await requireAuthUser();
  if (!user) return { success: false, error: authErr };

  const { error } = await supabaseAdmin
    .from("jobsites")
    .upsert({ name }, { onConflict: "name" });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function addPositionName(formData) {
  const raw = formData.get("name");
  const name = String(raw || "")
    .trim()
    .toUpperCase();
  if (!name) {
    return { success: false, error: "Position name is required." };
  }

  const { user, error: authErr } = await requireAuthUser();
  if (!user) return { success: false, error: authErr };

  const { error } = await supabaseAdmin
    .from("positions")
    .upsert({ name }, { onConflict: "name" });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}
