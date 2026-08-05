import { colorFor } from "./colors";

/**
 * Simple dependency-free SVG donut chart.
 * data: [{ label, value }]
 */
export default function DonutChart({ data, size = 160, thickness = 26, formatValue }) {
  const items = (data || []).filter((d) => (d.value ?? 0) > 0);
  const total = items.reduce((sum, d) => sum + d.value, 0);

  if (items.length === 0 || total <= 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-full"
        style={{ width: size, height: size }}
      >
        No data
      </div>
    );
  }

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <div className="flex items-center gap-5 flex-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={thickness} />
          {items.map((d, i) => {
            const fraction = d.value / total;
            const dash = fraction * circumference;
            const offset = -cumulative;
            cumulative += dash;
            return (
              <circle
                key={d.label + i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={colorFor(i)}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={offset}
              />
            );
          })}
        </g>
      </svg>
      <ul className="text-sm space-y-1.5">
        {items.map((d, i) => (
          <li key={d.label + i} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: colorFor(i) }} />
            <span className="text-slate-600">{d.label}</span>
            <span className="text-slate-400">
              {formatValue ? formatValue(d.value) : d.value} · {((d.value / total) * 100).toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
