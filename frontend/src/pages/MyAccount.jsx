import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

const MyAccount = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [creditData, setCreditData] = useState(null);
  const [loans, setLoans] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        setLoading(true);
        // Attempt to fetch all relevant data
        const [creditRes, loansRes, policiesRes] = await Promise.allSettled([
          axios.get(`/api/credit/${user._id}`),
          axios.get("/api/loans/my-loans"),
          axios.get("/api/insurance/policies")
        ]);

        if (creditRes.status === "fulfilled" && creditRes.value.data.success) {
          setCreditData(creditRes.value.data.data);
        }
        if (loansRes.status === "fulfilled" && loansRes.value.data.success) {
          setLoans(loansRes.value.data.data || []);
        }
        if (policiesRes.status === "fulfilled" && policiesRes.value.data.success) {
          setPolicies(policiesRes.value.data.policies || []);
        }
      } catch (error) {
        console.error("Error fetching account data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) {
      fetchAccountData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
        <Navbar />
        <div className="flex justify-center items-center h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  // Formatting helpers
  const getInitials = (name) => name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";
  
  return (
    <div className={`min-h-screen pb-12 transition-colors duration-300 ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        <h1 className="text-3xl font-bold mb-8">My Account</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1: User Profile & Credit Score */}
          <div className="space-y-8">
            {/* User Profile Card */}
            <div className={`p-6 rounded-3xl shadow-xl transition-all duration-300 border ${isDark ? "bg-gray-800 border-gray-700 hover:border-blue-500/50" : "bg-white border-gray-100 hover:border-blue-200"}`}>
              <div className="flex flex-col items-center text-center">
                <div className={`w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold mb-4 ${isDark ? "bg-blue-900 text-blue-300" : "bg-blue-100 text-blue-600"} ring-4 ring-blue-500/20`}>
                  {getInitials(user?.name)}
                </div>
                <h2 className="text-xl font-bold">{user?.name}</h2>
                <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{user?.email}</p>
                
                <div className="mt-6 w-full pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Type</span>
                    <span className="text-xs font-bold px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full tracking-wide">
                      {(user?.role || "Gig Worker").toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Member Since</span>
                    <span className="text-sm font-semibold">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Credit Score Card */}
            <div className={`p-6 rounded-3xl shadow-xl transition-all duration-300 border relative overflow-hidden group ${isDark ? "bg-gradient-to-br from-indigo-900/40 to-gray-800 border-indigo-500/30 hover:border-indigo-500" : "bg-gradient-to-br from-indigo-50 to-white border-indigo-100 hover:border-indigo-300"}`}>
              <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-20 transition-opacity duration-300 group-hover:opacity-40 ${isDark ? "bg-indigo-500" : "bg-indigo-400"}`}></div>
              
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                📊 Credit Snapshot
              </h3>
              
              {creditData ? (
                <div className="flex flex-col items-center justify-center py-4 relative z-10">
                  <div className="relative">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="none" className="text-gray-200 dark:text-gray-700" />
                      <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="none" 
                        strokeDasharray="351.858" 
                        strokeDashoffset={351.858 - (351.858 * (creditData.score / 850))}
                        className="text-indigo-500 transition-all duration-1000 ease-out" 
                        strokeLinecap="round" 
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{creditData.score}</span>
                      <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mt-1">
                        {creditData.score >= 750 ? "Excellent" : creditData.score >= 500 ? "Stable" : "Needs Attention"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-6 w-full grid grid-cols-2 gap-4 text-center">
                    <div className={`p-3 rounded-2xl ${isDark ? "bg-gray-800/80" : "bg-white"} shadow-sm border border-gray-100 dark:border-gray-700`}>
                      <span className="block text-xs uppercase font-medium text-gray-500 dark:text-gray-400">Risk Level</span>
                      <span className="font-bold text-sm mt-1 block">{creditData.riskLevel}</span>
                    </div>
                    <div className={`p-3 rounded-2xl ${isDark ? "bg-gray-800/80" : "bg-white"} shadow-sm border border-gray-100 dark:border-gray-700`}>
                      <span className="block text-xs uppercase font-medium text-gray-500 dark:text-gray-400">Eligibility</span>
                      <span className="font-bold text-sm mt-1 block">
                        {creditData.score >= 700 ? "Eligible" : creditData.score >= 500 ? "Partially Eligible" : "Building Eligibility"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 relative z-10">
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">You haven't generated a credit score yet.</p>
                  <button onClick={() => navigate("/dashboard")} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-indigo-500/30">
                    Calculate Now
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Column 2 & 3: Loans & Insurance */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Active Loans Section */}
            <div className={`p-8 rounded-3xl shadow-xl border relative overflow-hidden group ${isDark ? "bg-gray-800 border-gray-700 hover:border-emerald-500/30" : "bg-white border-gray-100 hover:border-emerald-200"}`}>
              <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-10 transition-opacity duration-300 group-hover:opacity-20 ${isDark ? "bg-emerald-500" : "bg-emerald-400"}`}></div>

              <div className="flex justify-between items-center mb-6 relative z-10">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  💸 My Loans
                </h3>
              </div>
              
              {loans.length > 0 ? (
                <div className="space-y-4 relative z-10">
                  {loans.map(loan => (
                    <div key={loan._id} className={`p-5 rounded-2xl border transition-colors ${isDark ? "bg-gray-750 border-gray-600 hover:bg-gray-700" : "bg-gray-50 border-gray-200 hover:bg-white inset-0"} flex flex-col sm:flex-row justify-between items-center gap-4`}>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">₹{loan.amount.toLocaleString()}</span>
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold tracking-wider uppercase ${
                            loan.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
                            loan.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {loan.status}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 capitalize">{loan.purpose || "Gig Worker Loan"}</p>
                      </div>
                      <div className="text-right w-full sm:w-auto">
                        <p className="text-sm font-semibold mb-1">Tenure: {loan.duration} months</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Applied: {new Date(loan.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`p-10 text-center rounded-2xl border-2 border-dashed ${isDark ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50/50"} relative z-10`}>
                  <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">📝</span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium mb-4">You don't have any active loans.</p>
                  <button onClick={() => navigate("/emergency-loan")} className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">Apply for an Emergency Loan ↗</button>
                </div>
              )}
            </div>

            {/* Micro-Insurance Section */}
            <div className={`p-8 rounded-3xl shadow-xl border relative overflow-hidden group ${isDark ? "bg-gray-800 border-gray-700 hover:border-cyan-500/30" : "bg-white border-gray-100 hover:border-cyan-200"}`}>
              <div className={`absolute -left-20 -bottom-20 w-64 h-64 rounded-full blur-3xl opacity-10 transition-opacity duration-300 group-hover:opacity-20 ${isDark ? "bg-cyan-500" : "bg-cyan-400"}`}></div>

              <div className="flex justify-between items-center mb-6 relative z-10">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  🛡️ Micro-Insurance Policies
                </h3>
              </div>

              {policies.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
                  {policies.map((policy, idx) => (
                    <div key={idx} className={`p-6 rounded-2xl border relative overflow-hidden ${isDark ? "bg-gradient-to-br from-cyan-900/10 to-gray-800 border-cyan-500/20 hover:border-cyan-500/40" : "bg-gradient-to-br from-cyan-50/30 to-white border-cyan-100 hover:border-cyan-300"} transition-all duration-300 shadow-sm`}>
                      <div className="flex justify-between items-start mb-4">
                        <span className="font-bold text-cyan-700 dark:text-cyan-400 flex items-center gap-2 text-lg">
                          {policy.policyType === "shift" ? "🚗 Shift Protection" : 
                           policy.policyType === "health" ? "🏥 Health Cover" : "☂️ General Policy"}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2.5 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded-lg tracking-wider">
                          ACTIVE
                        </span>
                      </div>
                      <div className="space-y-3 mt-5 pt-5 border-t border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 dark:text-gray-400 font-medium">Coverage</span>
                          <span className="font-bold text-base">₹{policy.coverageAmount?.toLocaleString() || "10,000"}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 dark:text-gray-400 font-medium">Premium</span>
                          <span className="font-bold bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-300 px-2 py-0.5 rounded-md">
                            ₹{policy.premiumAmount?.toLocaleString() || "15"}/day
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 text-xs text-gray-400 dark:text-gray-500 flex justify-between">
                         <span>Zone: {policy.locationZone || "General"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`p-10 text-center rounded-2xl border-2 border-dashed ${isDark ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50/50"} relative z-10`}>
                  <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">☂️</span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium mb-4">No active insurance policies.</p>
                  <button onClick={() => navigate("/insurance")} className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline">Explore Micro-Insurance ↗</button>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default MyAccount;
