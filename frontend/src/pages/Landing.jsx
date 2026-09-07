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
    title: "Your data, your account",
    desc: "Sign in with your Nivesh Star account (email or Google) — your statements are only ever visible to you.",
  },
  {
    icon: PieChart,
    title: "Built-in analytics",
    desc: "AMC breakdown, asset allocation and full folio/scheme/transaction tables, generated automatically from every upload.",
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
        <div className="absolute inset-0 -z-10 bg-slate-950">
          <div className="absolute top-[-10rem] left-1/2 -translate-x-1/2 w-[42rem] h-[42rem] rounded-full bg-brand-600/20 blur-[120px]" />
          <div className="absolute top-10 right-[-6rem] w-[24rem] h-[24rem] rounded-full bg-cyan-500/10 blur-[100px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(2,6,23,1))]" />
        </div>
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-brand-300 bg-brand-500/10 border border-brand-500/20 rounded-full px-3 py-1 mb-6">
            NSDL &middot; CDSL &middot; CAMS &middot; KFintech supported
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight max-w-3xl mx-auto bg-gradient-to-br from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Turn your mutual fund CAS into clean, structured JSON
          </h1>
          <p className="mt-5 text-lg text-slate-400 max-w-2xl mx-auto">
            Upload one consolidated account statement and get back every folio, scheme and
            transaction as JSON — saved to your account so it's there whenever you come back.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              to="/login?mode=signup"
              className="inline-flex items-center gap-2 bg-gradient-to-br from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white font-medium rounded-lg px-6 py-3 shadow-lg shadow-brand-600/30 transition-all"
            >
              Parse my CAS <ArrowRight size={18} />
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Free to try. Sign up with email or Google.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-white text-center">
          Everything you need to understand your mutual fund portfolio
        </h2>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 hover:border-slate-700 hover:bg-slate-900 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center mb-4">
                <f.icon size={20} />
              </div>
              <h3 className="font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-900/40 border-y border-slate-800 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-white text-center">How it works</h2>
          <div className="mt-10 grid sm:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.n} className="text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white font-bold flex items-center justify-center shadow-lg shadow-brand-600/30">
                  {s.n}
                </div>
                <h3 className="mt-4 font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          See your whole mutual fund portfolio in one place
        </h2>
        <p className="mt-3 text-slate-400">Free account, takes less than a minute to set up.</p>
        <Link
          to="/login?mode=signup"
          className="mt-6 inline-flex items-center gap-2 bg-gradient-to-br from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white font-medium rounded-lg px-6 py-3 shadow-lg shadow-brand-600/30 transition-all"
        >
          Parse my CAS <ArrowRight size={18} />
        </Link>
      </section>
    </div>
  );
}
