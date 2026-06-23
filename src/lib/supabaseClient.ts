// Supabase browser client. Reads public env vars. When these are unset the app
// falls back to local seed data, so the prototype still runs without a database.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const BUSINESS_ID =
  process.env.NEXT_PUBLIC_BUSINESS_ID ?? "11111111-1111-1111-1111-111111111111";

// True when Supabase is configured; used to switch the data layer over.
export const supabaseEnabled = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = supabaseEnabled
  ? createClient(url as string, anonKey as string)
  : null;
