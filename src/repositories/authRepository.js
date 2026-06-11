const crypto = require("crypto");
const { supabaseAdmin, supabasePublic } = require("../config/supabaseClient");
const { generateOtp, hashOtp, sendWhatsAppOtp } = require("../services/whatsappOtpService");
const { throwIfSupabaseError } = require("../utils/supabaseErrors");

const PROFILES_TABLE = "profiles";
const OTP_VERIFICATIONS_TABLE = "otp_verifications";
const OTP_TTL_MS = Number(process.env.WHATSAPP_OTP_TTL_SECONDS || 300) * 1000;
const OTP_RESEND_MS = Number(process.env.WHATSAPP_OTP_RESEND_SECONDS || 45) * 1000;
const OTP_MAX_ATTEMPTS = Number(process.env.WHATSAPP_OTP_MAX_ATTEMPTS || 5);
const SAMPLE_OTP_TABLE = "sample_whatsapp_otp_logins";
const whatsappOtpStore = new Map();

async function requestWhatsAppOtp(payload) {
  const mobile = normalizeMobile(payload?.mobile || payload?.phone);
  console.info("[WhatsApp OTP] Request received", { mobile: maskMobile(mobile) });

  if (isConfiguredTestMobile(mobile)) {
    const testOtp = configuredTestOtp();
    await storeOtpVerification({
      mobile,
      otp: testOtp,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isTestUser: true
    });
    console.info("[WhatsApp OTP] Test OTP mode used", { mobile: maskMobile(mobile) });
    return {
      mobile,
      message: `Test OTP enabled. Use OTP ${testOtp}.`,
      expiresInSeconds: 365 * 24 * 60 * 60,
      resendAfterSeconds: 0,
      isTestUser: true
    };
  }

  const sampleLogin = await findSampleOtpLogin(mobile);
  if (sampleLogin) {
    await storeOtpVerification({
      mobile,
      otp: sampleLogin.otp,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
      isTestUser: true
    });
    setMemoryOtp(mobile, sampleLogin.otp, OTP_TTL_MS);
    return {
      mobile,
      message: "Sample OTP enabled.",
      expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
      resendAfterSeconds: 0,
      sampleLogin: true
    };
  }

  const existing = whatsappOtpStore.get(mobile);
  if (existing && Date.now() - existing.sentAt < OTP_RESEND_MS) {
    throwBadRequest("Please wait before requesting another WhatsApp OTP.");
  }

  const otp = generateOtp();
  await sendWhatsAppOtp(mobile, otp);
  await storeOtpVerification({
    mobile,
    otp,
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
    isTestUser: false
  });
  setMemoryOtp(mobile, otp, OTP_TTL_MS);
  return {
    mobile,
    message: "WhatsApp OTP sent.",
    expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
    resendAfterSeconds: Math.floor(OTP_RESEND_MS / 1000)
  };
}

async function verifyWhatsAppOtp(payload) {
  const input = normalizeWhatsAppOtpPayload(payload);
  console.info("[WhatsApp OTP] Verification received", { mobile: maskMobile(input.mobile) });

  if (isConfiguredTestMobile(input.mobile)) {
    if (!isConfiguredTestOtp(input.otp)) {
      console.info("[WhatsApp OTP] Test OTP verification failed", { mobile: maskMobile(input.mobile) });
      throwBadRequest("Invalid OTP");
    }
    await storeOtpVerification({
      mobile: input.mobile,
      otp: input.otp,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isTestUser: true
    });
    input.name = input.name || "EnjoyFreeDeals Test User";
    input.isTestUser = true;
    console.info("[WhatsApp OTP] Test OTP verification success", { mobile: maskMobile(input.mobile) });
  } else {
    const sampleLogin = await findSampleOtpLogin(input.mobile);
    if (sampleLogin && input.otp === sampleLogin.otp) {
      whatsappOtpStore.delete(input.mobile);
      input.name = input.name || sampleLogin.name;
      input.isTestUser = true;
    } else {
      const consumed = await consumeStoredOtpVerification(input.mobile, input.otp);
      if (!consumed) {
        consumeWhatsAppOtp(input.mobile, input.otp);
      }
    }
  }
  const authUser = await ensureWhatsAppAuthUser(input);
  const session = await signInWithPassword(whatsAppEmail(input.mobile), whatsappPassword(input.mobile));
  const profile = await upsertProfile(session.user, {
    name: input.name,
    email: input.email,
    mobile: input.mobile
  });
  console.info("[WhatsApp OTP] Profile created/updated", { mobile: maskMobile(input.mobile), userId: authUser.id });
  return toAuthResponse(session, authUser, profile, input.mobile);
}

async function getCurrentUser(accessToken) {
  if (!accessToken) {
    const error = new Error("Authorization token is required.");
    error.statusCode = 401;
    throw error;
  }

  const { data, error } = await supabasePublic.auth.getUser(accessToken);
  throwIfAuthError(error, "Session expired. Please login again.");

  const profile = await ensureProfile(data.user);
  return { user: toApiUser(data.user, profile) };
}

async function signInWithPassword(email, password) {
  const { data, error } = await supabasePublic.auth.signInWithPassword({
    email,
    password
  });

  throwIfAuthError(error, "Invalid email or password.");

  if (!data.session || !data.user) {
    const missingSession = new Error("Session could not be created. Please try again.");
    missingSession.statusCode = 500;
    throw missingSession;
  }

  return {
    user: data.user,
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at,
    tokenType: data.session.token_type || "bearer"
  };
}

async function ensureProfile(authUser) {
  const { data, error } = await supabaseAdmin
    .from(PROFILES_TABLE)
    .select("*")
    .eq("user_id", authUser.id)
    .maybeSingle();
  throwIfSupabaseError(error, PROFILES_TABLE);

  if (data) {
    return data;
  }

  return upsertProfile(authUser);
}

async function upsertProfile(authUser, overrides = {}) {
  const metadata = authUser.user_metadata || {};
  const publicEmail = overrides.email !== undefined
    ? overrides.email
    : metadata.email || (metadata.whatsapp_login ? "" : authUser.email || "");
  const profileBody = {
    user_id: authUser.id,
    full_name: overrides.name || metadata.full_name || authUser.email?.split("@")[0] || "",
    email: publicEmail,
    avatar_url: metadata.avatar_url || null,
    updated_at: new Date().toISOString()
  };

  const existing = await findProfile(authUser.id);
  if (existing) {
    const { data, error } = await supabaseAdmin
      .from(PROFILES_TABLE)
      .update(profileBody)
      .eq("user_id", authUser.id)
      .select("*")
      .single();
    throwIfSupabaseError(error, PROFILES_TABLE);
    return data;
  }

  const { data, error } = await supabaseAdmin
    .from(PROFILES_TABLE)
    .insert(profileBody)
    .select("*")
    .single();
  throwIfSupabaseError(error, PROFILES_TABLE);
  return data;
}

async function findProfile(userId) {
  const { data, error } = await supabaseAdmin
    .from(PROFILES_TABLE)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  throwIfSupabaseError(error, PROFILES_TABLE);
  return data;
}

function normalizeWhatsAppOtpPayload(payload) {
  const mobile = normalizeMobile(payload?.mobile || payload?.phone);
  const otp = String(payload?.otp || payload?.code || "").replace(/\D/g, "");
  const name = String(payload?.name || payload?.fullName || "").trim();
  const email = normalizeOptionalEmail(payload?.email);

  if (otp.length < 4 || otp.length > 8) {
    throwBadRequest("A valid WhatsApp OTP is required.");
  }

  return { mobile, otp, name, email };
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeOptionalEmail(email) {
  const value = normalizeEmail(email);
  if (!value) return "";
  if (!/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value)) {
    throwBadRequest("email must be valid.");
  }
  return value;
}

function normalizeMobile(value) {
  const digits = String(value || "").replace(/\D/g, "");
  const normalized = digits.length > 10 && digits.startsWith("91") ? digits.slice(-10) : digits.slice(-10);
  if (normalized.length !== 10) {
    throwBadRequest("mobile must be a valid 10 digit number.");
  }
  return `91${normalized}`;
}

function consumeWhatsAppOtp(mobile, otp) {
  const record = whatsappOtpStore.get(mobile);
  if (!record || record.expiresAt < Date.now()) {
    whatsappOtpStore.delete(mobile);
    throwBadRequest("WhatsApp OTP expired. Please request a new code.");
  }
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    whatsappOtpStore.delete(mobile);
    throwBadRequest("Too many invalid OTP attempts. Please request a new code.");
  }
  if (record.hash !== hashOtp(mobile, otp)) {
    record.attempts += 1;
    throwBadRequest("Invalid WhatsApp OTP.");
  }
  whatsappOtpStore.delete(mobile);
}

function setMemoryOtp(mobile, otp, ttlMs) {
  whatsappOtpStore.set(mobile, {
    hash: hashOtp(mobile, otp),
    expiresAt: Date.now() + ttlMs,
    sentAt: Date.now(),
    attempts: 0
  });
}

async function storeOtpVerification({ mobile, otp, expiresAt, isTestUser }) {
  const normalizedMobile = normalizeMobile(mobile);
  const localMobile = normalizedMobile.slice(-10);
  await supabaseAdmin
    .from(OTP_VERIFICATIONS_TABLE)
    .delete()
    .in("mobile", mobileVariants(normalizedMobile));

  const row = {
    mobile: normalizedMobile,
    otp_code: otp,
    otp_hash: hashOtp(normalizedMobile, otp),
    expires_at: expiresAt.toISOString(),
    used: false,
    is_test_user: Boolean(isTestUser),
    updated_at: new Date().toISOString()
  };

  const { error } = await supabaseAdmin
    .from(OTP_VERIFICATIONS_TABLE)
    .insert(row);

  if (!error) return true;

  const fallbackRow = {
    mobile: normalizedMobile,
    otp_hash: row.otp_hash,
    expires_at: row.expires_at,
    used: false
  };
  const { error: fallbackError } = await supabaseAdmin
    .from(OTP_VERIFICATIONS_TABLE)
    .insert(fallbackRow);

  if (fallbackError) {
    console.warn("[WhatsApp OTP] Database OTP write skipped", {
      mobile: maskMobile(localMobile),
      error: fallbackError.message
    });
    return false;
  }

  return true;
}

async function consumeStoredOtpVerification(mobile, otp) {
  const variants = mobileVariants(mobile);
  let rows = [];
  try {
    const { data, error } = await supabaseAdmin
      .from(OTP_VERIFICATIONS_TABLE)
      .select("id, mobile, otp_code, otp_hash, expires_at, used, is_test_user")
      .in("mobile", variants)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.warn("[WhatsApp OTP] Database OTP read skipped", { mobile: maskMobile(mobile), error: error.message });
      return false;
    }
    rows = data || [];
  } catch (error) {
    console.warn("[WhatsApp OTP] Database OTP read failed", { mobile: maskMobile(mobile), error: error.message });
    return false;
  }

  const now = Date.now();
  const matchingRow = rows.find((row) => {
    const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : 0;
    const directMatch = row.otp_code && String(row.otp_code).replace(/\D/g, "") === otp;
    const hashMatch = row.otp_hash && row.otp_hash === hashOtp(normalizeMobile(mobile), otp);
    return expiresAt > now && (directMatch || hashMatch);
  });

  if (!matchingRow) {
    if (rows.length) throwBadRequest("Invalid OTP");
    return false;
  }

  if (!matchingRow.is_test_user) {
    const { error } = await supabaseAdmin
      .from(OTP_VERIFICATIONS_TABLE)
      .update({ used: true, updated_at: new Date().toISOString() })
      .eq("id", matchingRow.id);
    if (error) {
      console.warn("[WhatsApp OTP] Database OTP used update skipped", {
        mobile: maskMobile(mobile),
        error: error.message
      });
    }
  }

  return true;
}

async function findSampleOtpLogin(mobile) {
  let data = null;
  let error = null;
  try {
    const result = await supabaseAdmin
      .from(SAMPLE_OTP_TABLE)
      .select("mobile, otp_code, display_name, is_active")
      .in("mobile", mobileVariants(mobile))
      .eq("is_active", true)
      .limit(1);
    data = (result.data || [])[0] || null;
    error = result.error;
  } catch {
    return fallbackSampleOtpLogin(mobile);
  }

  if (error) {
    return fallbackSampleOtpLogin(mobile);
  }

  if (!data) {
    return fallbackSampleOtpLogin(mobile);
  }

  const otp = String(data.otp_code || "").replace(/\D/g, "");
  return otp.length >= 4
    ? { mobile: data.mobile, otp, name: data.display_name || "WhatsApp User" }
    : null;
}

function fallbackSampleOtpLogin(mobile) {
  if (!isDevelopment() && !isTestOtpEnabled()) {
    return null;
  }

  const fallbackOtp = String(process.env.SAMPLE_LOGIN_OTP || process.env.FIXED_LOGIN_OTP || configuredTestOtp()).replace(/\D/g, "");
  if (fallbackOtp.length < 4) return null;
  const sampleMobile = normalizeMobile(process.env.SAMPLE_LOGIN_MOBILE || process.env.FIXED_LOGIN_MOBILE || configuredTestMobile());
  if (sampleMobile && mobile !== sampleMobile) return null;

  return {
    mobile,
    otp: fallbackOtp,
    name: "WhatsApp User"
  };
}

async function ensureWhatsAppAuthUser(input) {
  const email = whatsAppEmail(input.mobile);
  const password = whatsappPassword(input.mobile);
  const existing = await findAuthUserByEmail(email);

  if (existing) {
    const metadata = {
      ...(existing.user_metadata || {}),
      full_name: input.name || existing.user_metadata?.full_name || input.mobile,
      mobile: input.mobile,
      whatsapp_login: true,
      email: input.email || existing.user_metadata?.email || "",
      is_test_user: Boolean(input.isTestUser || existing.user_metadata?.is_test_user)
    };
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
      password,
      user_metadata: metadata
    });
    throwIfAuthError(error, "WhatsApp login failed. Please try again.");
    return data.user || existing;
  }

  const metadata = {
    full_name: input.name || input.mobile,
    mobile: input.mobile,
    whatsapp_login: true,
    email: input.email || "",
    is_test_user: Boolean(input.isTestUser)
  };
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    phone_confirm: true,
    user_metadata: metadata
  });
  throwIfAuthError(error, "WhatsApp login failed. Please try again.");
  return data.user;
}

async function findAuthUserByEmail(email) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    throwIfAuthError(error, "Unable to check WhatsApp user.");
    const user = (data?.users || []).find((item) => String(item.email || "").toLowerCase() === email);
    if (user) return user;
    if ((data?.users || []).length < 1000) return null;
  }
  return null;
}

function whatsAppEmail(mobile) {
  return `${String(mobile || "").replace(/\D/g, "")}@whatsapp.enjoyfreedeals.app`;
}

function whatsappPassword(mobile) {
  const secret = process.env.WHATSAPP_OTP_PASSWORD_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "enjoyfreedeals-whatsapp-password";
  return `WAp-${crypto.createHmac("sha256", secret).update(mobile).digest("hex").slice(0, 40)}!9`;
}

function isDevelopment() {
  return /^development$/i.test(process.env.APP_ENV || process.env.NODE_ENV || "");
}

function isTestOtpEnabled() {
  return /^true$/i.test(String(process.env.USE_TEST_OTP || ""));
}

function configuredTestMobile() {
  return process.env.TEST_MOBILE || process.env.SAMPLE_LOGIN_MOBILE || process.env.FIXED_LOGIN_MOBILE || "9699353648";
}

function configuredTestOtp() {
  return configuredTestOtps()[0] || "123457";
}

function configuredTestOtps() {
  const configured = [
    process.env.TEST_OTP,
    process.env.SAMPLE_LOGIN_OTP,
    process.env.FIXED_LOGIN_OTP,
    process.env.TEST_OTPS
  ]
    .filter(Boolean)
    .flatMap((value) => String(value).split(","))
    .map((value) => value.replace(/\D/g, ""))
    .filter((value) => value.length >= 4 && value.length <= 8);

  return Array.from(new Set([...configured, "123457", "123456"]));
}

function isConfiguredTestOtp(otp) {
  const normalizedOtp = String(otp || "").replace(/\D/g, "");
  return configuredTestOtps().includes(normalizedOtp);
}

function isConfiguredTestMobile(mobile) {
  if (!isTestOtpEnabled()) return false;
  return normalizeMobile(mobile) === normalizeMobile(configuredTestMobile());
}

function mobileVariants(mobile) {
  const normalized = normalizeMobile(mobile);
  return Array.from(new Set([normalized, normalized.slice(-10)]));
}

function maskMobile(mobile) {
  const digits = String(mobile || "").replace(/\D/g, "");
  if (digits.length <= 4) return "****";
  return `${"*".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}

function throwBadRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  throw error;
}

function throwIfAuthError(error, fallbackMessage) {
  if (!error) return;

  const message = error.message || fallbackMessage || "Authentication failed.";
  const code = error.code || "AUTH_ERROR";
  const normalized = new Error(message);
  normalized.statusCode = 400;
  normalized.code = code;

  if (/invalid login credentials|invalid credentials/i.test(message)) {
    normalized.message = "Invalid email or password.";
    normalized.statusCode = 401;
  } else if (/jwt|invalid.*token|token.*invalid|expired|issuer|audience|nonce/i.test(message)) {
    normalized.message = "Invalid authentication token.";
    normalized.statusCode = 401;
  } else if (/already registered|already exists|duplicate/i.test(message)) {
    normalized.message = "Account already exists. Please login instead.";
    normalized.statusCode = 409;
  } else if (/not found|missing/i.test(message)) {
    normalized.statusCode = 404;
  }

  throw normalized;
}

function toAuthResponse(session, authUser, profile, mobileOverride) {
  return {
    user: toApiUser(authUser, profile, mobileOverride),
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt: session.expiresAt,
    tokenType: session.tokenType
  };
}

function toApiUser(authUser, profile, mobileOverride) {
  const metadata = authUser.user_metadata || {};
  const profileEmail = profile?.email || "";
  const syntheticEmail = /@whatsapp\.enjoyfreedeals\.(app|local)$/i.test(profileEmail);
  return {
    userId: authUser.id,
    name: profile?.full_name || metadata.full_name || authUser.email?.split("@")[0] || "",
    email: syntheticEmail
      ? metadata.email || ""
      : profileEmail || metadata.email || (metadata.whatsapp_login ? "" : authUser.email || ""),
    mobile: mobileOverride || metadata.mobile || "",
    isTestUser: Boolean(metadata.is_test_user),
    profileImage: profile?.avatar_url || metadata.avatar_url || "",
    referralCode: profile?.referral_code || "",
    createdAt: profile?.created_at || authUser.created_at || null,
    updatedAt: profile?.updated_at || authUser.updated_at || null
  };
}

module.exports = {
  requestWhatsAppOtp,
  verifyWhatsAppOtp,
  getCurrentUser
};
