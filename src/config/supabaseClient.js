const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createSupabaseClient("SUPABASE_SERVICE_ROLE_KEY");
const supabasePublic = createSupabaseClient("SUPABASE_ANON_KEY");

function createSupabaseClient(keyName) {
  const url = process.env.SUPABASE_URL;
  const key = process.env[keyName];
  if (url && key) {
    return createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  return missingSupabaseClient(keyName);
}

function missingSupabaseClient(keyName) {
  return new Proxy({}, {
    get() {
      const error = new Error(`Supabase is not configured. Missing SUPABASE_URL or ${keyName}.`);
      error.statusCode = 500;
      error.code = "ENV_VALIDATION_FAILED";
      throw error;
    }
  });
}

module.exports = { supabaseAdmin, supabasePublic };
