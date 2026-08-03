const axios = require("axios");

// In-memory cache — one partner token shared by the whole backend process.
// Re-logs-in automatically when the cached token is missing or close to expiry.
let cachedToken = null;
let cachedExpiry = 0; // epoch seconds

function decodeJwtExpiry(token) {
  try {
    const payloadB64 = token.split(".")[1];
    const payload = JSON.parse(Buffer.from(payloadB64, "base64").toString("utf-8"));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

function hasCredentials() {
  return Boolean(process.env.PARTNER_IDENTIFIER && process.env.PARTNER_PASSWORD);
}

/**
 * Returns a valid partner accessToken, logging in via POST /api/v2/partner/login
 * when there's no cached token or the cached one is about to expire.
 */
async function getPartnerToken({ forceRefresh = false } = {}) {
  const now = Math.floor(Date.now() / 1000);

  if (!forceRefresh && cachedToken && now < cachedExpiry - 60) {
    return cachedToken;
  }

  if (!hasCredentials()) {
    throw new Error("PARTNER_IDENTIFIER / PARTNER_PASSWORD are not set in backend/.env");
  }

  const loginUrl = process.env.PARTNER_LOGIN_URL || "https://app2.mfapis.club/api/v2/partner/login";
  const { data } = await axios.post(
    loginUrl,
    {
      identifier: process.env.PARTNER_IDENTIFIER,
      password: process.env.PARTNER_PASSWORD,
    },
    { headers: { "Content-Type": "application/json" } }
  );

  if (!data?.success || !data?.data?.accessToken) {
    throw new Error(data?.message || "Partner login failed");
  }

  cachedToken = data.data.accessToken;
  cachedExpiry = decodeJwtExpiry(cachedToken) || now + 60 * 60;
  return cachedToken;
}

module.exports = { getPartnerToken, hasCredentials };
