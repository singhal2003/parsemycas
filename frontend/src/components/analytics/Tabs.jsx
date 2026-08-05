export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="border-b border-slate-200 flex gap-6 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`pb-3 pt-1 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${
            active === t.key
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
