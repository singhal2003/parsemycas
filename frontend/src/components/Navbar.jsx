import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LineChart } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-slate-900">
          <span className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center">
            <LineChart size={18} />
          </span>
          ParseMyCAS
        </Link>
        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
                Dashboard
              </Link>
              <Link to="/account" className="text-sm text-slate-600 hover:text-slate-900">
                Account
              </Link>
              <span className="text-sm text-slate-400 hidden sm:inline">{user.email}</span>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="text-sm px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-slate-600 hover:text-slate-900">
                Log in
              </Link>
              <Link
                to="/signup"
                className="text-sm px-3 py-1.5 rounded-md bg-brand-600 text-white hover:bg-brand-700"
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
