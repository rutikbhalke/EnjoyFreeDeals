const crypto = require("crypto");
const { supabaseAdmin, supabasePublic } = require("../config/supabaseClient");
const { generateOtp, hashOtp, sendWhatsAppOtp } = require("../services/whatsappOtpService");
const { throwIfSupabaseError } = require("../utils/supabaseErrors");

const PROFILES_TABLE = "profiles";
const OTP_TTL_MS = Number(process.env.WHATSAPP_OTP_TTL_SECONDS || 300) * 1000;
const OTP_RESEND_MS = Number(process.env.WHATSAPP_OTP_RESEND_SECONDS || 45) * 1000;
const OTP_MAX_ATTEMPTS = Number(process.env.WHATSAPP_OTP_MAX_ATTEMPTS || 5);
const SAMPLE_OTP_TABLE = "sample_whatsapp_otp_logins";
const whatsappOtpStore = new Map();

async function requestWhatsAppOtp(payload) {
  const mobile = normalizeMobile(payload?.mobile || payload?.phone);
  const sampleLogin = await findSampleOtpLogin(mobile);
  if (sampleLogin) {
    whatsappOtpStore.set(mobile, {
      hash: hashOtp(mobile, sampleLogin.otp),
      expiresAt: Date.now() + OTP_TTL_MS,
      sentAt: Date.now(),
      attempts: 0
    });
    return {
      mobile,
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
  const otpRecord = {
    hash: hashOtp(mobile, otp),
    expiresAt: Date.now() + OTP_TTL_MS,
    sentAt: Date.now(),
    attempts: 0
  };
  await sendWhatsAppOtp(mobile, otp);
  whatsappOtpStore.set(mobile, otpRecord);
  return {
    mobile,
    expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
    resendAfterSeconds: Math.floor(OTP_RESEND_MS / 1000)
  };
}

async function verifyWhatsAppOtp(payload) {
  const input = normalizeWhatsAppOtpPayload(payload);
  const sampleLogin = await findSampleOtpLogin(input.mobile);
  if (sampleLogin && input.otp === sampleLogin.otp) {
    whatsappOtpStore.delete(input.mobile);
    input.name = input.name || sampleLogin.name;
  } else {
    consumeWhatsAppOtp(input.mobile, input.otp);
  }
  const authUser = await ensureWhatsAppAuthUser(input);
  const session = await signInWithPassword(whatsAppEmail(input.mobile), whatsappPassword(input.mobile));
  const profile = await upsertProfile(session.user, {
    name: input.name,
    email: input.email,
    mobile: input.mobile
  });
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

async function findSampleOtpLogin(mobile) {
  let data = null;
  let error = null;
  try {
    const result = await supabaseAdmin
      .from(SAMPLE_OTP_TABLE)
      .select("mobile, otp_code, display_name, is_active")
      .eq("mobile", mobile)
      .eq("is_active", true)
      .maybeSingle();
    data = result.data;
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
  if (!isDevelopment()) {
    return null;
  }

  const fallbackOtp = String(process.env.SAMPLE_LOGIN_OTP || process.env.FIXED_LOGIN_OTP || "123456").replace(/\D/g, "");
  if (fallbackOtp.length < 4) return null;

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
      email: input.email || existing.user_metadata?.email || ""
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
    email: input.email || ""
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
