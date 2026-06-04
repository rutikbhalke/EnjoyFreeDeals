const { createClient } = require("@supabase/supabase-js");

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL environment variable is missing.");
  }

  if (!supabaseAnonKey) {
    throw new Error("SUPABASE_ANON_KEY environment variable is missing.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

module.exports = { getSupabaseClient };
