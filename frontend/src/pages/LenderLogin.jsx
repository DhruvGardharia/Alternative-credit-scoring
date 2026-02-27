import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLenderAuth } from "../context/LenderAuthContext";
import { useTheme } from "../context/ThemeContext";
import LandingNavbar from "../components/LandingNavbar";

export default function LenderLogin() {
  const { lenderLogin } = useLenderAuth();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await lenderLogin(email, password);
      navigate("/lender-dashboard");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-gray-950" : "bg-gray-50"}`}>
      <LandingNavbar />

      <div className="flex items-center justify-center p-4 py-16">
        <div className={`rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full transition-colors duration-300 ${isDark ? "bg-gray-900 border border-gray-800" : "bg-white"}`}>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-9 h-9 text-blue-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
            <h1 className={`text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Lender Portal</h1>
            <p className={isDark ? "text-gray-400" : "text-gray-600"}>Sign in to manage loan applications</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="lender@organization.com"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition text-sm ${isDark ? "bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500" : "border-gray-200 text-gray-700"}`}
                required
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition text-sm ${isDark ? "bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500" : "border-gray-200 text-gray-700"}`}
                required
              />
            </div>

            {error && (
              <div className={`border px-4 py-3 rounded-xl text-sm ${isDark ? "bg-red-900/30 border-red-800 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all disabled:opacity-50 transform hover:scale-105"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-8 text-center space-y-4">
            <p className={isDark ? "text-gray-400" : "text-gray-600"}>
              Don't have an account?{" "}
              <Link to="/lender-register" className={`font-bold transition ${isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-900 hover:text-blue-700"}`}>
                Register as Lender
              </Link>
            </p>
            <Link to="/login" className={`text-sm block transition ${isDark ? "text-gray-500 hover:text-blue-400" : "text-gray-500 hover:text-gray-700"}`}>
              Back to Gig Worker Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
