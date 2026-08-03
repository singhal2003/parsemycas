import { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("parsemycas_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then(({ data }) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem("parsemycas_token");
      })
      .finally(() => setLoading(false));
  }, []);

  function persistToken(token) {
    localStorage.setItem("parsemycas_token", token);
  }

  async function signup(name, email, password) {
    const { data } = await api.post("/auth/signup", { name, email, password });
    return data; // { success, message, email } — not logged in yet, needs verification
  }

  async function verifyEmail(email, code) {
    const { data } = await api.post("/auth/verify-email", { email, code });
    persistToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function resendVerification(email) {
    const { data } = await api.post("/auth/resend-verification", { email });
    return data;
  }

  async function login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    persistToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function loginWithToken(token) {
    persistToken(token);
    const { data } = await api.get("/auth/me");
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("parsemycas_token");
    setUser(null);
  }

  async function forgotPassword(email) {
    const { data } = await api.post("/auth/forgot-password", { email });
    return data;
  }

  async function resetPassword(email, code, newPassword) {
    const { data } = await api.post("/auth/reset-password", { email, code, newPassword });
    persistToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function deleteAccount() {
    await api.delete("/auth/me");
    localStorage.removeItem("parsemycas_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signup,
        verifyEmail,
        resendVerification,
        login,
        loginWithToken,
        logout,
        forgotPassword,
        resetPassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
