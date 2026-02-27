import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLenderAuth } from "../context/LenderAuthContext";

export default function LenderRegister() {
  const { lenderRegister } = useLenderAuth();
  const navigate = useNavigate();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-500 rounded-full filter blur-[120px]" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-500 rounded-full filter blur-[120px]" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/30 mb-4">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Register as Lender</h1>
          <p className="text-gray-400">Create your lending institution account</p>
        </div>

        {/* Register Card */}
        <div className="bg-gray-800/50 backdrop-blur-2xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={handleChange("name")}
                  placeholder="Your full name"
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  placeholder="lender@org.com"
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Organization Name</label>
              <input
                type="text"
                value={form.organization}
                onChange={handleChange("organization")}
                placeholder="e.g. QuickFin Capital"
                className="w-full px-4 py-3 bg-gray-900/60 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">License Number <span className="text-gray-500">(optional)</span></label>
                <input
                  type="text"
                  value={form.licenseNumber}
                  onChange={handleChange("licenseNumber")}
                  placeholder="e.g. NBFC-12345"
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone <span className="text-gray-500">(optional)</span></label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={handleChange("phone")}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={handleChange("password")}
                  placeholder="Min 6 characters"
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange("confirmPassword")}
                  placeholder="Re-enter password"
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                "Create Lender Account"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{" "}
              <Link to="/lender-login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition">
                Sign In
              </Link>
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-700/50 text-center">
            <Link to="/login" className="text-gray-500 hover:text-gray-400 text-xs transition">
              ← Back to Gig Worker Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
