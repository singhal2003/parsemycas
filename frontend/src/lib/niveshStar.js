/**
 * Client for Nivesh Star's central account system — the same backend (app2.mfapis.club)
 * that serves /cas/ai/parse. ParseMyCAS has no signup/login of its own: accounts are
 * shared across every Nivesh Star product (do-tax-easy, etc.), so the browser talks
 * to this API directly, exactly like do-tax-easy/src/lib/auth.ts does.
 *
 * PARTNER_ID was confirmed by decoding our own partner JWT (see
 * backend/scripts/check-partner-id.js) — it's the same id do-tax-easy uses.
 */
const API_BASE_URL = (import.meta.env.VITE_NIVESH_STAR_API_BASE_URL || "https://app2.mfapis.club/api/v2").replace(
  /\/$/,
  ""
);
const PARTNER_ID = "2b264d7c-054g-5576-bbee-54f5g8g38939";
const SOURCE = "cas_parser";

export const AUTH_STORAGE_KEY = "parsemycas.auth";

async function request(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (res.status >= 500) throw new Error(`Server error (${res.status}). Please try again later.`);
    const json = await res.json().catch(() => {
      throw new Error(`Unexpected server response (${res.status})`);
    });
    if (!json.success) throw new Error(json.message || "Request failed");
    return json.data;
  } catch (err) {
    if (err.name === "AbortError") throw new Error("Request timed out. Please check your connection and try again.");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export function authHeaders(accessToken, refreshToken) {
  return { "access-token": accessToken, "refresh-token": refreshToken || "" };
}

export function getStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function googleLogin(idToken) {
  return request(`${API_BASE_URL}/user/google_login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token: idToken, partner_id: PARTNER_ID, source: SOURCE }),
  });
}

export async function emailPasswordLogin(email, password) {
  return request(`${API_BASE_URL}/user/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: email, password, role: "INVESTOR" }),
  });
}

export async function requestSignupOtp(email) {
  const data = await request(`${API_BASE_URL}/otp/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: email, type: "EMAIL", partner_id: PARTNER_ID, source: SOURCE }),
  });
  return data.otp_id;
}

export async function completeEmailSignup(otpId, otp, password, confirmPassword) {
  return request(`${API_BASE_URL}/user/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ otp_id: otpId, otp, password, confirm_password: confirmPassword, role: "INVESTOR" }),
  });
}

export async function requestForgotPasswordOtp(email) {
  const data = await request(`${API_BASE_URL}/otp/reset_password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: email, type: "EMAIL", source: SOURCE }),
  });
  return data.otp_id;
}

export async function resetPassword(otpId, otp, password) {
  return request(`${API_BASE_URL}/user/reset_password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ otp_id: otpId, otp, password }),
  });
}

export async function fetchProfile(accessToken, refreshToken) {
  return request(`${API_BASE_URL}/investor`, {
    headers: authHeaders(accessToken, refreshToken),
  });
}
