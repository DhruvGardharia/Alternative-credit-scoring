import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";
import LandingNavbar from "../components/LandingNavbar";
import { useAuth } from "../context/AuthContext";

export default function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { loginWithToken } = useAuth();

  const navigate = useNavigate();
  const { isDark } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const token = localStorage.getItem("registerToken");
    if (!token) {
      setError("Session expired. Please register again.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(`/api/auth/verify-otp/${token}`, { otp });

      localStorage.removeItem("registerToken");

      // ✅ This updates AuthContext so DashboardRoute sees the user immediately
      await loginWithToken(res.data.token, res.data.user);

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-950" : "bg-gray-50"}`}>
      <LandingNavbar />
      <div className="flex items-center justify-center py-20 px-4">
        <div className={`p-10 rounded-3xl shadow-2xl w-full max-w-md ${isDark ? "bg-gray-900 border border-gray-800" : "bg-white"}`}>
          <h2 className="text-2xl font-bold text-center mb-6">
            Verify Email OTP
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl"
            />

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 text-white py-3 rounded-xl font-bold"
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}