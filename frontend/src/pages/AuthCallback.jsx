import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthCallback() {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setError("Missing sign-in token.");
      return;
    }
    loginWithToken(token)
      .then(() => navigate("/dashboard"))
      .catch(() => setError("Could not complete sign-in. Please try again."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 text-center">
      {error ? (
        <p className="text-rose-600 text-sm">{error}</p>
      ) : (
        <p className="text-slate-500 text-sm">Signing you in...</p>
      )}
    </div>
  );
}
