const crypto = require("crypto");

async function sendWhatsAppOtp(mobile, otp) {
  const config = whatsappConfig();
  validateWhatsAppConfig(config);

  if (config.devMode) {
    console.info(`WhatsApp OTP dev delivery for ${maskMobile(mobile)}: ${otp}`);
    return { provider: "dev", delivered: true };
  }

  const requestBody = buildPayload(config, mobile, otp);
  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": `Bearer ${config.authToken}`,
    "X-MYOP-COMPANY-ID": config.companyId
  };

  logMyOperatorRequest(config, headers, requestBody);

  const response = await fetch(config.url, {
    method: "POST",
    headers,
    body: JSON.stringify(requestBody)
  });

  const text = await response.text();
  const payload = safeJson(text);
  logMyOperatorResponse(response, payload || text);

  if (!response.ok) {
    const message = myOperatorErrorMessage(payload, text);
    const error = new Error(message);
    error.statusCode = response.status >= 400 && response.status < 500 ? 400 : 502;
    error.details = payload || text;
    throw error;
  }

  return {
    provider: "myoperator",
    delivered: true,
    response: payload || text
  };
}

function buildPayload(config, mobile, otp) {
  if (config.payloadTemplate) {
    return safeJson(
      config.payloadTemplate
        .replaceAll("{{mobile}}", mobile)
        .replaceAll("{{mobile_digits}}", mobile.replace(/\D/g, ""))
        .replaceAll("{{otp}}", otp)
        .replaceAll("{{template_name}}", config.templateName)
        .replaceAll("{{company_id}}", config.companyId)
        .replaceAll("{{phone_number_id}}", config.phoneNumberId)
        .replaceAll("{{waba_id}}", config.wabaId)
        .replaceAll("{{business_name}}", config.businessName)
        .replaceAll("{{business_phone}}", config.businessPhone)
    );
  }

  const phone = splitIndianMobile(mobile);
  return {
    phone_number_id: config.phoneNumberId,
    customer_country_code: phone.countryCode,
    customer_number: phone.customerNumber,
    data: {
      type: "template",
      context: {
        template_name: config.templateName,
        body: { otp },
        buttons: [{ index: 0, otp }]
      }
    }
  };
}

function myOperatorErrorMessage(payload, rawText) {
  const rawMessage = payload?.message || payload?.Message || payload?.error || payload?.Error || rawText || "";
  const messageText = typeof rawMessage === "string" ? rawMessage : JSON.stringify(rawMessage);

  if (/not authorized|explicit deny|identity-based policy|unauthorized|authentication/i.test(messageText)) {
    return "WhatsApp OTP provider is not configured. Please update MyOperator token/company/phone number settings.";
  }

  if (/template/i.test(messageText)) {
    return "WhatsApp OTP template is not approved or not available. Check the otp_verify template in MyOperator.";
  }

  return messageText || "WhatsApp OTP delivery failed.";
}

function splitIndianMobile(mobile) {
  const digits = String(mobile || "").replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("91")) {
    return { countryCode: "91", customerNumber: digits.slice(-10), international: digits.slice(-12) };
  }
  const customerNumber = digits.slice(-10);
  return { countryCode: "91", customerNumber, international: `91${customerNumber}` };
}

function whatsappConfig() {
  const baseUrl = cleanEnv("MYOPERATOR_BASE_URL") ||
    cleanEnv("MYOPERATOR_WHATSAPP_BASE_URL") ||
    "https://publicapi.myoperator.co";
  const sendPath = cleanEnv("MYOPERATOR_SEND_PATH") ||
    cleanEnv("MYOPERATOR_WHATSAPP_SEND_PATH") ||
    "/chat/messages";
  return {
    url: `${baseUrl.replace(/\/+$/, "")}/${sendPath.replace(/^\/+/, "")}`,
    authToken: cleanEnv("MYOPERATOR_API_TOKEN"),
    companyId: cleanEnv("MYOPERATOR_COMPANY_ID"),
    phoneNumberId: cleanEnv("MYOPERATOR_PHONE_NUMBER_ID"),
    wabaId: cleanEnv("MYOPERATOR_WHATSAPP_WABA_ID") || cleanEnv("WHATSAPP_WABA_ID"),
    businessName: cleanEnv("MYOPERATOR_WHATSAPP_BUSINESS_NAME") || cleanEnv("WHATSAPP_BUSINESS_NAME"),
    businessPhone: cleanEnv("MYOPERATOR_WHATSAPP_BUSINESS_PHONE") || cleanEnv("WHATSAPP_BUSINESS_PHONE"),
    templateName: cleanEnv("MYOPERATOR_WHATSAPP_TEMPLATE_NAME"),
    templateLanguage: cleanEnv("MYOPERATOR_WHATSAPP_TEMPLATE_LANGUAGE") || "en",
    payloadTemplate: cleanEnv("MYOPERATOR_WHATSAPP_PAYLOAD_TEMPLATE"),
    devMode: isDevelopment() || /^true$/i.test(cleanEnv("MYOPERATOR_WHATSAPP_DEV_MODE") || "")
  };
}

function validateWhatsAppConfig(config) {
  const missing = [];
  if (!config.authToken && !config.devMode) missing.push("MYOPERATOR_API_TOKEN");
  if (!config.companyId && !config.devMode) missing.push("MYOPERATOR_COMPANY_ID");
  if (!config.phoneNumberId && !config.devMode) missing.push("MYOPERATOR_PHONE_NUMBER_ID");
  if (!config.templateName) missing.push("MYOPERATOR_WHATSAPP_TEMPLATE_NAME");

  if (missing.length > 0) {
    const error = new Error("WhatsApp OTP provider is not configured. Please update MyOperator token/company/phone number settings.");
    error.statusCode = 500;
    error.code = "MYOPERATOR_CONFIG_MISSING";
    error.details = { missing };
    throw error;
  }
}

function logMyOperatorRequest(config, headers, body) {
  console.info("[MyOperator WhatsApp OTP] Request", {
    url: config.url,
    method: "POST",
    headers: {
      ...headers,
      Authorization: maskToken(headers.Authorization)
    },
    body: {
      ...body,
      data: {
        ...body.data,
        context: {
          ...body.data?.context,
          body: maskOtpBody(body.data?.context?.body),
          buttons: maskOtpButtons(body.data?.context?.buttons)
        }
      }
    }
  });
}

function logMyOperatorResponse(response, payload) {
  console.info("[MyOperator WhatsApp OTP] Response", {
    status: response.status,
    ok: response.ok,
    body: payload
  });
}

function maskToken(value) {
  const token = String(value || "").replace(/^Bearer\s+/i, "");
  if (!token) return "";
  return `Bearer ${token.slice(0, 6)}...${token.slice(-4)}`;
}

function maskOtpBody(body) {
  if (!body || typeof body !== "object") return body;
  return Object.fromEntries(Object.entries(body).map(([key, value]) => [key, key.toLowerCase() === "otp" ? "******" : value]));
}

function maskOtpButtons(buttons) {
  if (!Array.isArray(buttons)) return buttons;
  return buttons.map((button) => ({ ...button, otp: button.otp ? "******" : button.otp }));
}

function cleanEnv(name) {
  return String(process.env[name] || "").trim();
}

function maskMobile(mobile) {
  const value = String(mobile || "");
  return value.length > 4 ? `${"*".repeat(Math.max(0, value.length - 4))}${value.slice(-4)}` : "****";
}

function safeJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function generateOtp() {
  return String(crypto.randomInt(1000, 10000));
}

function hashOtp(mobile, otp) {
  return crypto
    .createHmac("sha256", otpSecret())
    .update(`${mobile}:${otp}`)
    .digest("hex");
}

function otpSecret() {
  return cleanEnv("WHATSAPP_OTP_SECRET") ||
    cleanEnv("JWT_SECRET") ||
    cleanEnv("SUPABASE_SERVICE_ROLE_KEY") ||
    "enjoyfreedeals-dev-otp-secret";
}

function isDevelopment() {
  return /^development$/i.test(cleanEnv("APP_ENV") || cleanEnv("NODE_ENV") || "");
}

module.exports = {
  generateOtp,
  hashOtp,
  sendWhatsAppOtp,
  splitIndianMobile
};
