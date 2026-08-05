import { useState } from "react";
import { normalizeCamsKfintech, formatCurrency } from "../../lib/casAnalytics";
import PersonalDetails from "./PersonalDetails";
import SummaryCard from "./SummaryCard";
import Section from "./Section";
import Tabs from "./Tabs";
import BarList from "./BarList";
import SchemeTable from "./SchemeTable";
import TransactionsTable from "./TransactionsTable";

export default function CamsKfintechAnalytics({ raw }) {
  const data = normalizeCamsKfintech(raw);
  const { investor, period, totals, amcBreakdown, flatSchemes, flatTransactions, lifecycleEvents, folios } = data;

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "folios", label: `Folios (${folios.length})` },
    { key: "schemes", label: `Schemes (${flatSchemes.length})` },
    { key: "transactions", label: `Transactions (${flatTransactions.length})` },
    ...(lifecycleEvents.length > 0 ? [{ key: "lifecycle", label: "Lifecycle events" }] : []),
  ];
  const [tab, setTab] = useState("overview");

  return (
    <div className="space-y-6">
      <PersonalDetails investor={investor} period={period} casType="CAMS / KFintech" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard label="Folios" value={totals.folios} />
        <SummaryCard label="Schemes" value={totals.schemes} />
        <SummaryCard label="Total invested (cost)" value={formatCurrency(totals.cost)} />
        <SummaryCard
          label="Current value"
          value={totals.value === null ? "Not available" : formatCurrency(totals.value)}
          sub={totals.value === null ? "Statement doesn't include NAV for every scheme" : undefined}
        />
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === "overview" && (
        <Section title="AMC-wise breakdown" subtitle="Invested amount by fund house">
          {amcBreakdown.length > 0 ? (
            <BarList
              data={amcBreakdown.map((a) => ({
                label: a.label,
                value: a.hasValue ? a.value : a.cost,
                sub: `${a.schemeCount} scheme${a.schemeCount === 1 ? "" : "s"}${a.hasValue ? "" : " · by cost"}`,
              }))}
              formatValue={formatCurrency}
            />
          ) : (
            <p className="text-sm text-slate-400">No AMC data to show.</p>
          )}
        </Section>
      )}

      {tab === "folios" && (
        <Section title="Folios" subtitle={`${folios.length} folio${folios.length === 1 ? "" : "s"} across all AMCs`}>
          <div className="space-y-3">
            {folios.map((f, i) => (
              <div key={i} className="border border-slate-100 rounded-lg p-3 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="font-medium text-slate-800 text-sm">{f.amc || "Unknown AMC"}</div>
                  <div className="text-xs text-slate-400">Folio {f.folio_number}</div>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-3">
                  <span>{(f.schemes || []).length} scheme{(f.schemes || []).length === 1 ? "" : "s"}</span>
                  {f.additional_info?.kyc && (
                    <span className="bg-slate-100 rounded-full px-2 py-0.5">KYC: {f.additional_info.kyc}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {tab === "schemes" && (
        <Section title="Schemes">
          <SchemeTable schemes={flatSchemes} />
        </Section>
      )}

      {tab === "transactions" && (
        <Section title="Transactions" subtitle={`${flatTransactions.length} transaction${flatTransactions.length === 1 ? "" : "s"}`}>
          <TransactionsTable transactions={flatTransactions} />
        </Section>
      )}

      {tab === "lifecycle" && (
        <Section title="Lifecycle events">
          <ul className="space-y-2">
            {lifecycleEvents.map((e, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="text-xs text-slate-400 w-24 flex-shrink-0">{e.date || "—"}</span>
                <span className="text-slate-700">{e.description}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
