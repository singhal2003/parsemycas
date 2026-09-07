import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { Loader2, TriangleAlert } from "lucide-react";

export default function Account() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleClearData() {
    setError("");
    setLoading(true);
    try {
      await api.delete("/statements");
      setDone(true);
      setShowConfirm(false);
    } catch (err) {
      setError(err.response?.data?.message || "Could not clear your data. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold text-white">Account</h1>

      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="text-sm text-slate-400">Signed in as</div>
        <div className="mt-1 font-medium text-white">
          {user?.first_name} {user?.last_name}
        </div>
        <div className="text-sm text-slate-400">{user?.email}</div>
        <p className="text-xs text-slate-500 mt-3">
          This is your Nivesh Star account — the same login works across all Nivesh Star products
          (including tax filing). ParseMyCAS doesn't manage your password or login separately.
        </p>
        <button
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="mt-4 text-sm px-3 py-1.5 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors"
        >
          Log out
        </button>
      </div>

      <div className="mt-8 rounded-xl border border-rose-500/20 bg-rose-500/5 p-5">
        <div className="flex items-center gap-2 text-rose-300 font-semibold">
          <TriangleAlert size={18} />
          Danger zone
        </div>
        <p className="text-sm text-rose-300/80 mt-2">
          This clears every statement you've uploaded to ParseMyCAS. It does not delete your Nivesh
          Star account or login — that's shared across other Nivesh Star products, so it isn't
          something this app can remove. This only affects data stored here.
        </p>

        {done && <p className="text-sm text-emerald-400 mt-3">Your uploaded statements have been cleared.</p>}

        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="mt-4 text-sm px-4 py-2 rounded-md border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            Clear my data
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            <label className="text-sm font-medium text-rose-200">
              Type <span className="font-mono font-bold">DELETE</span> to confirm
            </label>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full rounded-lg border border-rose-500/30 bg-slate-950/60 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
              placeholder="DELETE"
            />
            {error && <div className="text-sm text-rose-300">{error}</div>}
            <div className="flex gap-3">
              <button
                onClick={handleClearData}
                disabled={confirmText !== "DELETE" || loading}
                className="flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-md bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-50 transition-colors"
              >
                {loading && <Loader2 className="animate-spin" size={16} />}
                Clear all my statements
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmText("");
                  setError("");
                }}
                disabled={loading}
                className="text-sm px-4 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
