import { createContext, useContext, useEffect, useState } from "react";
import {
  AUTH_STORAGE_KEY,
  googleLogin as apiGoogleLogin,
  emailPasswordLogin as apiEmailLogin,
  requestSignupOtp as apiRequestSignupOtp,
  completeEmailSignup as apiCompleteSignup,
  requestForgotPasswordOtp as apiRequestForgotPasswordOtp,
  resetPassword as apiResetPassword,
} from "../lib/niveshStar";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {
      // ignore corrupt storage
    }
    setLoading(false);
  }, []);

  function persist(authUser) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    setUser(authUser);
  }

  async function login(idToken) {
    const authUser = await apiGoogleLogin(idToken);
    persist(authUser);
    return authUser;
  }

  async function loginWithEmail(email, password) {
    const authUser = await apiEmailLogin(email, password);
    persist(authUser);
    return authUser;
  }

  async function requestSignupOtp(email) {
    return apiRequestSignupOtp(email);
  }

  async function completeSignup(otpId, otp, password, confirmPassword) {
    const authUser = await apiCompleteSignup(otpId, otp, password, confirmPassword);
    persist(authUser);
    return authUser;
  }

  async function requestForgotPasswordOtp(email) {
    return apiRequestForgotPasswordOtp(email);
  }

  async function resetPassword(otpId, otp, password) {
    await apiResetPassword(otpId, otp, password);
  }

  function logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithEmail,
        requestSignupOtp,
        completeSignup,
        requestForgotPasswordOtp,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
