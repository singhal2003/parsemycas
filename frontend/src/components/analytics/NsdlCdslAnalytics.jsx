import { useState } from "react";
import { normalizeNsdlCdsl, formatCurrency, formatNumber } from "../../lib/casAnalytics";
import PersonalDetails from "./PersonalDetails";
import SummaryCard from "./SummaryCard";
import Section from "./Section";
import Tabs from "./Tabs";
import DonutChart from "./DonutChart";
import BarList from "./BarList";
import SchemeTable from "./SchemeTable";
import TransactionsTable from "./TransactionsTable";

export default function NsdlCdslAnalytics({ raw }) {
  const data = normalizeNsdlCdsl(raw);
  const {
    investor,
    period,
    casType,
    totals,
    accounts,
    assetBreakdown,
    amcBreakdown,
    flatSchemes,
    flatTransactions,
    flatDematHoldings,
  } = data;

  const hasMf = flatSchemes.length > 0;
  const hasDemat = accounts.length > 0;

  const tabs = [
    { key: "overview", label: "Overview" },
    ...(hasDemat ? [{ key: "demat", label: `Demat accounts (${accounts.length})` }] : []),
    ...(hasMf ? [{ key: "schemes", label: `MF schemes (${flatSchemes.length})` }] : []),
    ...(flatTransactions.length > 0 ? [{ key: "transactions", label: `Transactions (${flatTransactions.length})` }] : []),
  ];
  const [tab, setTab] = useState("overview");

  const portfolioSplit = [
    { label: "Demat holdings", value: totals.dematValue ?? 0 },
    { label: "Mutual fund folios", value: totals.mfValue ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <PersonalDetails investor={investor} period={period} casType={casType || "NSDL / CDSL"} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard label="Demat accounts" value={totals.accounts} />
        <SummaryCard label="MF folios" value={totals.folios} />
        <SummaryCard label="Schemes" value={totals.schemes} />
        <SummaryCard
          label="Total value"
          value={totals.value === null ? "Not available" : formatCurrency(totals.value)}
        />
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === "overview" && (
        <>
          {(totals.dematValue || totals.mfValue) && (
            <Section title="Portfolio split" subtitle="Demat holdings vs. mutual fund folios, by value">
              <DonutChart data={portfolioSplit} formatValue={formatCurrency} />
            </Section>
          )}
          {assetBreakdown.length > 0 && (
            <Section title="Asset allocation" subtitle="Demat holdings by asset class">
              <DonutChart data={assetBreakdown} formatValue={formatCurrency} />
            </Section>
          )}
          {amcBreakdown.length > 0 && (
            <Section title="AMC-wise breakdown" subtitle="Mutual fund folios by fund house">
              <BarList
                data={amcBreakdown.map((a) => ({
                  label: a.label,
                  value: a.hasValue ? a.value : a.cost,
                  sub: `${a.schemeCount} scheme${a.schemeCount === 1 ? "" : "s"}${a.hasValue ? "" : " · by cost"}`,
                }))}
                formatValue={formatCurrency}
              />
            </Section>
          )}
          {!hasDemat && !hasMf && (
            <Section title="No holdings found">
              <p className="text-sm text-slate-400">
                This statement didn't contain any demat holdings or mutual fund folios.
              </p>
            </Section>
          )}
        </>
      )}

      {tab === "demat" && (
        <>
          <Section title="Demat accounts">
            <div className="space-y-4">
              {accounts.map((acc, i) => (
                <div key={i} className="border border-slate-100 rounded-lg p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-xs font-medium text-brand-700 bg-brand-50 rounded-full px-2 py-0.5 uppercase">
                        {acc.demat_type || "Demat"}
                      </span>
                      <span className="ml-2 text-sm font-medium text-slate-800">{acc.dp_name || "—"}</span>
                    </div>
                    <div className="text-sm text-slate-600">{formatCurrency(acc.value ?? acc.total_value)}</div>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    DP ID: {acc.dp_id || "—"} · Client ID: {acc.client_id || "—"} · BO ID: {acc.bo_id || "—"}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {flatDematHoldings.length > 0 && (
            <Section title="Demat holdings">
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="text-left text-xs text-slate-400 border-b border-slate-200">
                      <th className="py-2 pr-4 font-medium">Security</th>
                      <th className="py-2 pr-4 font-medium">Type</th>
                      <th className="py-2 pr-4 font-medium text-right">Quantity</th>
                      <th className="py-2 pr-4 font-medium text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flatDematHoldings.map((h, i) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2 pr-4">
                          <div className="font-medium text-slate-800">{h.name}</div>
                          {h.isin && <div className="text-xs text-slate-400">{h.isin}</div>}
                        </td>
                        <td className="py-2 pr-4 text-slate-600">{h.bucket}</td>
                        <td className="py-2 pr-4 text-right text-slate-700">{formatNumber(h.quantity)}</td>
                        <td className="py-2 pr-4 text-right text-slate-700">
                          {h.value === null ? "—" : formatCurrency(h.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}
        </>
      )}

      {tab === "schemes" && (
        <Section title="Mutual fund schemes">
          <SchemeTable schemes={flatSchemes} />
        </Section>
      )}

      {tab === "transactions" && (
        <Section title="Transactions" subtitle={`${flatTransactions.length} transaction${flatTransactions.length === 1 ? "" : "s"}`}>
          <TransactionsTable transactions={flatTransactions} />
        </Section>
      )}
    </div>
  );
}
