const FIELDS = [
  ["name", "Name"],
  ["pan", "PAN"],
  ["email", "Email"],
  ["mobile", "Mobile"],
  ["address", "Address"],
  ["pincode", "Pincode"],
];

/** Shows only the fields the parsed statement actually has — CAMS/KFintech and
 *  NSDL/CDSL don't expose the same set (e.g. NSDL/CDSL responses don't carry mobile/address). */
export default function PersonalDetails({ investor, period, casType }) {
  const present = FIELDS.filter(([key]) => investor?.[key]);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-semibold text-white">Personal details</h2>
        <div className="flex items-center gap-2 text-xs">
          {casType && (
            <span className="font-medium text-brand-300 bg-brand-500/10 border border-brand-500/20 rounded-full px-2.5 py-1">{casType}</span>
          )}
          {investor?.isJointHolding && (
            <span className="font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-1">Joint holding</span>
          )}
        </div>
      </div>

      {present.length === 0 ? (
        <p className="text-sm text-slate-500 mt-3">No personal details were extracted from this statement.</p>
      ) : (
        <dl className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-3">
          {present.map(([key, label]) => (
            <div key={key}>
              <dt className="text-xs text-slate-500">{label}</dt>
              <dd className="text-sm text-slate-200 mt-0.5 break-words">{investor[key]}</dd>
            </div>
          ))}
        </dl>
      )}

      {(period?.from || period?.to) && (
        <div className="mt-4 pt-4 border-t border-slate-800 text-sm text-slate-400">
          Statement period: <span className="text-slate-200 font-medium">{period.from || "?"}</span> →{" "}
          <span className="text-slate-200 font-medium">{period.to || "?"}</span>
        </div>
      )}
    </div>
  );
}
