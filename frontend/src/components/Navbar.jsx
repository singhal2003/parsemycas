import { Link } from "react-router-dom";
import { LineChart } from "lucide-react";

export default function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-slate-900">
          <span className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center">
            <LineChart size={18} />
          </span>
          ParseMyCAS
        </Link>
        <nav>
          <Link
            to="/parse"
            className="text-sm px-3 py-1.5 rounded-md bg-brand-600 text-white hover:bg-brand-700"
          >
            Try it now
          </Link>
        </nav>
      </div>
    </header>
  );
}
