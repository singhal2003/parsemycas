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
      onUploaded(data.statement);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to parse statement.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
          <X size={20} />
        </button>
        <h2 className="text-lg font-bold text-slate-900">Upload CAS statement</h2>
        <p className="text-sm text-slate-500 mt-1">
          Works with NSDL, CDSL, CAMS and KFintech consolidated account statements (PDF, max 5MB).
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-brand-400 transition-colors">
            <UploadCloud className="mx-auto text-slate-400" size={28} />
            <div className="text-sm text-slate-600 mt-2">
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
            <label className="text-sm font-medium text-slate-700">
              PDF password <span className="text-slate-400 font-normal">(if protected)</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="e.g. your PAN"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {error && <div className="text-sm text-rose-600">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg py-2.5 disabled:opacity-60"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : null}
            {loading ? "Parsing statement..." : "Upload & parse"}
          </button>
        </form>
      </div>
    </div>
  );
}
