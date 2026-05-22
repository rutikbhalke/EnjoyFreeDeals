const { supabaseAdmin, supabasePublic } = require("../config/supabaseClient");
const { throwIfSupabaseError } = require("../utils/supabaseErrors");

const PROFILES_TABLE = "profiles";

async function register(payload) {
  const input = normalizeCredentials(payload, { requireName: true, requireMobile: true });

  const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: input.name,
      mobile: input.mobile
    }
  });

  throwIfAuthError(createError, "Registration failed. Please try again.");

  const authUser = createdUser.user;
  const profile = await upsertProfile(authUser, {
    name: input.name,
    email: input.email,
    mobile: input.mobile
  });

  const session = await signInWithPassword(input.email, input.password);
  return toAuthResponse(session, authUser, profile, input.mobile);
}

async function login(payload) {
  const input = normalizeCredentials(payload);
  const session = await signInWithPassword(input.email, input.password);
  const authUser = session.user;
  const profile = await ensureProfile(authUser);
  return toAuthResponse(session, authUser, profile);
}

async function loginWithGoogle(payload) {
  const input = normalizeGooglePayload(payload);
  const credentials = {
    provider: "google",
    token: input.idToken
  };

  if (input.accessToken) {
    credentials.access_token = input.accessToken;
  }
  if (input.nonce) {
    credentials.nonce = input.nonce;
  }

  const { data, error } = await supabasePublic.auth.signInWithIdToken(credentials);
  throwIfAuthError(error, "Google login failed. Please try again.");

  if (!data.session || !data.user) {
    const missingSession = new Error("Google session could not be created. Please try again.");
    missingSession.statusCode = 500;
    throw missingSession;
  }

  const authUser = data.user;
  const profile = await upsertProfile(authUser, {
    name:
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      authUser.email?.split("@")[0] ||
      "",
    email: authUser.email || ""
  });

  return toAuthResponse(
    {
      user: authUser,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
      tokenType: data.session.token_type || "bearer"
    },
    authUser,
    profile
  );
}

async function sendPasswordReset(payload) {
  const email = normalizeEmail(payload?.email);
  if (!email) {
    throwBadRequest("email is required.");
  }

  const { error } = await supabasePublic.auth.resetPasswordForEmail(email);
  throwIfAuthError(error, "Password reset failed. Please try again.");
  return { email };
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
  const profileBody = {
    user_id: authUser.id,
    full_name: overrides.name || authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "",
    email: overrides.email || authUser.email || "",
    avatar_url: authUser.user_metadata?.avatar_url || null,
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

function normalizeCredentials(payload, options = {}) {
  const email = normalizeEmail(payload?.email);
  const password = String(payload?.password || "");
  const name = String(payload?.name || payload?.fullName || "").trim();
  const mobile = String(payload?.mobile || payload?.phone || "").trim();

  if (!email) {
    throwBadRequest("email is required.");
  }
  if (!password) {
    throwBadRequest("password is required.");
  }
  if (password.length < 6) {
    throwBadRequest("password must be at least 6 characters.");
  }
  if (options.requireName && !name) {
    throwBadRequest("name is required.");
  }
  if (options.requireMobile && !mobile) {
    throwBadRequest("mobile is required.");
  }

  return { email, password, name, mobile };
}

function normalizeGooglePayload(payload) {
  const idToken = String(payload?.idToken || payload?.id_token || "").trim();
  const accessToken = String(payload?.accessToken || payload?.access_token || "").trim();
  const nonce = String(payload?.nonce || "").trim();

  if (!idToken) {
    throwBadRequest("idToken is required.");
  }

  return { idToken, accessToken, nonce };
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
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
  } else if (/provider.*disabled|provider.*not.*enabled|unsupported provider|external provider|oauth.*provider|google.*provider/i.test(`${code} ${message}`)) {
    normalized.message = "Google login is not configured in Supabase. Enable the Google provider and add the Google client secret.";
    normalized.statusCode = 500;
  } else if (/id token|jwt|invalid.*token|token.*invalid|expired|issuer|audience|nonce/i.test(message)) {
    normalized.message = "Invalid Google sign-in token.";
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
  return {
    userId: authUser.id,
    name: profile?.full_name || metadata.full_name || authUser.email?.split("@")[0] || "",
    email: profile?.email || authUser.email || "",
    mobile: mobileOverride || metadata.mobile || "",
    profileImage: profile?.avatar_url || metadata.avatar_url || "",
    referralCode: profile?.referral_code || "",
    createdAt: profile?.created_at || authUser.created_at || null,
    updatedAt: profile?.updated_at || authUser.updated_at || null
  };
}

module.exports = {
  register,
  login,
  loginWithGoogle,
  sendPasswordReset,
  getCurrentUser
};
