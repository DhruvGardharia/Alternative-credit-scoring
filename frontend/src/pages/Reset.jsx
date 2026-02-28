import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";
import LandingNavbar from "../components/LandingNavbar";
import { toast } from "react-toastify";

export default function Reset() {
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { isDark } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const token = localStorage.getItem("resetToken");

    if (!token) {
      toast.error("Session expired. Try again.");
      setLoading(false);
      return;
    }

    try {
      await axios.post(`/api/auth/reset-password/${token}`, {
        otp,
        password,
      });

      localStorage.removeItem("resetToken");
      alert("Password reset successful!");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-950" : "bg-gray-50"}`}>
      <LandingNavbar />

      <div className="flex items-center justify-center py-20 px-4">
        <div className={`p-10 rounded-3xl shadow-2xl w-full max-w-md ${isDark ? "bg-gray-900 border border-gray-800" : "bg-white"}`}>

          <h2 className={`text-2xl font-bold mb-6 text-center ${isDark ? "text-white" : "text-gray-900"}`}>
            Reset Password
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

            <input
              type="password"
              placeholder="Enter new password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 text-white py-3 rounded-xl font-bold"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}