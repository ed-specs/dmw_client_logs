"use server";

import { createServerSupabase } from "../lib/supabaseServer";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase credentials in .env.local");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function touchLastSeen() {
  // Updates `profiles.last_seen_at` for the currently logged-in user.
  // Uses service role so it works regardless of RLS policies.
  const supabase = await createServerSupabase();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return { success: false, error: "Unauthorized" };

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({
      last_seen_at: new Date().toISOString(),
      last_offline_at: null,
    })
    .eq("id", user.id);

  if (updateError) return { success: false, error: updateError.message };
  return { success: true };
}

export async function setPresenceOffline() {
  // Marks the currently logged-in user as offline immediately.
  // Stores the offline start time so the admin can display how long offline.
  const supabase = await createServerSupabase();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return { success: false, error: "Unauthorized" };

  const offlineAt = new Date().toISOString();

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({ last_seen_at: null, last_offline_at: offlineAt })
    .eq("id", user.id);

  if (updateError) return { success: false, error: updateError.message };
  return { success: true };
}

