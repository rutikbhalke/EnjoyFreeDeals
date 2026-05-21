const { supabaseAdmin } = require("../config/supabaseClient");
const { throwIfSupabaseError } = require("../utils/supabaseErrors");

const TABLE = "profiles";

async function getProfile(userId) {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  throwIfSupabaseError(error, TABLE);
  return data ? toApiProfile(data) : null;
}

async function updateProfile(userId, payload) {
  const body = normalizeProfilePayload(payload);
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .select("*")
    .single();
  throwIfSupabaseError(error, TABLE);
  return toApiProfile(data);
}

function normalizeProfilePayload(payload) {
  const normalized = { ...payload };
  mapIfPresent(normalized, "userId", "user_id");
  mapIfPresent(normalized, "fullName", "full_name");
  mapIfPresent(normalized, "avatarUrl", "avatar_url");
  mapIfPresent(normalized, "referralCode", "referral_code");
  return normalized;
}

function mapIfPresent(target, from, to) {
  if (Object.prototype.hasOwnProperty.call(target, from)) {
    target[to] = target[from];
    delete target[from];
  }
}

function toApiProfile(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.full_name || "",
    fullName: row.full_name || "",
    email: row.email || "",
    avatarUrl: row.avatar_url || "",
    profileImage: row.avatar_url || "",
    referralCode: row.referral_code || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

module.exports = { getProfile, updateProfile };
