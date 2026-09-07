// Fixed palette so charts get stable, distinguishable colors without a charting library.
export const PALETTE = [
  "#3d6ef5", // brand-500
  "#22c55e", // green-500
  "#f59e0b", // amber-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#a855f7", // purple-500
  "#ef4444", // red-500
  "#84cc16", // lime-500
  "#64748b", // slate-500
  "#0ea5e9", // sky-500
];

export function colorFor(index) {
  return PALETTE[index % PALETTE.length];
}
