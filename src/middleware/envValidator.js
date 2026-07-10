const REQUIRED_ENV = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY"
];

function isPlaceholder(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized.includes("your_") ||
    normalized.includes("your-") ||
    normalized.includes("_here") ||
    normalized.includes("placeholder") ||
    normalized.includes("changeme");
}

function cleanEnv(name) {
  return String(process.env[name] || "").trim();
}

function supabaseProjectRef(supabaseUrl) {
  const match = String(supabaseUrl || "").trim().match(/^https:\/\/([a-z0-9-]+)\.supabase\.co$/i);
  return match?.[1] || "";
}

function validateEnv() {
  const missing = REQUIRED_ENV.filter((key) => !cleanEnv(key));
  const placeholders = REQUIRED_ENV.filter((key) => cleanEnv(key) && isPlaceholder(process.env[key]));
  const errors = [];
  const supabaseUrl = cleanEnv("SUPABASE_URL");
  const supabaseProjectId = cleanEnv("SUPABASE_PROJECT_ID");

  if (missing.length) {
    errors.push(`Missing required environment variables: ${missing.join(", ")}`);
  }

  if (supabaseProjectId && isPlaceholder(supabaseProjectId)) {
    placeholders.push("SUPABASE_PROJECT_ID");
  }

  if (placeholders.length) {
    errors.push(`Replace placeholder environment values for: ${placeholders.join(", ")}`);
  }

  if (supabaseUrl && !supabaseProjectRef(supabaseUrl)) {
    errors.push("SUPABASE_URL must look like https://your-project-ref.supabase.co");
  }

  if (
    cleanEnv("SUPABASE_ANON_KEY") &&
    cleanEnv("SUPABASE_SERVICE_ROLE_KEY") &&
    cleanEnv("SUPABASE_ANON_KEY") === cleanEnv("SUPABASE_SERVICE_ROLE_KEY")
  ) {
    errors.push("SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY must be different.");
  }

  const port = Number(process.env.PORT || 5000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errors.push("PORT must be a valid TCP port.");
  }

  if (errors.length) {
    const error = new Error(errors.join(" "));
    error.statusCode = 500;
    error.code = "ENV_VALIDATION_FAILED";
    error.details = { missing, placeholders };
    throw error;
  }
}

function envValidator(_req, _res, next) {
  try {
    validateEnv();
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { envValidator, validateEnv, supabaseProjectRef };
