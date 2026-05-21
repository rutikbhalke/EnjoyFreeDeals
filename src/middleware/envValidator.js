const REQUIRED_ENV = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_PROJECT_ID"
];

function isPlaceholder(value) {
  return !value || value.includes("your_") || value.includes("_here");
}

function validateEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  const placeholders = REQUIRED_ENV.filter((key) => isPlaceholder(process.env[key]));
  const errors = [];

  if (missing.length) {
    errors.push(`Missing required environment variables: ${missing.join(", ")}`);
  }

  if (placeholders.length) {
    errors.push(`Replace placeholder environment values for: ${placeholders.join(", ")}`);
  }

  if (process.env.SUPABASE_URL && !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(process.env.SUPABASE_URL)) {
    errors.push("SUPABASE_URL must look like https://your-project-ref.supabase.co");
  }

  if (
    process.env.SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_ANON_KEY === process.env.SUPABASE_SERVICE_ROLE_KEY
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

module.exports = { envValidator, validateEnv };
