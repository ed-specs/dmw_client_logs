"use server";

import { createServerSupabase } from "../lib/supabaseServer";
import { createClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

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

    // Both Admins and Users can assign the province manually now via the "outside province" feature.
    // Fallback to their role if province isn't provided (though UI requires it).
    let targetProvince = clientData.province || profile?.role || "UNKNOWN";
    if (profile?.role === "ADMIN" && clientData.province) {
      targetProvince = clientData.province;
    }

    // 3. Upsert Jobsite and Position natively capturing typed creations securely bypassing RLS
    if (clientData.jobsite) {
      await supabaseAdmin.from("jobsites").upsert(
        {
          name: clientData.jobsite.toUpperCase().trim(),
          created_by: user.id,
        },
        { onConflict: "name", ignoreDuplicates: true }
      );
    }
    if (clientData.position) {
      await supabaseAdmin.from("positions").upsert(
        {
          name: clientData.position.toUpperCase().trim(),
          created_by: user.id,
        },
        { onConflict: "name", ignoreDuplicates: true }
      );
    }

    // 4. Insert the validated properties plus security metadata
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

    revalidateTag("client_logs");
    revalidateTag("catalogs");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error in addClientLog:", error);
    return { success: false, error: "An unexpected server error occurred." };
  }
}

export async function updateClientLog(clientData, logId) {
  try {
    const supabase = await createServerSupabase();
    
    // 1. Verify Authentication securely
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized session. Please log in again." };
    }

    // 2. Upsert Jobsite and Position securely bypassing RLS
    if (clientData.jobsite) {
      await supabaseAdmin.from("jobsites").upsert(
        {
          name: clientData.jobsite.toUpperCase().trim(),
          created_by: user.id,
        },
        { onConflict: "name", ignoreDuplicates: true }
      );
    }
    if (clientData.position) {
      await supabaseAdmin.from("positions").upsert(
        {
          name: clientData.position.toUpperCase().trim(),
          created_by: user.id,
        },
        { onConflict: "name", ignoreDuplicates: true }
      );
    }

    const updatePayload = { ...clientData };
    delete updatePayload.date; // prevent updating creation date
    delete updatePayload.id;
    delete updatePayload.created_by; // just in case

    // 3. Update the validated properties using supabaseAdmin to bypass missing RLS UPDATE policies
    const { error: updateError } = await supabaseAdmin
      .from("client_logs")
      .update(updatePayload)
      .eq("id", logId);

    if (updateError) {
      console.error("Database Update Error:", updateError);
      return { success: false, error: updateError.message };
    }

    revalidateTag("client_logs");
    revalidateTag("catalogs");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error in updateClientLog:", error);
    return { success: false, error: "An unexpected server error occurred." };
  }
}
