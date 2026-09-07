import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LineChart } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-white">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center shadow-lg shadow-brand-600/30">
            <LineChart size={18} />
          </span>
          ParseMyCAS
        </Link>
        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">
                Dashboard
              </Link>
              <Link to="/account" className="text-sm text-slate-400 hover:text-white transition-colors">
                Account
              </Link>
              <span className="text-sm text-slate-500 hidden sm:inline">{user.email}</span>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="text-sm px-3 py-1.5 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-slate-400 hover:text-white transition-colors">
                Log in
              </Link>
              <Link
                to="/login?mode=signup"
                className="text-sm px-3 py-1.5 rounded-md bg-gradient-to-br from-brand-500 to-brand-600 text-white hover:from-brand-400 hover:to-brand-500 shadow-lg shadow-brand-600/20 transition-all"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
