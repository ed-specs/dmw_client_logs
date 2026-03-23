"use server";

import { createServerSupabase } from "../lib/supabaseServer";

export async function addClientLog(clientData) {
  try {
    const supabase = await createServerSupabase();
    
    // 1. Verify Authentication securely via server cookies
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized session. Please log in again." };
    }

    // 2. Fetch the assigned Branch/Role of the active employee
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return { success: false, error: "Failed to verify employee province routing." };
    }

    // Admins assign the province manually via form, users are strictly bound to their profile role
    let targetProvince = profile?.role || "UNKNOWN";
    if (targetProvince === "ADMIN" && clientData.province) {
      targetProvince = clientData.province;
    }

    // 3. Insert the validated properties plus security metadata
    const { error: insertError } = await supabase.from("client_logs").insert([
      {
        ...clientData, // spreads date, clientName, age, sex, province(if admin), etc.
        created_by: user.id,
        province: targetProvince,
      },
    ]);

    if (insertError) {
      console.error("Database Insert Error:", insertError);
      return { success: false, error: insertError.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error in addClientLog:", error);
    return { success: false, error: "An unexpected server error occurred." };
  }
}
