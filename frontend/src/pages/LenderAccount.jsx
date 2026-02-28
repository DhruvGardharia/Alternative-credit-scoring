import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLenderAuth } from "../context/LenderAuthContext";
import { useTheme } from "../context/ThemeContext";

export default function LenderAccount() {
  const { lender, loading: authLoading, isLenderAuthenticated, getLenderAxios } = useLenderAuth();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && !isLenderAuthenticated) {
      navigate("/lender-login");
    }
  }, [authLoading, isLenderAuthenticated, navigate]);

  useEffect(() => {
    if (isLenderAuthenticated) {
      const fetchData = async () => {
        try {
          const api = getLenderAxios();
          const [statsRes, historyRes] = await Promise.all([
            api.get("/api/lender/stats"),
            api.get("/api/lender/applications?status=all")
          ]);
          setStats(statsRes.data.data);
          
          // Filter history to only include loans the lender has interacted with.
          // The API returns all applications, we want: yours, offer_sent, or defaulted/repaid where lenderId matches.
          const myHistory = historyRes.data.data.filter(app => 
            app.ownership !== "open"
          );
          setHistory(myHistory);
        } catch (err) {
          console.error("Failed to load lender data:", err);
        } finally {
          setLoadingData(false);
        }
      };
      fetchData();
    }
  }, [isLenderAuthenticated]);

  if (authLoading || loadingData) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-gray-950" : "bg-gray-50"}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 border-4 rounded-full animate-spin ${isDark ? "border-blue-800 border-t-blue-400" : "border-blue-200 border-t-blue-600"}`} />
            <p className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}>Loading account details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-gray-950" : "bg-gray-50"}`}>
      {/* Top Bar */}
      <nav className="bg-blue-900 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate("/lender-dashboard")}
              className="text-white hover:text-blue-200 transition px-3 py-1.5 rounded-lg flex items-center justify-center gap-2 group border border-transparent hover:border-blue-700 hover:bg-blue-800"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-semibold">Back to Dashboard</span>
            </button>
            <div>
              <h2 className="font-bold text-sm text-white">My Account</h2>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        
        {/* Profile Header */}
        <div className={`rounded-3xl p-8 mb-8 shadow-sm flex flex-col md:flex-row items-center gap-6 border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
          <div className="w-24 h-24 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold text-4xl shadow-lg shrink-0">
            {lender?.name?.charAt(0) || "?"}
          </div>
          <div className="text-center md:text-left">
            <h1 className={`text-3xl font-bold mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>{lender?.name}</h1>
            <p className={`text-lg font-medium ${isDark ? "text-blue-400" : "text-blue-700"}`}>{lender?.organization}</p>
            <p className={`text-sm mt-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{lender?.email}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Contact Information */}
          <div className={`rounded-2xl p-6 border shadow-sm ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
            <h3 className={`text-xl font-bold mb-5 ${isDark ? "text-white" : "text-gray-900"}`}>Contact Information</h3>
            <div className="space-y-4">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Email Address</p>
                <p className={`font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>{lender?.email}</p>
              </div>
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Phone Number</p>
                <p className={`font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>{lender?.phone || "Not provided"}</p>
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div className={`rounded-2xl p-6 border shadow-sm ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
            <h3 className={`text-xl font-bold mb-5 ${isDark ? "text-white" : "text-gray-900"}`}>Business Details</h3>
            <div className="space-y-4">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Organization Name</p>
                <p className={`font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>{lender?.organization}</p>
              </div>
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>License Number</p>
                <p className={`font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>{lender?.licenseNumber || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Summary */}
        <div className={`rounded-2xl p-6 border shadow-sm ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
          <h3 className={`text-xl font-bold mb-5 ${isDark ? "text-white" : "text-gray-900"}`}>Lending Portfolio Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-xl text-center ${isDark ? "bg-gray-800" : "bg-blue-50"}`}>
              <p className={`text-xs mb-1 ${isDark ? "text-gray-400" : "text-blue-600"}`}>Active Offers</p>
              <p className={`text-2xl font-bold ${isDark ? "text-yellow-400" : "text-blue-900"}`}>{stats?.myOffersCount || 0}</p>
            </div>
            <div className={`p-4 rounded-xl text-center ${isDark ? "bg-gray-800" : "bg-green-50"}`}>
              <p className={`text-xs mb-1 ${isDark ? "text-gray-400" : "text-green-600"}`}>Loans Approved</p>
              <p className={`text-2xl font-bold ${isDark ? "text-green-400" : "text-green-700"}`}>{stats?.approvedCount || 0}</p>
            </div>
            <div className={`p-4 rounded-xl text-center ${isDark ? "bg-gray-800" : "bg-purple-50"}`}>
              <p className={`text-xs mb-1 ${isDark ? "text-gray-400" : "text-purple-600"}`}>Loans Disbursed</p>
              <p className={`text-2xl font-bold ${isDark ? "text-purple-400" : "text-purple-700"}`}>{stats?.disbursedCount || 0}</p>
            </div>
            <div className={`p-4 rounded-xl text-center flex flex-col justify-center ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
              <p className={`text-xs mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Total Portfolio Size</p>
              <p className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>₹{((stats?.totalApprovedAmount || 0) / 1000).toFixed(0)}K</p>
            </div>
          </div>
        </div>

        {/* Lending History */}
        <div className={`mt-8 rounded-2xl p-6 border shadow-sm ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
          <h3 className={`text-xl font-bold mb-5 ${isDark ? "text-white" : "text-gray-900"}`}>Lending History</h3>
          
          {history.length === 0 ? (
            <div className={`text-center py-10 rounded-xl border border-dashed ${isDark ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-300"}`}>
              <p className={isDark ? "text-gray-400" : "text-gray-500"}>No lending history found. Make some offers to build your portfolio!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((app) => (
                <div key={app._id} className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:shadow-md ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold shadow-inner shrink-0">
                      {app.borrowerId?.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <h4 className={`font-semibold text-base ${isDark ? "text-white" : "text-gray-900"}`}>{app.borrowerId?.name || "Unknown Borrower"}</h4>
                      <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        Applied {new Date(app.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:items-end gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        app.ownership === "yours" 
                          ? isDark ? "bg-blue-900/30 text-blue-400 border-blue-700" : "bg-blue-50 text-blue-700 border-blue-300"
                          : isDark ? "bg-yellow-900/30 text-yellow-400 border-yellow-700" : "bg-yellow-50 text-yellow-700 border-yellow-300"
                      }`}>
                        {app.ownership === "yours" ? "PORTFOLIO" : "OFFER SENT"}
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        app.status === "repaid" ? (isDark ? "bg-emerald-900/30 text-emerald-400 border-emerald-700" : "bg-emerald-50 text-emerald-700 border-emerald-300") :
                        app.status === "disbursed" ? (isDark ? "bg-purple-900/30 text-purple-400 border-purple-700" : "bg-purple-50 text-purple-700 border-purple-300") :
                        app.status === "approved" ? (isDark ? "bg-green-900/30 text-green-400 border-green-700" : "bg-green-50 text-green-700 border-green-300") :
                        app.status === "defaulted" ? (isDark ? "bg-red-900/30 text-red-400 border-red-700" : "bg-red-50 text-red-700 border-red-300") :
                        (isDark ? "bg-gray-800 text-gray-400 border-gray-600" : "bg-gray-100 text-gray-600 border-gray-300")
                      }`}>
                        {app.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                       <span className={`font-bold text-lg ${isDark ? "text-white" : "text-gray-900"}`}>₹{app.amount.toLocaleString()}</span>
                       <span className={`text-xs px-2 py-0.5 rounded bg-opacity-20 ${
                         app.purpose === "medical" ? "bg-red-500 text-red-700 dark:text-red-400" :
                         app.purpose === "education" ? "bg-blue-500 text-blue-700 dark:text-blue-400" :
                         app.purpose === "vehicle_repair" ? "bg-orange-500 text-orange-700 dark:text-orange-400" :
                         "bg-gray-500 text-gray-700 dark:text-gray-400"
                       } capitalize`}>{app.purpose.replace("_", " ")}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
