import { createBrowserClient } from '@supabase/ssr';

// Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase URL or Anon Key. Check your .env file.");
}

// Export a function that creates the client to ensure it's created on the client-side
// This is useful if you need a new instance per request or component.
export const createSupabaseBrowserClient = () => createBrowserClient(supabaseUrl, supabaseAnonKey);

// Export a singleton instance for convenience in client components.
// This instance is safe to use across client components as it manages its own state.
export const supabase = createSupabaseBrowserClient();
