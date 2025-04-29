import { createClient } from '@supabase/supabase-js';

// Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check for Supabase URL existence
if (!supabaseUrl) {
  throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL");
}

// Validate Supabase URL format before passing to the client
try {
  new URL(supabaseUrl);
} catch (e) {
   console.error("Invalid Supabase URL provided:", supabaseUrl);
   throw new Error(`Invalid URL format for NEXT_PUBLIC_SUPABASE_URL: "${supabaseUrl}". Please ensure it includes the protocol (e.g., "https://").`);
}


// Check for Supabase Anon Key existence
if (!supabaseAnonKey) {
  throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// Create Supabase client - this should now only be called with a validated URL
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
