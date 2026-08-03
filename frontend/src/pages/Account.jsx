import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2, TriangleAlert } from "lucide-react";

export default function Account() {
  const { user, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setError("");
    setLoading(true);
    try {
      await deleteAccount();
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete your account. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Account</h1>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <div className="text-sm text-slate-500">Signed in as</div>
        <div className="mt-1 font-medium text-slate-900">{user?.name}</div>
        <div className="text-sm text-slate-500">{user?.email}</div>
      </div>

      <div className="mt-8 rounded-lg border border-rose-200 bg-rose-50 p-5">
        <div className="flex items-center gap-2 text-rose-700 font-semibold">
          <TriangleAlert size={18} />
          Danger zone
        </div>
        <p className="text-sm text-rose-700/90 mt-2">
          Deleting your account permanently removes your login and every statement you've uploaded.
          This can't be undone — if you sign up again with the same email later, you'll start with a
          completely fresh, empty account.
        </p>

        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="mt-4 text-sm px-4 py-2 rounded-md border border-rose-300 text-rose-700 hover:bg-rose-100"
          >
            Delete my account
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            <label className="text-sm font-medium text-rose-800">
              Type <span className="font-mono font-bold">DELETE</span> to confirm
            </label>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full rounded-lg border border-rose-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
              placeholder="DELETE"
            />
            {error && <div className="text-sm text-rose-600">{error}</div>}
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={confirmText !== "DELETE" || loading}
                className="flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-md bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {loading && <Loader2 className="animate-spin" size={16} />}
                Permanently delete account
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmText("");
                  setError("");
                }}
                disabled={loading}
                className="text-sm px-4 py-2 rounded-md border border-slate-300 hover:bg-slate-50"
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
