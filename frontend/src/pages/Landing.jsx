import { Link } from "react-router-dom";
import {
  UploadCloud,
  PieChart,
  ShieldCheck,
  Wallet,
  FileText,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: UploadCloud,
    title: "One statement, every fund house",
    desc: "Upload your NSDL, CDSL, CAMS or KFintech consolidated account statement — no manual entry, no format detection needed.",
  },
  {
    icon: FileText,
    title: "Every folio, scheme and transaction",
    desc: "The parsed JSON includes each folio, scheme, unit balance, NAV and transaction from the statement, structured and ready to use.",
  },
  {
    icon: Wallet,
    title: "Copy, download, or plug in",
    desc: "View the parsed result right on the page, copy it, or download the JSON file to use elsewhere.",
  },
  {
    icon: ShieldCheck,
    title: "Nothing stored",
    desc: "Your account is protected with verified email or Google sign-in, and your statements are only ever visible to you.",
  },
  {
    icon: PieChart,
    title: "Analytics, coming next",
    desc: "Asset allocation, XIRR and a full portfolio dashboard are the next step, built on top of this parsing layer.",
  },
];

const steps = [
  { n: "1", title: "Sign up", desc: "Create a free account with email or Google, in a few seconds." },
  { n: "2", title: "Upload your CAS", desc: "Drop in your NSDL/CDSL/CAMS/KFintech PDF (password-protected is fine)." },
  { n: "3", title: "It's saved for you", desc: "View, copy or download the parsed JSON any time — it stays in your account." },
];

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50 to-white -z-10" />
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-brand-700 bg-brand-100 rounded-full px-3 py-1 mb-6">
            NSDL &middot; CDSL &middot; CAMS &middot; KFintech supported
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 max-w-3xl mx-auto">
            Turn your mutual fund CAS into clean, structured JSON
          </h1>
          <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto">
            Upload one consolidated account statement and get back every folio, scheme and
            transaction as JSON — saved to your account so it's there whenever you come back.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg px-6 py-3"
            >
              Parse my CAS <ArrowRight size={18} />
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Free to try. Sign up with email or Google.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-slate-900 text-center">
          Everything you need to understand your mutual fund portfolio
        </h2>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <f.icon size={20} />
              </div>
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 border-y border-slate-200 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-slate-900 text-center">How it works</h2>
          <div className="mt-10 grid sm:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.n} className="text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-brand-600 text-white font-bold flex items-center justify-center">
                  {s.n}
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
          See your whole mutual fund portfolio in one place
        </h2>
        <p className="mt-3 text-slate-600">Free account, takes less than a minute to set up.</p>
        <Link
          to="/signup"
          className="mt-6 inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg px-6 py-3"
        >
          Parse my CAS <ArrowRight size={18} />
        </Link>
      </section>
    </div>
  );
}
