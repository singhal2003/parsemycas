import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const OTP_RESEND_SECONDS = 60;

export default function Login() {
  const { user, login, loginWithEmail, requestSignupOtp, completeSignup, requestForgotPasswordOtp, resetPassword } =
    useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";
  const [searchParams] = useSearchParams();

  const [mode, setMode] = useState(searchParams.get("mode") === "signup" ? "signup-email" : "signin"); // signin | signup-email | signup-otp | forgot-email | forgot-otp
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpId, setOtpId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startResendTimer() {
    setResendTimer(OTP_RESEND_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  function resetToSignin({ keepNotice = false } = {}) {
    setMode("signin");
    setPassword("");
    setConfirmPassword("");
    setOtp("");
    setOtpId("");
    setError("");
    if (!keepNotice) setNotice("");
    if (timerRef.current) clearInterval(timerRef.current);
    setResendTimer(0);
  }

  async function sendSignupOtp(addr, { isResend = false } = {}) {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const id = await requestSignupOtp(addr);
      setOtpId(id);
      setMode("signup-otp");
      startResendTimer();
      // Only show a confirmation on resend — the "Enter the OTP sent to X" subtitle
      // already says this on the first send, so showing both was redundant.
      if (isResend) setNotice(`A new OTP has been sent to ${addr}`);
    } catch (err) {
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignin(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await loginWithEmail(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRequestSignupOtp(e) {
    e.preventDefault();
    await sendSignupOtp(email);
  }

  async function handleCompleteSignup(e) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await completeSignup(otpId, otp, password, confirmPassword);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Sign-up failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotRequest(e, { isResend = false } = {}) {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const id = await requestForgotPasswordOtp(email);
      setOtpId(id);
      setMode("forgot-otp");
      startResendTimer();
      if (isResend) setNotice(`A new OTP has been sent to ${email}`);
    } catch (err) {
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await resetPassword(otpId, otp, password);
      resetToSignin({ keepNotice: true });
      setNotice("Password reset successfully. Please sign in.");
    } catch (err) {
      setError(err.message || "Reset failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const titles = {
    signin: ["Welcome back", "Log in to see your saved statements."],
    "signup-email": ["Create your account", "Enter your email to get started."],
    "signup-otp": ["Verify your email", `Enter the OTP sent to ${email}`],
    "forgot-email": ["Reset your password", "Enter your email to receive a reset OTP."],
    "forgot-otp": ["Set a new password", `Enter the OTP sent to ${email}`],
  };
  const [title, subtitle] = titles[mode];

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] rounded-full bg-brand-600/10 blur-[110px] -z-10" />
      <div className="w-full max-w-sm bg-slate-900/60 border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-black/40">
        <h1 className="text-2xl font-bold text-white text-center">{title}</h1>
        <p className="text-sm text-slate-400 text-center mt-1">{subtitle}</p>

        {mode === "signin" && (
          <>
            <div className="mt-6 flex justify-center">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  setError("");
                  if (!credentialResponse.credential) {
                    setError("Google did not return a credential. Please try again.");
                    return;
                  }
                  try {
                    await login(credentialResponse.credential);
                    navigate(from, { replace: true });
                  } catch (err) {
                    setError(err.message || "Sign-in failed. Please try again.");
                  }
                }}
                onError={() => setError("Google sign-in failed. Please try again.")}
                shape="rectangular"
                size="large"
                text="continue_with"
                theme="filled_blue"
              />
            </div>
            <div className="flex items-center gap-3 my-5">
              <div className="h-px bg-slate-800 flex-1" />
              <span className="text-xs text-slate-500">or</span>
              <div className="h-px bg-slate-800 flex-1" />
            </div>
          </>
        )}

        {error && (
          <div className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2 mb-3">
            {error}
          </div>
        )}
        {notice && !error && (
          <div className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 mb-3">
            {notice}
          </div>
        )}

        {mode === "signin" && (
          <form onSubmit={handleSignin} className="space-y-4">
            <Field label="Email" type="email" value={email} onChange={setEmail} />
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot-email");
                    setPassword("");
                    setError("");
                    setNotice("");
                  }}
                  className="text-xs text-brand-400 hover:text-brand-300 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            <SubmitButton busy={busy} label="Log in" busyLabel="Signing in..." />
          </form>
        )}

        {mode === "signup-email" && (
          <form onSubmit={handleRequestSignupOtp} className="space-y-4">
            <Field label="Email" type="email" value={email} onChange={setEmail} />
            <SubmitButton busy={busy} label="Send OTP" busyLabel="Sending OTP..." />
          </form>
        )}

        {mode === "signup-otp" && (
          <form onSubmit={handleCompleteSignup} className="space-y-4">
            <OtpField otp={otp} setOtp={setOtp} onEditEmail={() => setMode("signup-email")} />
            <ResendOtp busy={busy} resendTimer={resendTimer} onResend={() => sendSignupOtp(email, { isResend: true })} />
            <Field label="Password" type="password" value={password} onChange={setPassword} minLength={6} />
            <Field
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              minLength={6}
            />
            <SubmitButton busy={busy} label="Create account" busyLabel="Creating account..." />
          </form>
        )}

        {mode === "forgot-email" && (
          <form onSubmit={handleForgotRequest} className="space-y-4">
            <Field label="Email" type="email" value={email} onChange={setEmail} />
            <SubmitButton busy={busy} label="Send reset OTP" busyLabel="Sending OTP..." />
          </form>
        )}

        {mode === "forgot-otp" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <OtpField otp={otp} setOtp={setOtp} onEditEmail={() => setMode("forgot-email")} />
            <ResendOtp
              busy={busy}
              resendTimer={resendTimer}
              onResend={() => handleForgotRequest({ preventDefault() {} }, { isResend: true })}
            />
            <Field label="New password" type="password" value={password} onChange={setPassword} minLength={6} />
            <Field
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              minLength={6}
            />
            <SubmitButton busy={busy} label="Reset password" busyLabel="Resetting..." />
          </form>
        )}

        <p className="text-sm text-slate-500 text-center mt-6">
          {mode === "signin" && (
            <>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => {
                  setMode("signup-email");
                  setError("");
                  setNotice("");
                }}
                className="text-brand-400 font-medium hover:text-brand-300 hover:underline"
              >
                Sign up
              </button>
            </>
          )}
          {(mode === "signup-email" || mode === "signup-otp") && (
            <>
              Already have an account?{" "}
              <button onClick={resetToSignin} className="text-brand-400 font-medium hover:text-brand-300 hover:underline">
                Log in
              </button>
            </>
          )}
          {(mode === "forgot-email" || mode === "forgot-otp") && (
            <>
              Remember your password?{" "}
              <button onClick={resetToSignin} className="text-brand-400 font-medium hover:text-brand-300 hover:underline">
                Log in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange, minLength }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-300">{label}</label>
      <input
        required
        type={type}
        value={value}
        minLength={minLength}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
      />
    </div>
  );
}

function OtpField({ otp, setOtp, onEditEmail }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300">OTP</label>
        <button type="button" onClick={onEditEmail} className="text-xs text-brand-400 hover:text-brand-300 hover:underline">
          Edit email?
        </button>
      </div>
      <input
        required
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
        inputMode="numeric"
        maxLength={4}
        placeholder="0000"
        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 text-slate-100 placeholder-slate-600 px-3 py-2 text-sm tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
      />
    </div>
  );
}

function ResendOtp({ busy, resendTimer, onResend }) {
  return (
    <div className="text-center text-xs text-slate-500">
      Didn&apos;t receive the OTP?{" "}
      {resendTimer > 0 ? (
        <span>Resend in {resendTimer}s</span>
      ) : (
        <button type="button" onClick={onResend} disabled={busy} className="text-brand-400 hover:text-brand-300 hover:underline disabled:opacity-60">
          Resend OTP
        </button>
      )}
    </div>
  );
}

function SubmitButton({ busy, label, busyLabel }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white font-medium rounded-lg py-2.5 shadow-lg shadow-brand-600/20 disabled:opacity-60 transition-all"
    >
      {busy && <Loader2 className="animate-spin" size={18} />}
      {busy ? busyLabel : label}
    </button>
  );
}
