import axios from "axios";
import { AUTH_STORAGE_KEY, getStoredAuth } from "./niveshStar";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
});

// This backend validates investor sessions against Nivesh Star's central API, so it
// expects the same access-token/refresh-token headers that API itself uses — not an
// Authorization: Bearer header from a token we minted ourselves (we don't anymore).
api.interceptors.request.use((config) => {
  const auth = getStoredAuth();
  if (auth?.accessToken) {
    config.headers["access-token"] = auth.accessToken;
    config.headers["refresh-token"] = auth.refreshToken || "";
  }
  return config;
});

// Auto-logout on an expired/invalid session — without this, a stale token just
// produces confusing per-request error messages instead of sending the user back
// to log in again (mirrors do-tax-easy's global 401 interceptor).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && getStoredAuth()) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
