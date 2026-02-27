import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { PLATFORM_CONFIG } from "../config/platformConfig";
import { toast } from "react-toastify";
import axios from "axios";
import Navbar from "../components/Navbar";

export default function PlatformManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [connectedPlatforms, setConnectedPlatforms] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addLoading, setAddLoading] = useState(false);

  // Form state for adding platform
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [platformId, setPlatformId] = useState("");
  const [workType, setWorkType] = useState("FULL_TIME");

  const platforms = PLATFORM_CONFIG[user?.employmentType] || [];

  // Get userId from either context or localStorage
  const getUserId = () => {
    if (user && user.id) return user.id;
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        return parsedUser.id;
      } catch (e) {
        console.error("Error parsing stored user:", e);
      }
    }
    return null;
  };

  useEffect(() => {
    const userId = getUserId();
    if (userId) {
      fetchConnectedPlatforms();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchConnectedPlatforms = async () => {
    const userId = getUserId();
    if (!userId) {
      console.log("User not loaded yet, skipping fetch");
      setLoading(false);
      return;
    }
    
    try {
      console.log("Fetching platforms for user:", userId);
      const { data } = await axios.get(`/api/user/${userId}`);
      if (data.success && data.user.connectedPlatforms) {
        // Convert connectedPlatforms object to array
        const connected = Object.entries(data.user.connectedPlatforms)
          .filter(([key, value]) => value.connected)
          .map(([key, value]) => ({
            platform: key,
            ...value,
          }));
        setConnectedPlatforms(connected);
      }
    } catch (error) {
      console.error("Error fetching platforms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlatform = async (e) => {
    e.preventDefault();
    
    if (!selectedPlatform) {
      toast.error("Please select a platform");
      return;
    }
    
    if (!platformId.trim()) {
      toast.error("Please enter your platform ID");
      return;
    }

    const userId = getUserId();
    if (!userId) {
      toast.error("User not authenticated. Please login again.");
      return;
    }

    setAddLoading(true);

    try {
      console.log("Connecting platform with userId:", userId, "platform:", selectedPlatform);
      const { data } = await axios.post("/api/platform/connect", {
        userId: userId,
        platform: selectedPlatform,
        workType,
      });

      if (data.success) {
        toast.success(`Successfully connected to ${getPlatformLabel(selectedPlatform)}!`);
        setShowAddModal(false);
        setSelectedPlatform("");
        setPlatformId("");
        setWorkType("FULL_TIME");
        fetchConnectedPlatforms();
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || "Connection failed");
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemovePlatform = async (platformName) => {
    if (!confirm(`Are you sure you want to disconnect from ${getPlatformLabel(platformName)}?`)) {
      return;
    }

    const userId = getUserId();
    if (!userId) {
      toast.error("User not authenticated. Please login again.");
      return;
    }

    try {
      const { data } = await axios.post("/api/platform/disconnect", {
        userId: userId,
        platform: platformName,
      });

      if (data.success) {
        toast.success(`Disconnected from ${getPlatformLabel(platformName)}`);
        fetchConnectedPlatforms();
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to disconnect");
    }
  };

  const getPlatformLabel = (platformValue) => {
    const allPlatforms = Object.values(PLATFORM_CONFIG).flat();
    const platform = allPlatforms.find(p => p.value === platformValue);
    return platform ? platform.label : platformValue;
  };

  const getPlatformIcon = (platformValue) => {
    const allPlatforms = Object.values(PLATFORM_CONFIG).flat();
    const platform = allPlatforms.find(p => p.value === platformValue);
    return platform ? platform.icon : "🔗";
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-gray-950" : "bg-gray-50"}`}>
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-900"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950" : "bg-gray-50"}`}>
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header with Gradient */}
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-800 p-8 shadow-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <svg className="w-10 h-10 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 7H7v6h6V7z"/>
                  <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd"/>
                </svg>
                Platform Integrations
              </h1>
              <p className="text-blue-100 text-lg">
                Connect and manage your gig platform accounts
              </p>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl font-bold transition shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Dashboard
            </button>
          </div>
        </div>

        {/* Stats Cards with Gradient Borders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`relative rounded-xl p-[2px] bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg hover:shadow-xl transition`}>
            <div className={`h-full rounded-xl p-6 ${isDark ? "bg-gray-900" : "bg-white"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>Connected</p>
                  <p className={`text-4xl font-bold mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent`}>
                    {connectedPlatforms.length}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 rounded-xl">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 7H7v6h6V7z"/>
                    <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className={`relative rounded-xl p-[2px] bg-gradient-to-r from-yellow-500 to-orange-600 shadow-lg hover:shadow-xl transition`}>
            <div className={`h-full rounded-xl p-6 ${isDark ? "bg-gray-900" : "bg-white"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>Work Type</p>
                  <p className={`text-2xl font-bold mt-2 capitalize ${isDark ? "text-white" : "text-gray-900"}`}>
                    {user?.employmentType?.replace('_', ' ')}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-yellow-500 to-orange-600 p-4 rounded-xl">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className={`relative rounded-xl p-[2px] bg-gradient-to-r from-green-500 to-teal-600 shadow-lg hover:shadow-xl transition`}>
            <div className={`h-full rounded-xl p-6 ${isDark ? "bg-gray-900" : "bg-white"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>Available</p>
                  <p className={`text-4xl font-bold mt-2 bg-gradient-to-r from-green-500 to-teal-600 bg-clip-text text-transparent`}>
                    {platforms.length}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-teal-600 p-4 rounded-xl">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Platform Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl transition shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
            </svg>
            Add New Platform
          </button>
        </div>

        {/* Connected Platforms List */}
        <div className={`rounded-2xl shadow-xl overflow-hidden ${isDark ? "bg-gray-900/80 backdrop-blur-sm border border-gray-800" : "bg-white"}`}>
          <div className={`px-8 py-6 bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border-b ${isDark ? "border-gray-800" : "border-gray-200"}`}>
            <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
              Your Connected Platforms
            </h2>
            <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              Manage all your platform integrations in one place
            </p>
          </div>

          {connectedPlatforms.length === 0 ? (
            <div className="p-16 text-center">
              <div className="mb-6 relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full blur-xl opacity-30"></div>
                <svg className={`relative w-20 h-20 mx-auto ${isDark ? "text-gray-700" : "text-gray-300"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                No Platforms Connected Yet
              </h3>
              <p className={`text-sm max-w-md mx-auto ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                Start by connecting your first gig platform to unlock earnings tracking and credit scoring
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {connectedPlatforms.map((platform) => (
                <div key={platform.platform} className={`p-6 hover:bg-gradient-to-r hover:from-purple-900/10 hover:to-indigo-900/10 transition ${isDark ? "" : "hover:bg-gray-50"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="text-5xl transform hover:scale-110 transition">
                        {getPlatformIcon(platform.platform)}
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                          {getPlatformLabel(platform.platform)}
                        </h3>
                        <div className="flex items-center gap-4 mt-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                            platform.workType === "FULL_TIME" 
                              ? "bg-gradient-to-r from-green-500 to-teal-600 text-white"
                              : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                          }`}>
                            {platform.workType === "FULL_TIME" ? "Full-Time" : "Part-Time"}
                          </span>
                          <span className={`text-sm flex items-center gap-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                            </svg>
                            {new Date(platform.lastSync).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemovePlatform(platform.platform)}
                      className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl transition font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Platform Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setShowAddModal(false)}
          ></div>
          
          <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-scale-in`}>
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-800 p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                    </svg>
                    Add New Platform
                  </h2>
                  <p className="text-blue-100 mt-1">Connect your gig account</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 rounded-lg hover:bg-white/20 transition"
                >
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className={`p-8 ${isDark ? "bg-gray-900" : "bg-white"}`}>
              <form onSubmit={handleAddPlatform} className="space-y-6">
                {/* Platform Dropdown */}
                <div>
                  <label className={`block text-sm font-bold mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    Select Platform <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium ${isDark ? "bg-gray-800 border-gray-700 text-white" : "border-gray-300 text-gray-900"}`}
                    required
                  >
                    <option value="">Choose a platform...</option>
                    {platforms.map((platform) => (
                      <option key={platform.value} value={platform.value}>
                        {platform.icon} {platform.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Platform ID */}
                <div>
                  <label className={`block text-sm font-bold mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    Your Platform ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={platformId}
                    onChange={(e) => setPlatformId(e.target.value)}
                    placeholder="e.g., DRIVER12345 or user@example.com"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium ${isDark ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500" : "border-gray-300 text-gray-900 placeholder-gray-400"}`}
                    required
                  />
                  <p className={`text-xs mt-2 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                    Enter your ID/email registered with the platform
                  </p>
                </div>

                {/* Work Type */}
                <div>
                  <label className={`block text-sm font-bold mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    Work Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setWorkType("FULL_TIME")}
                      className={`py-4 px-4 rounded-xl font-bold transition transform hover:scale-105 ${
                        workType === "FULL_TIME"
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg"
                          : isDark ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Full-Time
                    </button>
                    <button
                      type="button"
                      onClick={() => setWorkType("PART_TIME")}
                      className={`py-4 px-4 rounded-xl font-bold transition transform hover:scale-105 ${
                        workType === "PART_TIME"
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg"
                          : isDark ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Part-Time
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={addLoading}
                  className="w-full py-4 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  {addLoading ? "Connecting..." : "Connect Platform"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
