import { colorFor } from "./colors";

/**
 * Horizontal bar breakdown — e.g. AMC-wise or asset-type-wise value split.
 * data: [{ label, value, sub }]
 */
export default function BarList({ data, formatValue = (v) => v }) {
  const items = (data || []).filter((d) => (d.value ?? 0) > 0);
  const max = Math.max(...items.map((d) => d.value), 0);

  if (items.length === 0) {
    return <div className="text-sm text-slate-500">No data to show.</div>;
  }

  return (
    <div className="space-y-3">
      {items
        .slice()
        .sort((a, b) => b.value - a.value)
        .map((d, i) => (
          <div key={d.label + i}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-slate-200 font-medium truncate">{d.label}</span>
              <span className="text-slate-400 flex-shrink-0 ml-2">
                {formatValue(d.value)}
                {d.sub ? <span className="text-slate-500"> · {d.sub}</span> : null}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${max ? (d.value / max) * 100 : 0}%`, background: colorFor(i) }}
              />
            </div>
          </div>
        ))}
    </div>
  );
}
