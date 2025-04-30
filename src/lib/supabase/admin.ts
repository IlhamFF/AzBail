import { createClient } from '@supabase/supabase-js';

// Ensure SUPABASE_SERVICE_ROLE_KEY is set in your environment variables (server-side only)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  if (!supabaseUrl) console.error("Missing NEXT_PUBLIC_SUPABASE_URL for admin client.");
  if (!supabaseServiceRoleKey) console.error("Missing SUPABASE_SERVICE_ROLE_KEY for admin client.");
  throw new Error("Supabase URL or Service Role Key is missing for admin client. Check server environment variables.");
}

// Create a singleton Supabase client instance using the service role key
// This client should ONLY be used in server-side code (Server Actions, API routes)
// Never expose the service role key to the client-side
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    // It's generally recommended to disable auto-refreshing sessions for service role clients
    // as they don't typically represent a user session.
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log("Supabase admin client initialized (server-side only)");
