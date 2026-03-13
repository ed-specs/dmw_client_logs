import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables. Check your .env.local file.");
  process.exit(1);
}

// Create admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const userEmail = "edwardcastillogatbonton@gmail.com";
const userPassword = "12345678";
const userRole = "user"; // explicitly set to 'user'

async function seedNonAdmin() {
  console.log(`Seeding user with email: ${userEmail}`);

  // 1. Check if user already exists
  const { data: existingUsers, error: listError } =
    await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    console.error("Error listing users:", listError);
    return;
  }
  const existing = existingUsers.users.find((u) => u.email === userEmail);
  if (existing) {
    console.log("User already exists. Skipping creation.");
    return;
  }

  // 2. Create the user via Admin API
  const { data: user, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email: userEmail,
      password: userPassword,
      email_confirm: true, // auto-confirm so they can log in immediately
    });

  if (createError) {
    console.error("Error creating user:", createError);
    return;
  }

  console.log("User created with ID:", user.user.id);

  // 3. Insert profile with role 'user'
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .insert({ id: user.user.id, role: userRole });

  if (profileError) {
    console.error("Error creating profile:", profileError);
    // Cleanup: delete the created user
    await supabaseAdmin.auth.admin.deleteUser(user.user.id);
    console.log("Deleted the created user due to profile error.");
    return;
  }

  console.log(`Profile created successfully with role "${userRole}"!`);
}

// Run the function
seedNonAdmin();
