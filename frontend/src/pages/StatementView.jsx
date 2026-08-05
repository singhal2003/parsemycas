import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../lib/api";
import { isCamsKfintechShape } from "../lib/casAnalytics";
import CamsKfintechAnalytics from "../components/analytics/CamsKfintechAnalytics";
import NsdlCdslAnalytics from "../components/analytics/NsdlCdslAnalytics";
import { ArrowLeft, Download, Loader2 } from "lucide-react";

export default function StatementView() {
  const { id } = useParams();
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("analytics");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get(`/statements/${id}`)
      .then(({ data }) => {
        if (!cancelled) setStatement(data.statement);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || "Could not load this statement.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await api.get(`/statements/${id}/raw`, { responseType: "blob" });
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = statement.file_name.replace(/\.pdf$/i, "") + ".json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16 flex justify-center text-slate-400">
        <Loader2 className="animate-spin" size={22} />
      </div>
    );
  }

  if (error || !statement) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16 text-center">
        <p className="text-rose-600">{error || "Statement not found."}</p>
        <Link to="/dashboard" className="text-brand-600 hover:underline text-sm mt-3 inline-block">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const raw = statement.raw_data;
  const isCams = isCamsKfintechShape(raw);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> Back to dashboard
      </Link>

      <div className="mt-4 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 truncate max-w-lg" title={statement.file_name}>
            {statement.file_name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {statement.investor_name || "Unknown investor"} · {statement.total_folios ?? "-"} folios ·{" "}
            {statement.total_schemes ?? "-"} schemes
          </p>
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 border border-brand-200 hover:bg-brand-50 rounded-lg px-4 py-2 disabled:opacity-60"
        >
          {downloading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
          {downloading ? "Preparing download..." : "Download JSON"}
        </button>
      </div>

      <div className="mt-6 border-b border-slate-200 flex gap-6">
        {[
          { key: "analytics", label: "Analytics" },
          { key: "json", label: "Raw JSON" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-3 text-sm font-medium border-b-2 -mb-px ${
              tab === t.key ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "analytics" ? (
          isCams ? (
            <CamsKfintechAnalytics raw={raw} />
          ) : (
            <NsdlCdslAnalytics raw={raw} />
          )
        ) : (
          <pre className="bg-slate-900 text-slate-100 text-xs rounded-xl p-4 overflow-auto max-h-[75vh]">
            {JSON.stringify(raw, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
