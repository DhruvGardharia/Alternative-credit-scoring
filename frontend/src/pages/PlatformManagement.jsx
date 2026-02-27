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
  const [syncingPlatform, setSyncingPlatform] = useState(null); // platform name being re-synced
  const [syncResult, setSyncResult] = useState(null); // { platform, transactionCount, totalEarnings, creditScore }
  const [liveSyncData, setLiveSyncData] = useState({}); // per-platform live today data after Sync Now

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
      setLoading(false);
      return;
    }
    try {
      const { data } = await axios.get(`/api/platform/connected/${userId}`);
      if (data.success) {
        setConnectedPlatforms(data.data.connected || []);
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
      const { data } = await axios.post("/api/platform/connect", {
        userId,
        platform: selectedPlatform,
        workType,
      });

      if (data.success) {
        setSyncResult({
          platform: getPlatformLabel(selectedPlatform),
          transactionCount: data.data?.transactionCount || 0,
          totalEarnings: data.data?.totalEarnings || 0,
          creditScore: data.data?.creditScore || null,
          today: data.data?.today || null,
        });
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

  const handleSyncNow = async (platformName, platformWorkType) => {
    const userId = getUserId();
    if (!userId) return;
    setSyncingPlatform(platformName);
    try {
      const { data } = await axios.post("/api/platform/connect", {
        userId,
        platform: platformName,
        workType: platformWorkType || "FULL_TIME",
      });
      if (data.success) {
        const today = data.data?.today;
        toast.success(
          today
            ? `${getPlatformLabel(platformName)} synced — ${today.tripsOrDeliveries} trips today · ₹${today.earnings.toLocaleString("en-IN")} earned`
            : `${getPlatformLabel(platformName)} synced — ${data.data?.transactionCount || 0} days`
        );
        // Store live today data for this platform so the row updates immediately
        if (today) {
          setLiveSyncData(prev => ({
            ...prev,
            [platformName]: {
              todayActivity: today.tripsOrDeliveries,
              todayEarnings: today.earnings,
              baseFare: today.baseFare,
              platformFee: today.platformFee,
              incentives: today.incentives,
              transactionCount: data.data?.transactionCount,
              totalEarnings: data.data?.totalEarnings,
            }
          }));
        }
        fetchConnectedPlatforms();
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || "Sync failed");
    } finally {
      setSyncingPlatform(null);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-900"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-gray-950" : "bg-gray-50"}`}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Header — matches Dashboard welcome banner */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg shadow-md p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">
                Platform Integrations
              </h1>
              <p className="text-blue-100 text-sm">Connect and manage your gig platform accounts</p>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg font-semibold text-sm transition shadow"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Dashboard
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Connected */}
          <div className={`rounded-lg shadow border p-5 ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-500"}`}>Connected</p>
            <p className="text-3xl font-bold mt-1 text-blue-600">{connectedPlatforms.length}</p>
            <p className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Active platforms</p>
          </div>

          {/* Work Type */}
          <div className={`rounded-lg shadow border p-5 ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-500"}`}>Work Type</p>
            <p className={`text-xl font-bold mt-1 capitalize ${isDark ? "text-white" : "text-gray-900"}`}>
              {user?.employmentType?.replace('_', ' ') || "—"}
            </p>
            <p className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Employment mode</p>
          </div>

          {/* Available */}
          <div className={`rounded-lg shadow border p-5 ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-500"}`}>Available</p>
            <p className="text-3xl font-bold mt-1 text-blue-600">{platforms.length}</p>
            <p className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Platforms to connect</p>
          </div>
        </div>

        {/* Add Platform Button */}
        <div className="mb-6">
          <button
            onClick={() => { setShowAddModal(true); setSyncResult(null); }}
            className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg transition shadow hover:shadow-md"
          >
            Add New Platform
          </button>
        </div>

        {/* Connected Platforms List */}
        <div className={`rounded-lg shadow overflow-hidden border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
          <div className={`px-6 py-4 bg-gradient-to-r from-blue-900 to-blue-800 border-b ${isDark ? "border-gray-700" : "border-blue-700"}`}>
            <h2 className="text-lg font-bold text-white">Your Connected Platforms</h2>
            <p className="text-blue-100 text-xs mt-0.5">Manage all your platform integrations in one place</p>
          </div>

          {connectedPlatforms.length === 0 ? (
            <div className="p-14 text-center">
              <svg className={`w-16 h-16 mx-auto mb-4 ${isDark ? "text-gray-700" : "text-gray-300"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className={`text-base font-bold mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                No Platforms Connected Yet
              </h3>
              <p className={`text-sm max-w-sm mx-auto ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                Connect your first gig platform to unlock earnings tracking and credit scoring
              </p>
            </div>
          ) : (
            <div className="divide-y divide-transparent">
              {connectedPlatforms.map((platform) => {
                // Prefer live sync data (just synced) over stale fetch data
                const live = liveSyncData[platform.platform];
                const todayTrips    = live?.todayActivity   ?? platform.todayActivity   ?? 0;
                const todayEarned   = live?.todayEarnings   ?? platform.todayEarnings   ?? 0;
                const todayBase     = live?.baseFare        ?? 0;
                const todayFee      = live?.platformFee     ?? 0;
                const todayBonus    = live?.incentives      ?? 0;
                const avgPerTrip    = todayTrips > 0 ? Math.round(todayEarned / todayTrips) : 0;
                const totalEarnings = live?.totalEarnings   ?? platform.totalEarnings   ?? 0;
                const txCount       = live?.transactionCount ?? platform.transactionCount ?? 0;

                return (
                  <div
                    key={platform.platform}
                    className={`mx-4 my-3 rounded-xl border shadow-sm overflow-hidden ${
                      isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
                    }`}
                  >
                    {/* ── Top row: name + actions ─────────────────────────── */}
                    <div className={`flex items-center justify-between px-5 py-4 border-b ${
                      isDark ? "border-gray-800" : "border-gray-100"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center">
                          <span className="text-yellow-400 font-bold text-sm">
                            {getPlatformLabel(platform.platform).slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className={`text-base font-bold leading-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                            {getPlatformLabel(platform.platform)}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold mt-0.5 ${
                            platform.workType === "FULL_TIME"
                              ? "bg-blue-900 text-yellow-400"
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {platform.workType === "FULL_TIME" ? "Full-Time" : "Part-Time"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSyncNow(platform.platform, platform.workType)}
                          disabled={syncingPlatform === platform.platform}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                            isDark
                              ? "border-blue-700 text-blue-400 hover:bg-blue-900/30 disabled:opacity-40"
                              : "border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-40"
                          }`}
                        >
                          <svg className={`w-3.5 h-3.5 ${syncingPlatform === platform.platform ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          {syncingPlatform === platform.platform ? "Syncing..." : "Sync Now"}
                        </button>
                        <button
                          onClick={() => handleRemovePlatform(platform.platform)}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>

                    {/* ── All-time summary strip ───────────────────────────── */}
                    <div className={`grid grid-cols-3 divide-x text-center ${
                      isDark ? "divide-gray-800 bg-gray-800/40" : "divide-gray-100 bg-gray-50"
                    }`}>
                      <div className="px-4 py-3">
                        <p className={`text-xs uppercase tracking-wide font-semibold ${
                          isDark ? "text-gray-500" : "text-gray-400"
                        }`}>Total Earned</p>
                        <p className={`text-lg font-bold mt-0.5 ${
                          isDark ? "text-green-400" : "text-green-700"
                        }`}>₹{totalEarnings.toLocaleString("en-IN")}</p>
                      </div>
                      <div className="px-4 py-3">
                        <p className={`text-xs uppercase tracking-wide font-semibold ${
                          isDark ? "text-gray-500" : "text-gray-400"
                        }`}>Days Worked</p>
                        <p className={`text-lg font-bold mt-0.5 ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}>{txCount}</p>
                      </div>
                      <div className="px-4 py-3">
                        <p className={`text-xs uppercase tracking-wide font-semibold ${
                          isDark ? "text-gray-500" : "text-gray-400"
                        }`}>Last Synced</p>
                        <p className={`text-sm font-semibold mt-0.5 ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}>{new Date(platform.lastSync).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                      </div>
                    </div>

                    {/* ── Today's activity expanded ────────────────────────── */}
                    {todayTrips > 0 ? (
                      <div className={`px-5 py-4 border-t ${
                        isDark ? "border-gray-800 bg-blue-950/30" : "border-blue-100 bg-blue-50"
                      }`}>
                        <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${
                          isDark ? "text-blue-400" : "text-blue-700"
                        }`}>Today's Activity — {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {/* Trips */}
                          <div className={`rounded-lg px-4 py-3 text-center ${
                            isDark ? "bg-gray-800" : "bg-white border border-blue-200"
                          }`}>
                            <p className={`text-xs font-semibold uppercase tracking-wide ${
                              isDark ? "text-gray-400" : "text-gray-500"
                            }`}>Trips / Jobs</p>
                            <p className={`text-2xl font-extrabold mt-1 ${
                              isDark ? "text-white" : "text-gray-900"
                            }`}>{todayTrips}</p>
                            {avgPerTrip > 0 && (
                              <p className={`text-xs mt-0.5 ${
                                isDark ? "text-gray-500" : "text-gray-400"
                              }`}>₹{avgPerTrip} avg/trip</p>
                            )}
                          </div>
                          {/* Net Earned */}
                          <div className={`rounded-lg px-4 py-3 text-center ${
                            isDark ? "bg-gray-800" : "bg-white border border-green-200"
                          }`}>
                            <p className={`text-xs font-semibold uppercase tracking-wide ${
                              isDark ? "text-gray-400" : "text-gray-500"
                            }`}>Net Earned</p>
                            <p className="text-2xl font-extrabold mt-1 text-green-600">₹{todayEarned.toLocaleString("en-IN")}</p>
                            {todayBase > 0 && (
                              <p className={`text-xs mt-0.5 ${
                                isDark ? "text-gray-500" : "text-gray-400"
                              }`}>Base ₹{todayBase.toLocaleString("en-IN")}</p>
                            )}
                          </div>
                          {/* Platform Fee */}
                          <div className={`rounded-lg px-4 py-3 text-center ${
                            isDark ? "bg-gray-800" : "bg-white border border-red-200"
                          }`}>
                            <p className={`text-xs font-semibold uppercase tracking-wide ${
                              isDark ? "text-gray-400" : "text-gray-500"
                            }`}>Platform Cut</p>
                            <p className="text-2xl font-extrabold mt-1 text-red-500">₹{todayFee.toLocaleString("en-IN")}</p>
                            {todayBase > 0 && (
                              <p className={`text-xs mt-0.5 ${
                                isDark ? "text-gray-500" : "text-gray-400"
                              }`}>{Math.round((todayFee/(todayBase||1))*100)}% of base</p>
                            )}
                          </div>
                          {/* Incentives */}
                          <div className={`rounded-lg px-4 py-3 text-center ${
                            isDark ? "bg-gray-800" : "bg-white border border-yellow-200"
                          }`}>
                            <p className={`text-xs font-semibold uppercase tracking-wide ${
                              isDark ? "text-gray-400" : "text-gray-500"
                            }`}>Incentives</p>
                            <p className={`text-2xl font-extrabold mt-1 ${
                              todayBonus > 0
                                ? "text-yellow-500"
                                : isDark ? "text-gray-600" : "text-gray-300"
                            }`}>₹{todayBonus.toLocaleString("en-IN")}</p>
                            <p className={`text-xs mt-0.5 ${
                              isDark ? "text-gray-500" : "text-gray-400"
                            }`}>{todayBonus > 0 ? "Bonuses earned" : "No bonus today"}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className={`px-5 py-3 border-t text-center ${
                        isDark ? "border-gray-800" : "border-gray-100"
                      }`}>
                        <p className={`text-xs ${
                          isDark ? "text-gray-600" : "text-gray-400"
                        }`}>No activity recorded today — sync to refresh</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Platform Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => { setShowAddModal(false); setSyncResult(null); }}
          ></div>

          <div className={`relative w-full max-w-lg rounded-xl shadow-2xl overflow-hidden`}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-7 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Add New Platform
                  </h2>
                  <p className="text-blue-100 text-xs mt-1">Connect your gig account</p>
                </div>
                <button
                  onClick={() => { setShowAddModal(false); setSyncResult(null); }}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition"
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Form Content or Sync Result */}
            <div className={`px-7 py-6 ${isDark ? "bg-gray-900" : "bg-white"}`}>
              {syncResult ? (
                // ── Sync success summary ──────────────────────────────
                <div className="text-center py-2">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-4">
                    <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className={`text-lg font-bold mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>
                    {syncResult.platform} Connected!
                  </h3>
                  <p className={`text-sm mb-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Your earnings have been synced successfully
                  </p>
                  <div className={`grid grid-cols-2 gap-3 mb-4 text-left rounded-lg p-4 ${isDark ? "bg-gray-800" : "bg-gray-50"}`}>
                    <div>
                      <p className={`text-xs uppercase tracking-wide font-semibold ${isDark ? "text-gray-400" : "text-gray-500"}`}>Days synced</p>
                      <p className="text-2xl font-bold mt-0.5 text-blue-600">{syncResult.transactionCount}</p>
                    </div>
                    <div>
                      <p className={`text-xs uppercase tracking-wide font-semibold ${isDark ? "text-gray-400" : "text-gray-500"}`}>Total Earnings</p>
                      <p className="text-2xl font-bold mt-0.5 text-green-600">
                        ₹{syncResult.totalEarnings.toLocaleString("en-IN")}
                      </p>
                    </div>
                    {syncResult.creditScore && (
                      <div className="col-span-2 border-t pt-3 mt-1">
                        <p className={`text-xs uppercase tracking-wide font-semibold ${isDark ? "text-gray-400" : "text-gray-500"}`}>Updated Credit Score</p>
                        <p className="text-2xl font-bold mt-0.5 text-yellow-500">
                          {syncResult.creditScore}
                          <span className={`text-sm font-normal ml-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>/ 850</span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Today's activity breakdown */}
                  {syncResult.today && (
                    <div className={`rounded-lg p-4 mb-4 border-l-4 border-blue-900 ${isDark ? "bg-gray-800" : "bg-blue-50"}`}>
                      <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${isDark ? "text-blue-400" : "text-blue-800"}`}>
                        Today’s Activity
                      </p>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Trips</p>
                          <p className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{syncResult.today.tripsOrDeliveries}</p>
                        </div>
                        <div>
                          <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Net Earned</p>
                          <p className="text-xl font-bold text-green-600">₹{syncResult.today.earnings.toLocaleString("en-IN")}</p>
                        </div>
                        <div>
                          <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Platform Fee</p>
                          <p className="text-xl font-bold text-red-500">₹{syncResult.today.platformFee.toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                      {syncResult.today.incentives > 0 && (
                        <p className={`text-xs mt-2 text-center ${isDark ? "text-green-400" : "text-green-700"}`}>
                          +₹{syncResult.today.incentives} incentives / bonuses
                        </p>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => { setSyncResult(null); setShowAddModal(false); }}
                    className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg transition"
                  >
                    Done
                  </button>
                </div>
              ) : (
                // ── Connect form ──────────────────────────────────────
                <form onSubmit={handleAddPlatform} className="space-y-5">
                  <div>
                    <label className={`block text-sm font-semibold mb-1.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      Select Platform <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={selectedPlatform}
                      onChange={(e) => setSelectedPlatform(e.target.value)}
                      className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium ${isDark ? "bg-gray-800 border-gray-700 text-white" : "border-gray-300 text-gray-900"}`}
                      required
                    >
                      <option value="">Choose a platform...</option>
                      {platforms.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-1.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      Your Platform ID <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={platformId}
                      onChange={(e) => setPlatformId(e.target.value)}
                      placeholder="e.g., DRIVER12345 or user@example.com"
                      className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium ${isDark ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500" : "border-gray-300 text-gray-900 placeholder-gray-400"}`}
                      required
                    />
                    <p className={`text-xs mt-1.5 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                      Enter your ID or email registered with the platform
                    </p>
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-1.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      Work Type <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setWorkType("FULL_TIME")}
                        className={`py-3 px-4 rounded-lg text-sm font-semibold transition ${
                          workType === "FULL_TIME"
                            ? "bg-blue-900 text-yellow-400 shadow"
                            : isDark ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Full-Time
                      </button>
                      <button
                        type="button"
                        onClick={() => setWorkType("PART_TIME")}
                        className={`py-3 px-4 rounded-lg text-sm font-semibold transition ${
                          workType === "PART_TIME"
                            ? "bg-blue-900 text-yellow-400 shadow"
                            : isDark ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Part-Time
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={addLoading}
                    className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow"
                  >
                    {addLoading ? "Connecting..." : "Connect Platform"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
