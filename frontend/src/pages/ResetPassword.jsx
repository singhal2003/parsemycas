import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

export default function ResetPassword() {
  const { resetPassword, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await resetPassword(email, code, newPassword);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Could not reset password. Check the code and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setNotice("");
    setResending(true);
    try {
      await forgotPassword(email);
      setNotice("A new code has been sent to your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not resend the code.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-slate-900 text-center">Reset your password</h1>
        <p className="text-sm text-slate-500 text-center mt-1">
          Enter the code we sent to your email and choose a new password.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Reset code</label>
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="000000"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">New password</label>
            <input
              required
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-xs text-slate-400 mt-1">
              At least 8 characters, with one letter, one number, and one special character.
            </p>
          </div>

          {error && <div className="text-sm text-rose-600">{error}</div>}
          {notice && <div className="text-sm text-emerald-600">{notice}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg py-2.5 disabled:opacity-60"
          >
            {loading && <Loader2 className="animate-spin" size={18} />}
            Reset password
          </button>
        </form>

        <button
          onClick={handleResend}
          disabled={resending || !email}
          className="w-full text-sm text-brand-600 hover:underline mt-4 disabled:opacity-60"
        >
          {resending ? "Resending..." : "Resend code"}
        </button>
      </div>
    </div>
  );
}
