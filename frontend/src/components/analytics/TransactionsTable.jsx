import { useState } from "react";
import { formatCurrency, formatNumber } from "../../lib/casAnalytics";

const PAGE_SIZE = 15;

export default function TransactionsTable({ transactions }) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  if (!transactions || transactions.length === 0) {
    return <div className="text-sm text-slate-400">No transactions found in this statement.</div>;
  }

  const shown = transactions.slice(0, visible);

  return (
    <div>
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-200">
              <th className="py-2 pr-4 font-medium">Date</th>
              <th className="py-2 pr-4 font-medium">Scheme</th>
              <th className="py-2 pr-4 font-medium">Type</th>
              <th className="py-2 pr-4 font-medium text-right">Units</th>
              <th className="py-2 pr-4 font-medium text-right">NAV</th>
              <th className="py-2 pr-4 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((t, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-2 pr-4 text-slate-600 whitespace-nowrap">{t.date || "—"}</td>
                <td className="py-2 pr-4 text-slate-800">{t.schemeName || "—"}</td>
                <td className="py-2 pr-4">
                  <span className="text-xs font-medium text-slate-600 bg-slate-100 rounded-full px-2 py-0.5">
                    {t.type || "—"}
                  </span>
                </td>
                <td className={`py-2 pr-4 text-right ${t.units < 0 ? "text-rose-600" : "text-slate-700"}`}>
                  {formatNumber(t.units)}
                </td>
                <td className="py-2 pr-4 text-right text-slate-700">{t.nav === null ? "—" : formatCurrency(t.nav)}</td>
                <td className={`py-2 pr-4 text-right ${t.amount < 0 ? "text-rose-600" : "text-slate-700"}`}>
                  {t.amount === null ? "—" : formatCurrency(t.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {visible < transactions.length && (
        <button
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
          className="mt-3 text-sm text-brand-600 hover:underline"
        >
          Show more ({transactions.length - visible} remaining)
        </button>
      )}
    </div>
  );
}
