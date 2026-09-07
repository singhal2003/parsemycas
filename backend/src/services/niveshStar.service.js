const axios = require("axios");

/**
 * Client for Nivesh Star's central account system (the same backend — mf-engine-v2,
 * reachable at app2.mfapis.club — that also serves /cas/ai/parse). ParseMyCAS no
 * longer keeps its own users table or issues its own session tokens: accounts are
 * shared across all Nivesh Star products (this app, do-tax-easy, etc.), so signup
 * and login happen against this central system instead, using our partner_id.
 *
 * See do-tax-easy/src/lib/auth.ts for the reference implementation this mirrors.
 */
const API_BASE_URL = (process.env.NIVESH_STAR_API_BASE_URL || "https://app2.mfapis.club/api/v2").replace(/\/$/, "");

/**
 * Confirmed by decoding our own partner JWT (see backend/scripts/check-partner-id.js) —
 * this is the real Nivesh Star partner id, the same one do-tax-easy uses.
 */
const PARTNER_ID = process.env.NIVESH_STAR_PARTNER_ID || "2b264d7c-054g-5576-bbee-54f5g8g38939";

function authHeaders(accessToken, refreshToken) {
  return { "access-token": accessToken, "refresh-token": refreshToken || "" };
}

/**
 * Validates an investor's access/refresh token by fetching their profile from the
 * central system. Used as our own backend's auth check — we don't verify the JWT
 * ourselves (we don't hold Nivesh Star's signing secret), we just ask the source of
 * truth whether this token identifies a real, currently-valid investor.
 */
async function fetchInvestorProfile(accessToken, refreshToken) {
  let data;
  try {
    ({ data } = await axios.get(`${API_BASE_URL}/investor`, {
      headers: authHeaders(accessToken, refreshToken),
      validateStatus: () => true,
      timeout: 8000, // don't let every protected request hang forever if the central API stalls
    }));
  } catch (e) {
    const err = new Error("Could not reach the account system. Please try again.");
    err.status = 503;
    throw err;
  }
  if (!data?.success) {
    const err = new Error(data?.message || "Could not verify investor session");
    err.status = 401;
    throw err;
  }
  return data.data;
}

module.exports = { API_BASE_URL, PARTNER_ID, authHeaders, fetchInvestorProfile };
