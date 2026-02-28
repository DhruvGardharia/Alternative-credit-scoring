import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLenderAuth } from "../context/LenderAuthContext";
import { useTheme } from "../context/ThemeContext";
import LandingNavbar from "../components/LandingNavbar";

export default function LenderRegister() {
  const { lenderRegister } = useLenderAuth();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    organization: "",
    licenseNumber: "",
    phone: ""
  });

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await lenderRegister({
        name: form.name,
        email: form.email,
        password: form.password,
        organization: form.organization,
        licenseNumber: form.licenseNumber,
        phone: form.phone
      });
      navigate("/lender-dashboard");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition text-sm ${
    isDark
      ? "bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500"
      : "border-gray-200 text-gray-700"
  }`;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-gray-950" : "bg-gray-50"}`}>
      <LandingNavbar />

      <div className="flex items-center justify-center p-4 py-12">
        <div className={`rounded-3xl shadow-2xl p-8 md:p-12 max-w-lg w-full transition-colors duration-300 ${isDark ? "bg-gray-900 border border-gray-800" : "bg-white"}`}>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-9 h-9 text-blue-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
            <h1 className={`text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Register as Lender</h1>
            <p className={isDark ? "text-gray-400" : "text-gray-600"}>Create your lending institution account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={handleChange("name")}
                  placeholder="Your full name"
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  placeholder="lender@org.com"
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Organization Name</label>
              <input
                type="text"
                value={form.organization}
                onChange={handleChange("organization")}
                placeholder="e.g. QuickFin Capital"
                className={inputClass}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>License Number <span className={isDark ? "text-gray-500" : "text-gray-400"}>(optional)</span></label>
                <input
                  type="text"
                  value={form.licenseNumber}
                  onChange={handleChange("licenseNumber")}
                  placeholder="e.g. NBFC-12345"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Phone <span className={isDark ? "text-gray-500" : "text-gray-400"}>(optional)</span></label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={handleChange("phone")}
                  placeholder="+91 98765 43210"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={handleChange("password")}
                  placeholder="Min 6 characters"
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Confirm Password</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange("confirmPassword")}
                  placeholder="Re-enter password"
                  className={inputClass}
                  required
                />
              </div>
            </div>

            {error && (
              <div className={`border px-4 py-3 rounded-xl text-sm ${isDark ? "bg-red-900/30 border-red-800 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all disabled:opacity-50 transform hover:scale-105 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                "Create Lender Account"
              )}
            </button>
          </form>

          <div className="mt-8 text-center space-y-4">
            <p className={isDark ? "text-gray-400" : "text-gray-600"}>
              Already have an account?{" "}
              <Link to="/lender-login" className={`font-bold transition ${isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-900 hover:text-blue-700"}`}>
                Sign In
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
