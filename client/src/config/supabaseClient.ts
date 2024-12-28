import { createClient } from "@supabase/supabase-js";

const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing environment variables for Supabase");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
