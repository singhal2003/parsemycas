import { useState } from "react";
import api from "../lib/api";
import { UploadCloud, Loader2, Download, Copy, Check, AlertTriangle } from "lucide-react";

export default function ParseTool() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null); // full parsed JSON from the API
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError("Please choose a CAS statement PDF.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      if (password) form.append("password", password);
      const { data } = await api.post("/cas/parse", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.success === false) {
        setError(data.message || "Could not parse the CAS statement.");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong while parsing the statement.");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (file?.name || "cas").replace(/\.pdf$/i, "") + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center max-w-xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Parse your CAS statement</h1>
        <p className="mt-2 text-slate-500">
          Upload an NSDL, CDSL, CAMS or KFintech statement and get the parsed data back as JSON. No
          account needed — nothing is stored, this just calls the parsing API and hands you the result.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <label className="block border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-brand-400 transition-colors">
          <UploadCloud className="mx-auto text-slate-400" size={30} />
          <div className="text-sm text-slate-600 mt-2">
            {file ? file.name : "Click to choose your CAS PDF"}
          </div>
          <div className="text-xs text-slate-400 mt-1">Max 5 MB</div>
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files[0] || null)}
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

        {error && (
          <div className="flex items-start gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg py-2.5 disabled:opacity-60"
        >
          {loading && <Loader2 className="animate-spin" size={18} />}
          {loading ? "Parsing statement..." : "Parse statement"}
        </button>
      </form>

      {result && (
        <div className="mt-6 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
            <span className="text-sm font-medium text-slate-700">Parsed result</span>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-white rounded-md px-2.5 py-1.5"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 border border-brand-200 hover:bg-brand-50 rounded-md px-2.5 py-1.5"
              >
                <Download size={13} /> Download JSON
              </button>
            </div>
          </div>
          <pre className="text-xs text-slate-700 p-4 overflow-auto max-h-[600px] whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
