import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let cachedClient: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });
} else if (import.meta.env.DEV) {
  console.warn(
    "Supabase environment variables are missing. Define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable email/password auth.",
  );
}

export const isSupabaseConfigured = (): boolean => cachedClient !== null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!cachedClient) {
    throw new Error(
      "Supabase environment variables are not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
  return cachedClient;
};

export const supabase = cachedClient;
export default supabase;
