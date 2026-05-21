function isMissingTableError(error) {
  if (!error) return false;
  return ["42P01", "PGRST106", "PGRST205"].includes(error.code) ||
    /relation .* does not exist/i.test(error.message || "") ||
    /could not find the table/i.test(error.message || "");
}

function normalizeSupabaseError(error, tableName) {
  if (isMissingTableError(error)) {
    const normalized = new Error("Table not found. Please create Supabase tables first.");
    normalized.statusCode = 503;
    normalized.code = "TABLE_NOT_FOUND";
    normalized.details = tableName ? { table: tableName } : undefined;
    return normalized;
  }

  const normalized = new Error(error?.message || "Supabase request failed.");
  normalized.statusCode = 500;
  normalized.code = error?.code || "SUPABASE_ERROR";
  normalized.details = error?.details || error?.hint || undefined;
  return normalized;
}

function throwIfSupabaseError(error, tableName) {
  if (error) {
    throw normalizeSupabaseError(error, tableName);
  }
}

module.exports = {
  isMissingTableError,
  normalizeSupabaseError,
  throwIfSupabaseError
};
