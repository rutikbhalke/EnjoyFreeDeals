const crypto = require("crypto");

function normalizeIndianMobile(mobile) {
  const digits = String(mobile || "").replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  return digits;
}

function hashOtp(mobile, otp) {
  const secret = process.env.WHATSAPP_OTP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "enjoyfreedeals-otp";
  return crypto.createHmac("sha256", secret).update(`${normalizeIndianMobile(mobile)}:${otp}`).digest("hex");
}

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function testOtp() {
  return process.env.TEST_OTP || "123456";
}

function useTestOtp() {
  return /^true$/i.test(String(process.env.USE_TEST_OTP || ""));
}

module.exports = { generateOtp, hashOtp, normalizeIndianMobile, testOtp, useTestOtp };
