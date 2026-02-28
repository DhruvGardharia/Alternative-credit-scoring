import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";
import LandingNavbar from "../components/LandingNavbar";
import { toast } from "react-toastify"

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post("/api/auth/forgot-password", { email });

      // Save reset token temporarily
      localStorage.setItem("resetToken", res.data.token);

      navigate("/reset");
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
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
            Forgot Password
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="email"
              placeholder="Enter your registered email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl"
            />
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 text-white py-3 rounded-xl font-bold"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}