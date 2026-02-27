import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import LandingNavbar from "../components/LandingNavbar";

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(formData.email, formData.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
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
              <svg className="w-9 h-9 text-blue-900" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
              </svg>
            </div>
            <h1 className={`text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>{t("loginWelcomeTitle")}</h1>
            <p className={isDark ? "text-gray-400" : "text-gray-600"}>{t("loginWelcomeSubtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                {t("loginEmailLabel")}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition text-sm ${isDark ? "bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500" : "border-gray-200 text-gray-700"}`}
                placeholder={t("loginEmailPlaceholder")}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                {t("loginPasswordLabel")}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition text-sm ${isDark ? "bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500" : "border-gray-200 text-gray-700"}`}
                placeholder="••••••••"
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
                  {t("loginLoading")}
                </span>
              ) : (
                t("loginButton")
              )}
            </button>
          </form>

          <div className="mt-8 text-center space-y-4">
            <p className={isDark ? "text-gray-400" : "text-gray-600"}>
              {t("loginNoAccount")}{" "}
              <Link to="/register" className={`font-bold transition ${isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-900 hover:text-blue-700"}`}>
                {t("loginSignUpLink")}
              </Link>
            </p>
            <Link to="/" className={`text-sm block transition ${isDark ? "text-gray-500 hover:text-blue-400" : "text-gray-500 hover:text-gray-700"}`}>
              {t("loginBackHome")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
