"use server";

import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { createServerSupabase } from "../lib/supabaseServer";

// Initialize Supabase Admin strictly on the server to bypass RLS and Auth rules
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase credentials in .env.local");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function addEmployee(formData) {
  try {
    const name = formData.get("name");
    const email = formData.get("email");
    const role = formData.get("role");
    const adminPassword = formData.get("admin_password");

    if (!name || !email || !role || !adminPassword) {
      return { success: false, error: "Missing required fields" };
    }

    // Verify the requester is the logged-in ADMIN and re-auth with password.
    const supabase = await createServerSupabase();
    const {
      data: { user: adminUser },
      error: adminAuthError,
    } = await supabase.auth.getUser();

    if (adminAuthError || !adminUser) {
      return { success: false, error: "Unauthorized session. Please log in again." };
    }

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role,status")
      .eq("id", adminUser.id)
      .single();

    if (!adminProfile || String(adminProfile.role).toUpperCase() !== "ADMIN") {
      return { success: false, error: "Unauthorized action." };
    }
    if (String(adminProfile.status || "").toUpperCase() === "DEACTIVATED") {
      return { success: false, error: "Your admin account is deactivated." };
    }

    // Re-authenticate admin password without affecting cookie session.
    const supabasePublic = createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { error: reauthError } = await supabasePublic.auth.signInWithPassword({
      email: adminUser.email,
      password: String(adminPassword),
    });

    if (reauthError) {
      return { success: false, error: "Invalid admin password." };
    }

    // 1. Generate temp password (8 random hexadecimal chars)
    const tempPassword = crypto.randomBytes(4).toString("hex");

    // 2. Create User in Auth using Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true, // Auto confirmed
    });

    if (authError) {
      console.error("Auth creation error:", authError);
      return { success: false, error: authError.message };
    }

    const userId = authData.user.id;

    // 3. Insert into profiles table
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      name: name,
      email: email,
      role: role.toUpperCase(), // Store role matching the array values
      status: "pending",
    });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // Delete the auth user if profile insertion fails to avoid dangling accounts
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return { success: false, error: "Failed to create employee profile in database." };
    }

    // 4. Send Email via Nodemailer
    // In local development or until SMTP is completely configured, 
    // we catch errors so the app doesn't crash, and return the temporary password so the Admin can still share it!
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.ethereal.email",
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    try {
      await transporter.sendMail({
        from: `"DMW Admin System" <${process.env.SMTP_USER || "admin@example.com"}>`,
        to: email,
        subject: "Your Employee Account Invitation",
        html: `
          <h3>Welcome, ${name}!</h3>
          <p>An employee account has been securely created for you.</p>
          <p>Your temporary password is: <strong>${tempPassword}</strong></p>
          <p>Please log in using this email and temporary password. You will be prompted to change this password immediately upon logging in.</p>
        `,
      });
      return { success: true, tempPassword, emailSent: true };
    } catch (emailError) {
      console.error("SMTP Delivery Failed (Using fallback):", emailError);
      return { 
        success: true, 
        emailSent: false,
        warning: "Account created but SMTP email failed. Ensure valid SMTP credentials in .env.local.", 
        tempPassword 
      };
    }

  } catch (err) {
    console.error("Unexpected error:", err);
    return { success: false, error: "An unexpected server error occurred." };
  }
}

export async function activateEmployeeStatus(userId) {
  try {
    // 1) Unban/enable auth user + mark profile as activated.
    // Supabase Admin updateUserById supports `banned_until` (set to past to re-enable).
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { banned_until: "2000-01-01T00:00:00Z" },
    );

    if (authError) return { success: false, error: authError.message };

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ status: "ACTIVATED", last_offline_at: null })
      .eq("id", userId);
      
    if (error) {
      console.error("Failed to activate profile:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error("Unexpected error in activateEmployeeStatus:", err);
    return { success: false, error: err.message };
  }
}

export async function fetchEmployeesForAdmin() {
  try {
    const { data: employees, error } = await supabaseAdmin
      .from("profiles")
      .select("id,name,email,role,status,created_at,last_seen_at,last_offline_at")
      .order("created_at", { ascending: false });

    if (error) return { success: false, error: error.message };
    return { success: true, employees: employees || [] };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function resetEmployeePassword(userId) {
  try {
    // Get user details
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError) return { success: false, error: userError.message };

    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("name, email")
      .eq("id", userId)
      .single();

    if (profileError) return { success: false, error: profileError.message };

    // Generate temp password
    const tempPassword = crypto.randomBytes(4).toString("hex");

    // Update password in auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: tempPassword,
    });

    if (updateError) return { success: false, error: updateError.message };

    // Set status to PENDING to force password change on next login
    const { error: statusError } = await supabaseAdmin
      .from("profiles")
      .update({ status: "PENDING" })
      .eq("id", userId);

    if (statusError) return { success: false, error: statusError.message };

    // Send email with temporary password
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.ethereal.email",
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    try {
      await transporter.sendMail({
        from: `"DMW Admin System" <${process.env.SMTP_USER || "admin@example.com"}>`,
        to: profileData.email,
        subject: "Password Reset - Temporary Password",
        html: `
          <h3>Hello ${profileData.name}!</h3>
          <p>Your password has been reset by an administrator.</p>
          <p>Your temporary password is: <strong>${tempPassword}</strong></p>
          <p>Please log in using this temporary password. You will be required to change your password immediately after logging in.</p>
          <p>If you did not request this reset, please contact your administrator.</p>
        `,
      });
      return { success: true, emailSent: true };
    } catch (emailError) {
      console.error("SMTP Delivery Failed:", emailError);
      return {
        success: true,
        emailSent: false,
        warning: "Password reset but email failed. Ensure valid SMTP credentials.",
        tempPassword
      };
    }

  } catch (err) {
    console.error("Unexpected error in resetEmployeePassword:", err);
    return { success: false, error: "An unexpected server error occurred." };
  }
}

export async function deleteEmployee(employeeId) {
  try {
    // 1. Explicitly delete from profiles first since it references Auth
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", employeeId);

    if (profileError) return { success: false, error: profileError.message };

    // 2. Delete from Auth (this revokes their login access immediately)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(employeeId);
    if (authError) return { success: false, error: authError.message };

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deactivateEmployee(employeeId) {
  try {
    // 1) Mark profile as deactivated (keep row so created_by remains valid)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ status: "DEACTIVATED" })
      .eq("id", employeeId);

    if (profileError) return { success: false, error: profileError.message };

    // 2) Ban/disable auth user so they can't log in
    // Supabase Admin API supports updateUserById with `banned_until`.
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      employeeId,
      { banned_until: "2100-01-01T00:00:00Z" },
    );

    if (authError) return { success: false, error: authError.message };

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateEmployee(updateData, employeeId) {
  try {
    const { name, role, email, admin_password } = updateData;

    if (!name || !role) {
      return { success: false, error: "Missing required fields" };
    }

    // Verify the requester is the logged-in ADMIN and re-auth with password.
    const supabase = await createServerSupabase();
    const {
      data: { user: adminUser },
      error: adminAuthError,
    } = await supabase.auth.getUser();

    if (adminAuthError || !adminUser) {
      return { success: false, error: "Unauthorized session. Please log in again." };
    }

    const { data: adminProfile, error: profileFetchError } = await supabase
      .from("profiles")
      .select("role,status")
      .eq("id", adminUser.id)
      .single();

    if (profileFetchError || !adminProfile) {
      return { success: false, error: "Unable to verify admin profile." };
    }

    if (adminProfile.role !== "ADMIN" || adminProfile.status !== "ACTIVATED") {
      return { success: false, error: "Only activated admins can update employees." };
    }

    // Re-authenticate with password to ensure it's the current admin
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: adminUser.email,
      password: admin_password,
    });

    if (signInError) {
      return { success: false, error: "Invalid admin password. Please try again." };
    }

    // Get current profile data
    const { data: currentProfile, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", employeeId)
      .single();

    if (fetchError) return { success: false, error: fetchError.message };

    const emailChanged = email && email !== currentProfile.email;

    // Update profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ name, role: role.toUpperCase(), ...(emailChanged && { email }) })
      .eq("id", employeeId);

    if (profileError) return { success: false, error: profileError.message };

    // If email changed, update auth user and send confirmation
    if (emailChanged) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(employeeId, {
        email: email,
        email_confirm: false, // Require re-confirmation
      });

      if (authError) return { success: false, error: authError.message };

      // Send email confirmation notification
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.ethereal.email",
        port: process.env.SMTP_PORT || 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      try {
        await transporter.sendMail({
          from: `"DMW Admin System" <${process.env.SMTP_USER || "admin@example.com"}>`,
          to: email,
          subject: "Email Address Updated - Confirmation Required",
          html: `
            <h3>Hello ${name}!</h3>
            <p>Your email address has been updated by an administrator.</p>
            <p>Please check your email and click the confirmation link to verify your new email address.</p>
            <p>If you did not request this change, please contact your administrator immediately.</p>
          `,
        });
      } catch (emailError) {
        console.error("Email confirmation failed:", emailError);
        // Don't fail the update if email fails, but log it
      }
    }

    return { success: true, emailChanged };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
