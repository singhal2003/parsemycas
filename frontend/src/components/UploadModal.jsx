import { useState } from "react";
import api from "../lib/api";
import { X, UploadCloud, Loader2 } from "lucide-react";

export default function UploadModal({ onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError("Please choose a CAS statement PDF.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      if (password) form.append("password", password);
      const { data } = await api.post("/statements/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUploaded(data.statement, { duplicate: Boolean(data.duplicate) });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to parse statement.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 relative shadow-2xl shadow-black/50">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-200 transition-colors">
          <X size={20} />
        </button>
        <h2 className="text-lg font-bold text-white">Upload CAS statement</h2>
        <p className="text-sm text-slate-400 mt-1">
          Works with NSDL, CDSL, CAMS and KFintech consolidated account statements (PDF, max 5MB).
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block border-2 border-dashed border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-brand-500 hover:bg-slate-800/30 transition-colors">
            <UploadCloud className="mx-auto text-slate-500" size={28} />
            <div className="text-sm text-slate-300 mt-2">
              {file ? file.name : "Click to choose your CAS PDF"}
            </div>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </label>

          <div>
            <label className="text-sm font-medium text-slate-300">
              PDF password <span className="text-slate-500 font-normal">(if protected)</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="e.g. your PAN"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          {error && (
            <div className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white font-medium rounded-lg py-2.5 shadow-lg shadow-brand-600/20 disabled:opacity-60 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : null}
            {loading ? "Parsing statement..." : "Upload & parse"}
          </button>
        </form>
      </div>
    </div>
  );
}
