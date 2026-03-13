// scripts/seedAdmin.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // load your environment variables

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // we'll add this to .env.local

// Create admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const adminEmail = 'admin@dmw.gov.ph';
const adminPassword = 'DMW@2025!';

async function seedAdmin() {
  console.log('Seeding admin user...');

  // 1. Check if user already exists (optional)
  const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }
  const existing = existingUsers.users.find(u => u.email === adminEmail);
  if (existing) {
    console.log('Admin user already exists. Skipping creation.');
    return;
  }

  // 2. Create the user via Admin API
  const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true, // auto-confirm email so they can log in immediately
  });

  if (createError) {
    console.error('Error creating user:', createError);
    return;
  }

  console.log('User created:', user.user.id);

  // 3. Insert profile with role 'admin'
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({ id: user.user.id, role: 'admin' });

  if (profileError) {
    console.error('Error creating profile:', profileError);
    // Optionally delete the user if profile insert fails (cleanup)
    await supabaseAdmin.auth.admin.deleteUser(user.user.id);
    return;
  }

  console.log('Admin profile created successfully!');
}

seedAdmin();