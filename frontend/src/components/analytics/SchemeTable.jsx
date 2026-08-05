import { useState } from "react";
import { formatCurrency, formatNumber } from "../../lib/casAnalytics";

export default function SchemeTable({ schemes }) {
  const [query, setQuery] = useState("");

  if (!schemes || schemes.length === 0) {
    return <div className="text-sm text-slate-400">No mutual fund schemes found in this statement.</div>;
  }

  const filtered = query
    ? schemes.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.amc.toLowerCase().includes(query.toLowerCase()) ||
          s.folioNumber.toLowerCase().includes(query.toLowerCase())
      )
    : schemes;

  const anyValue = schemes.some((s) => s.value !== null);
  const someMissingValue = schemes.some((s) => s.value === null);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by scheme, AMC or folio..."
        className="mb-3 w-full sm:w-72 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-200">
              <th className="py-2 pr-4 font-medium">Scheme</th>
              <th className="py-2 pr-4 font-medium">AMC</th>
              <th className="py-2 pr-4 font-medium">Folio</th>
              <th className="py-2 pr-4 font-medium text-right">Units</th>
              <th className="py-2 pr-4 font-medium text-right">Cost</th>
              {anyValue && <th className="py-2 pr-4 font-medium text-right">Value</th>}
              {anyValue && <th className="py-2 pr-4 font-medium text-right">Gain</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-2 pr-4">
                  <div className="font-medium text-slate-800">{s.name}</div>
                  {s.isin && <div className="text-xs text-slate-400">{s.isin}</div>}
                </td>
                <td className="py-2 pr-4 text-slate-600">{s.amc || "—"}</td>
                <td className="py-2 pr-4 text-slate-600">{s.folioNumber || "—"}</td>
                <td className="py-2 pr-4 text-right text-slate-700">{formatNumber(s.units)}</td>
                <td className="py-2 pr-4 text-right text-slate-700">{formatCurrency(s.cost)}</td>
                {anyValue && <td className="py-2 pr-4 text-right text-slate-700">{formatCurrency(s.value)}</td>}
                {anyValue && (
                  <td
                    className={`py-2 pr-4 text-right ${
                      s.gainAbsolute > 0 ? "text-emerald-600" : s.gainAbsolute < 0 ? "text-rose-600" : "text-slate-400"
                    }`}
                  >
                    {s.gainAbsolute === null ? "—" : formatCurrency(s.gainAbsolute)}
                    {s.gainPercentage !== null && (
                      <span className="text-xs ml-1">({s.gainPercentage.toFixed(1)}%)</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {someMissingValue && (
        <p className="text-xs text-slate-400 mt-3">
          {anyValue
            ? "Rows showing — for Value/Gain don't have a current NAV in this statement (only cost and unit balances were extracted for them)."
            : "This statement doesn't include current NAV/market value for these schemes — only cost and unit balances were extracted from the PDF."}
        </p>
      )}
    </div>
  );
}
