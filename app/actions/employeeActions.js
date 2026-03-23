"use server";

import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import crypto from "crypto";

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

    if (!name || !email || !role) {
      return { success: false, error: "Missing required fields" };
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
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ status: "activated" })
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
