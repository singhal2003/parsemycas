import { useEffect, useState } from "react";
import api from "../lib/api";
import UploadModal from "../components/UploadModal";
import { useAuth } from "../context/AuthContext";
import { Plus, FileText, Trash2, Download } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  async function fetchStatements() {
    setLoading(true);
    try {
      const { data } = await api.get("/statements");
      setStatements(data.statements);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatements();
  }, []);

  async function handleDelete(id) {
    if (!confirm("Delete this statement? This cannot be undone.")) return;
    await api.delete(`/statements/${id}`);
    setStatements((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleDownloadJson(id, fileName) {
    const res = await api.get(`/statements/${id}/raw`, { responseType: "blob" });
    const url = window.URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.replace(/\.pdf$/i, "") + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hi {user?.name?.split(" ")[0]},</h1>
          <p className="text-slate-500 text-sm mt-1">Your uploaded CAS statements, saved to your account.</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg px-4 py-2.5"
        >
          <Plus size={18} /> Upload CAS
        </button>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="text-slate-400 text-sm">Loading...</div>
        ) : statements.length === 0 ? (
          <div className="border border-dashed border-slate-300 rounded-xl p-12 text-center">
            <FileText className="mx-auto text-slate-300" size={36} />
            <p className="mt-3 text-slate-600 font-medium">No statements yet</p>
            <p className="text-sm text-slate-400 mt-1">
              Upload your NSDL, CDSL, CAMS or KFintech CAS to get started.
            </p>
            <button
              onClick={() => setShowUpload(true)}
              className="mt-5 inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg px-4 py-2.5"
            >
              <Plus size={18} /> Upload your first statement
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {statements.map((s) => (
              <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium text-brand-700 bg-brand-50 rounded-full px-2.5 py-1">
                    {s.cas_type || "CAS"}
                  </div>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="text-slate-300 hover:text-rose-500"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-3 font-semibold text-slate-900 truncate" title={s.file_name}>
                  {s.file_name}
                </div>
                <div className="text-sm text-slate-500 mt-1">
                  {s.investor_name || "Unknown investor"}
                </div>
                <div className="text-sm text-slate-500 mt-1">
                  {s.total_folios ?? "-"} folios &middot; {s.total_schemes ?? "-"} schemes
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  {s.statement_period_from} → {s.statement_period_to}
                </div>
                <button
                  onClick={() => handleDownloadJson(s.id, s.file_name)}
                  className="mt-4 inline-flex items-center justify-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 border border-brand-200 hover:bg-brand-50 rounded-lg py-2"
                >
                  <Download size={14} /> Download JSON
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={() => {
            setShowUpload(false);
            fetchStatements();
          }}
        />
      )}
    </div>
  );
}
