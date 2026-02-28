import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLenderAuth } from "../context/LenderAuthContext";
import { useTheme } from "../context/ThemeContext";
import axios from "axios";

const STATUS_STYLES_DARK = {
  pending: "bg-yellow-900/30 text-yellow-400 border-yellow-700",
  approved: "bg-green-900/30 text-green-400 border-green-700",
  disbursed: "bg-purple-900/30 text-purple-400 border-purple-700",
  repaid: "bg-emerald-900/30 text-emerald-400 border-emerald-700",
  defaulted: "bg-gray-800 text-gray-400 border-gray-600",
  cancelled: "bg-gray-800 text-gray-400 border-gray-600"
};
const STATUS_STYLES_LIGHT = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-300",
  approved: "bg-green-50 text-green-700 border-green-300",
  disbursed: "bg-purple-50 text-purple-700 border-purple-300",
  repaid: "bg-emerald-50 text-emerald-700 border-emerald-300",
  defaulted: "bg-gray-100 text-gray-600 border-gray-300",
  cancelled: "bg-gray-100 text-gray-600 border-gray-300"
};

const OWNERSHIP_STYLES_DARK = {
  open: { label: "OPEN", style: "bg-blue-900/30 text-blue-400 border-blue-700" },
  offer_sent: { label: "OFFER SENT", style: "bg-yellow-900/30 text-yellow-400 border-yellow-700" },
  yours: { label: "YOURS", style: "bg-blue-900/30 text-blue-400 border-blue-700" }
};
const OWNERSHIP_STYLES_LIGHT = {
  open: { label: "OPEN", style: "bg-blue-50 text-blue-700 border-blue-300" },
  offer_sent: { label: "OFFER SENT", style: "bg-yellow-50 text-yellow-700 border-yellow-300" },
  yours: { label: "YOURS", style: "bg-blue-50 text-blue-700 border-blue-300" }
};

const PURPOSE_LABELS = {
  medical: "Medical", vehicle_repair: "Vehicle Repair", family_emergency: "Family Emergency",
  rent: "Rent", equipment: "Equipment", education: "Education", other: "Other"
};

export default function LenderDashboard() {
  const { lender, lenderToken, isLenderAuthenticated, loading: authLoading, lenderLogout } = useLenderAuth();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });

  const [offerForm, setOfferForm] = useState({
    interestRate: "", repaymentTermMonths: "", offeredAmount: "", lenderNotes: ""
  });

  const lenderApi = axios.create({ headers: { Authorization: `Bearer ${lenderToken}` } });

  const ownershipStyles = isDark ? OWNERSHIP_STYLES_DARK : OWNERSHIP_STYLES_LIGHT;
  const statusStyles = isDark ? STATUS_STYLES_DARK : STATUS_STYLES_LIGHT;

  useEffect(() => {
    if (!authLoading && !isLenderAuthenticated) navigate("/lender-login");
  }, [authLoading, isLenderAuthenticated, navigate]);

  useEffect(() => {
    if (isLenderAuthenticated) fetchData();
  }, [filterStatus, isLenderAuthenticated]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, appsRes] = await Promise.all([
        lenderApi.get("/api/lender/stats"),
        lenderApi.get(`/api/lender/applications?status=${filterStatus}`)
      ]);
      setStats(statsRes.data.data);
      setApplications(appsRes.data.data);
    } catch (err) {
      console.error("Failed to load:", err);
    } finally {
      setLoading(false);
    }
  };

  const viewDetail = async (loanId) => {
    setDetailLoading(true);
    try {
      const res = await lenderApi.get(`/api/lender/applications/${loanId}`);
      setSelectedApp(res.data.data);
    } catch (err) {
      console.error("Failed to load detail:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleMakeOffer = async () => {
    if (!offerForm.interestRate || !offerForm.repaymentTermMonths) return;
    setActionLoading(true);
    try {
      await lenderApi.post(`/api/lender/applications/${selectedApp.loan._id}/offer`, {
        interestRate: Number(offerForm.interestRate),
        repaymentTermMonths: Number(offerForm.repaymentTermMonths),
        offeredAmount: Number(offerForm.offeredAmount) || selectedApp.loan.amount,
        lenderNotes: offerForm.lenderNotes
      });
      setActionMessage({ type: "success", text: "Offer sent! Waiting for borrower's response." });
      setShowOfferModal(false);
      setSelectedApp(null);
      fetchData();
    } catch (err) {
      setActionMessage({ type: "error", text: err.response?.data?.error || "Failed" });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePass = async () => {
    if (!confirm("Pass on this loan? It will stay open for other lenders.")) return;
    setActionLoading(true);
    try {
      await lenderApi.put(`/api/lender/applications/${selectedApp.loan._id}/pass`);
      setActionMessage({ type: "success", text: "Passed. Loan remains open for others." });
      setSelectedApp(null);
      fetchData();
    } catch (err) {
      setActionMessage({ type: "error", text: err.response?.data?.error || "Failed" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!confirm("Withdraw your offer?")) return;
    setActionLoading(true);
    try {
      await lenderApi.put(`/api/lender/applications/${selectedApp.loan._id}/withdraw`);
      setActionMessage({ type: "success", text: "Offer withdrawn." });
      setSelectedApp(null);
      fetchData();
    } catch (err) {
      setActionMessage({ type: "error", text: err.response?.data?.error || "Failed" });
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || (loading && !stats)) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-gray-950" : "bg-gray-50"}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 border-4 rounded-full animate-spin ${isDark ? "border-blue-800 border-t-blue-400" : "border-blue-200 border-t-blue-600"}`} />
            <p className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}>Loading lender dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-gray-950" : "bg-gray-50"}`}>
      {/* Top Bar */}
      <nav className="bg-blue-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Lender Portal</h2>
              <p className="text-blue-200 text-xs">{lender?.organization}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 relative">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{lender?.name}</p>
              <p className="text-blue-200 text-xs">{lender?.email}</p>
            </div>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-10 h-10 bg-blue-700 hover:bg-blue-600 rounded-full flex items-center justify-center text-white font-bold transition focus:ring-2 focus:ring-yellow-400"
            >
              {lender?.name?.charAt(0) || "U"}
            </button>
            {showDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                <div className={`absolute right-0 top-12 mt-2 w-48 rounded-xl shadow-lg border z-20 py-2 ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 mb-1 sm:hidden">
                    <p className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{lender?.name}</p>
                    <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{lender?.email}</p>
                  </div>
                  <button
                    onClick={() => { setShowDropdown(false); navigate("/lender-account"); }}
                    className={`w-full text-left px-4 py-2 text-sm transition font-medium ${isDark ? "text-gray-200 hover:bg-gray-700 hover:text-blue-400" : "text-gray-700 hover:bg-gray-100 hover:text-blue-700"}`}
                  >
                    My Account
                  </button>
                  <button
                    onClick={() => { setShowDropdown(false); lenderLogout(); navigate("/lender-login"); }}
                    className={`w-full text-left px-4 py-2 text-sm transition font-medium text-red-600 ${isDark ? "hover:bg-gray-700 text-red-500" : "hover:bg-red-50"}`}
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Loan Marketplace</h1>
          <p className={isDark ? "text-gray-400" : "text-gray-600"}>Browse loan requests, make offers, and manage your portfolio</p>
        </div>

        {/* Action Message */}
        {actionMessage.text && (
          <div className={`mb-6 p-4 rounded-xl border text-sm font-medium ${
            actionMessage.type === "success"
              ? isDark ? "bg-green-900/20 border-green-800 text-green-400" : "bg-green-50 border-green-200 text-green-700"
              : isDark ? "bg-red-900/30 border-red-800 text-red-400" : "bg-red-50 border-red-200 text-red-700"
          }`}>
            {actionMessage.text}
            <button onClick={() => setActionMessage({ type: "", text: "" })} className="float-right text-current opacity-60 hover:opacity-100">{"\u2715"}</button>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
            {[
              { label: "Open", value: stats.openPendingCount, color: isDark ? "text-blue-400" : "text-blue-700" },
              { label: "My Offers", value: stats.myOffersCount, color: isDark ? "text-yellow-400" : "text-yellow-700" },
              { label: "Approved", value: stats.approvedCount, color: isDark ? "text-green-400" : "text-green-700" },
              { label: "Disbursed", value: stats.disbursedCount, color: isDark ? "text-purple-400" : "text-purple-700" },
              { label: "Repaid", value: stats.repaidCount, color: isDark ? "text-emerald-400" : "text-emerald-700" },
              { label: "Defaulted", value: stats.defaultedCount, color: isDark ? "text-red-400" : "text-red-700" },
              { label: "Portfolio", value: `₹${((stats.totalApprovedAmount || 0) / 1000).toFixed(0)}K`, color: isDark ? "text-blue-400" : "text-blue-900" }
            ].map((s, i) => (
              <div key={i} className={`rounded-xl p-3 border shadow-sm ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
                <span className={`text-xs font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>{s.label}</span>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: "all", label: "All" },
            { key: "pending", label: "Open" },
            { key: "offered", label: "My Offers" },
            { key: "approved", label: "Approved" },
            { key: "disbursed", label: "Disbursed" },
            { key: "repaid", label: "Repaid" }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterStatus === key
                  ? "bg-blue-900 text-white shadow-lg"
                  : isDark ? "bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white border border-gray-700" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >{label}</button>
          ))}
        </div>

        {/* List + Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Application List */}
          <div className={`${selectedApp ? "lg:col-span-2" : "lg:col-span-5"} space-y-3`}>
            {applications.length === 0 ? (
              <div className={`rounded-2xl p-12 text-center border ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
                <p className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}>No applications found</p>
              </div>
            ) : (
              applications.map((app) => (
                <div
                  key={app._id}
                  onClick={() => viewDetail(app._id)}
                  className={`rounded-xl p-4 cursor-pointer transition-all border ${isDark ? "bg-gray-900 hover:bg-gray-800" : "bg-white hover:bg-gray-50"} ${
                    selectedApp?.loan?._id === app._id
                      ? "border-blue-500 shadow-lg"
                      : isDark ? "border-gray-700 hover:border-gray-600" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {app.borrowerId?.name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <h4 className={`font-semibold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>{app.borrowerId?.name || "Unknown"}</h4>
                        <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>{app.borrowerId?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {ownershipStyles[app.ownership] && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${ownershipStyles[app.ownership].style}`}>
                          {ownershipStyles[app.ownership].label}
                        </span>
                      )}
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyles[app.status]}`}>
                        {app.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4">
                      <span className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>₹{app.amount.toLocaleString()}</span>
                      <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>{PURPOSE_LABELS[app.purpose]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        app.creditScoreAtApplication >= 650
                          ? isDark ? "bg-green-900/30 text-green-400" : "bg-green-50 text-green-700"
                          : app.creditScoreAtApplication >= 500
                            ? isDark ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-50 text-yellow-700"
                            : isDark ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-700"
                      }`}>Score: {app.creditScoreAtApplication}</span>
                      {app.offers?.filter(o => o.status === "offered").length > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded ${isDark ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-50 text-yellow-700"}`}>
                          {app.offers.filter(o => o.status === "offered").length} offer{app.offers.filter(o => o.status === "offered").length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Detail Panel */}
          {selectedApp && (
            <div className="lg:col-span-3">
              {detailLoading ? (
                <div className={`rounded-2xl p-12 text-center border ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
                  <div className={`w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4 ${isDark ? "border-blue-800 border-t-blue-400" : "border-blue-200 border-t-blue-600"}`} />
                  <p className={isDark ? "text-gray-400" : "text-gray-600"}>Loading...</p>
                </div>
              ) : (
                <div className={`rounded-2xl p-6 sticky top-6 space-y-5 border ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Applicant Profile</h3>
                    <button onClick={() => setSelectedApp(null)} className={`${isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"} transition p-1`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>

                  {/* Borrower Info */}
                  <div className={`flex items-center gap-4 p-4 rounded-xl ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
                    <div className="w-14 h-14 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {selectedApp.loan.borrowerId?.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <h4 className={`font-semibold text-lg ${isDark ? "text-white" : "text-gray-900"}`}>{selectedApp.loan.borrowerId?.name}</h4>
                      <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{selectedApp.loan.borrowerId?.email}</p>
                      <span className={`text-xs px-2 py-0.5 rounded capitalize ${isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-50 text-blue-700"}`}>{selectedApp.loan.borrowerId?.employmentType}</span>
                    </div>
                  </div>

                  {/* Credit Score */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`rounded-xl p-4 text-center ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
                      <div className="relative w-20 h-20 mx-auto mb-2">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r="50" fill="none" stroke={isDark ? "#1f2937" : "#e5e7eb"} strokeWidth="10"/>
                          <circle cx="60" cy="60" r="50" fill="none"
                            stroke={selectedApp.loan.creditScoreAtApplication >= 650 ? "#22c55e" : selectedApp.loan.creditScoreAtApplication >= 500 ? "#eab308" : "#ef4444"}
                            strokeWidth="10" strokeLinecap="round"
                            strokeDasharray={`${(selectedApp.loan.creditScoreAtApplication / 850) * 314} 314`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{selectedApp.loan.creditScoreAtApplication}</span>
                          <span className={`text-[10px] ${isDark ? "text-gray-400" : "text-gray-600"}`}>/ 850</span>
                        </div>
                      </div>
                      <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>Credit Score</p>
                    </div>
                    <div className={`rounded-xl p-4 flex flex-col items-center justify-center ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
                      <span className={`text-xl font-bold px-3 py-1 rounded mb-1 ${
                        selectedApp.loan.riskLevelAtApplication === "LOW"
                          ? isDark ? "bg-green-900/30 text-green-400" : "bg-green-50 text-green-700"
                          : selectedApp.loan.riskLevelAtApplication === "MEDIUM"
                            ? isDark ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-50 text-yellow-700"
                            : isDark ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-700"
                      }`}>{selectedApp.loan.riskLevelAtApplication}</span>
                      <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>Risk Level</p>
                    </div>
                  </div>

                  {/* Loan Details */}
                  <div className={`rounded-xl p-4 ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
                    <h5 className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"} mb-3`}>Loan Request</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className={isDark ? "text-gray-400" : "text-gray-600"}>Amount</span><span className={`${isDark ? "text-white" : "text-gray-900"} font-bold`}>₹{selectedApp.loan.amount.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className={isDark ? "text-gray-400" : "text-gray-600"}>Purpose</span><span className={isDark ? "text-white" : "text-gray-900"}>{PURPOSE_LABELS[selectedApp.loan.purpose]}</span></div>
                      <div className="flex justify-between"><span className={isDark ? "text-gray-400" : "text-gray-600"}>Urgency</span><span className={`capitalize font-medium ${
                        selectedApp.loan.urgencyLevel === "critical" ? "text-red-500" : selectedApp.loan.urgencyLevel === "high" ? "text-orange-500" : "text-yellow-500"
                      }`}>{selectedApp.loan.urgencyLevel}</span></div>
                    </div>
                    <div className={`mt-3 p-3 rounded-lg ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
                      <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>{selectedApp.loan.purposeDescription}</p>
                    </div>
                  </div>

                  {/* My Offer Status */}
                  {selectedApp.loan.myOffer && selectedApp.loan.myOffer.status === "offered" && (
                    <div className={`rounded-xl p-4 border ${isDark ? "bg-yellow-900/10 border-yellow-800" : "bg-yellow-50 border-yellow-200"}`}>
                      <h5 className={`text-sm font-semibold mb-2 ${isDark ? "text-yellow-400" : "text-yellow-700"}`}>Your Offer (Pending)</h5>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div><span className={`${isDark ? "text-gray-400" : "text-gray-600"} block`}>Rate</span><span className={`${isDark ? "text-white" : "text-gray-900"} font-bold`}>{selectedApp.loan.myOffer.interestRate}%</span></div>
                        <div><span className={`${isDark ? "text-gray-400" : "text-gray-600"} block`}>EMI</span><span className={`${isDark ? "text-white" : "text-gray-900"} font-bold`}>₹{selectedApp.loan.myOffer.monthlyEmi.toLocaleString()}</span></div>
                        <div><span className={`${isDark ? "text-gray-400" : "text-gray-600"} block`}>Term</span><span className={`${isDark ? "text-white" : "text-gray-900"} font-bold`}>{selectedApp.loan.myOffer.repaymentTermMonths}mo</span></div>
                      </div>
                      <button
                        onClick={handleWithdraw}
                        disabled={actionLoading}
                        className={`mt-3 w-full py-2 rounded-lg text-sm font-medium transition border ${isDark ? "bg-gray-800 hover:bg-red-900/30 text-gray-400 hover:text-red-400 border-gray-700" : "bg-white hover:bg-red-50 text-gray-600 hover:text-red-600 border-gray-200"}`}
                      >{actionLoading ? "..." : "Withdraw Offer"}</button>
                    </div>
                  )}

                  {selectedApp.loan.myOffer && selectedApp.loan.myOffer.status === "borrower_rejected" && (
                    <div className={`rounded-xl p-3 text-center border ${isDark ? "bg-red-900/20 border-red-800" : "bg-red-50 border-red-200"}`}>
                      <p className={`text-sm font-medium ${isDark ? "text-red-400" : "text-red-700"}`}>Borrower rejected your offer</p>
                    </div>
                  )}

                  {selectedApp.loan.myOffer && selectedApp.loan.myOffer.status === "accepted" && (
                    <div className={`rounded-xl p-3 text-center border ${isDark ? "bg-green-900/20 border-green-800" : "bg-green-50 border-green-200"}`}>
                      <p className={`text-sm font-medium ${isDark ? "text-green-400" : "text-green-700"}`}>Your offer was accepted!</p>
                    </div>
                  )}

                  {/* EMI schedule */}
                  {selectedApp.loan.monthlyEmi > 0 && (
                    <div className={`rounded-xl p-4 ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
                      <h5 className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"} mb-3`}>Repayment Schedule</h5>
                      <div className="grid grid-cols-3 gap-3">
                        <div className={`p-2 rounded-lg text-center ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
                          <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>EMI</p>
                          <p className={`font-bold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>₹{selectedApp.loan.monthlyEmi.toLocaleString()}</p>
                        </div>
                        <div className={`p-2 rounded-lg text-center ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
                          <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>Term</p>
                          <p className={`font-bold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>{selectedApp.loan.repaymentTermMonths}mo</p>
                        </div>
                        <div className={`p-2 rounded-lg text-center ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
                          <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>Due</p>
                          <p className={`font-bold text-xs ${isDark ? "text-white" : "text-gray-900"}`}>{new Date(selectedApp.loan.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Repayment Progress */}
                  {["disbursed", "repaid", "defaulted"].includes(selectedApp.loan.status) && selectedApp.loan.totalRepayable > 0 && (
                    <div className={`rounded-xl p-4 ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
                      <div className="flex justify-between text-xs mb-2">
                        <span className={isDark ? "text-gray-400" : "text-gray-600"}>₹{(selectedApp.loan.totalRepaid || 0).toLocaleString()} confirmed</span>
                        <span className={isDark ? "text-gray-400" : "text-gray-600"}>₹{selectedApp.loan.totalRepayable.toLocaleString()} total</span>
                      </div>
                      <div className={`w-full rounded-full h-3 ${isDark ? "bg-gray-700" : "bg-gray-200"}`}>
                        <div className={`h-3 rounded-full ${selectedApp.loan.status === "repaid" ? "bg-emerald-500" : selectedApp.loan.status === "defaulted" ? "bg-red-500" : "bg-blue-600"}`}
                          style={{ width: `${Math.min(((selectedApp.loan.totalRepaid || 0) / selectedApp.loan.totalRepayable) * 100, 100)}%` }} />
                      </div>

                      {/* Payment requests */}
                      {selectedApp.loan.repaymentHistory?.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className={`text-xs font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>Payment Requests</p>
                          {selectedApp.loan.repaymentHistory.map((p, i) => (
                            <div key={i} className={`p-3 rounded-lg border ${
                              p.status === "pending_confirmation"
                                ? isDark ? "bg-yellow-900/10 border-yellow-800" : "bg-yellow-50 border-yellow-200"
                                : p.status === "confirmed"
                                  ? isDark ? "bg-green-900/10 border-green-800" : "bg-green-50 border-green-200"
                                  : isDark ? "bg-red-900/10 border-red-800" : "bg-red-50 border-red-200"
                            }`}>
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span className={`font-bold text-sm ${
                                    p.status === "confirmed" ? "text-green-500" :
                                    p.status === "rejected" ? "text-red-500 line-through" : isDark ? "text-yellow-400" : "text-yellow-700"
                                  }`}>₹{p.amount.toLocaleString()}</span>
                                  <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>{p.method?.replace("_", " ")}</span>
                                  {p.reference && <span className={`text-xs ${isDark ? "text-gray-600" : "text-gray-400"}`}>#{p.reference}</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    p.status === "pending_confirmation"
                                      ? isDark ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-50 text-yellow-700"
                                      : p.status === "confirmed"
                                        ? isDark ? "bg-green-900/30 text-green-400" : "bg-green-50 text-green-700"
                                        : isDark ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-700"
                                  }`}>
                                    {p.status === "pending_confirmation" ? "PENDING" :
                                     p.status === "confirmed" ? "CONFIRMED" : "REJECTED"}
                                  </span>
                                  <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>{new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                                </div>
                              </div>

                              {/* Confirm/Reject buttons */}
                              {p.status === "pending_confirmation" && selectedApp.loan.ownership === "yours" && (
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={async () => {
                                      setActionLoading(true);
                                      try {
                                        await lenderApi.put(`/api/lender/applications/${selectedApp.loan._id}/confirm-payment/${p._id}`);
                                        setActionMessage({ type: "success", text: `₹${p.amount.toLocaleString()} confirmed!` });
                                        viewDetail(selectedApp.loan._id);
                                        fetchData();
                                      } catch (err) { setActionMessage({ type: "error", text: err.response?.data?.error || "Failed" }); }
                                      finally { setActionLoading(false); }
                                    }}
                                    disabled={actionLoading}
                                    className="flex-1 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                                  >{actionLoading ? "..." : "Confirm Payment"}</button>
                                  <button
                                    onClick={async () => {
                                      if (!confirm("Reject this payment?")) return;
                                      setActionLoading(true);
                                      try {
                                        await lenderApi.put(`/api/lender/applications/${selectedApp.loan._id}/reject-payment/${p._id}`);
                                        setActionMessage({ type: "success", text: "Payment rejected." });
                                        viewDetail(selectedApp.loan._id);
                                        fetchData();
                                      } catch (err) { setActionMessage({ type: "error", text: err.response?.data?.error || "Failed" }); }
                                      finally { setActionLoading(false); }
                                    }}
                                    disabled={actionLoading}
                                    className={`py-1.5 px-3 rounded-lg text-xs transition disabled:opacity-50 border ${isDark ? "bg-gray-900 hover:bg-red-900/30 text-gray-400 hover:text-red-400 border-gray-700" : "bg-white hover:bg-red-50 text-gray-600 hover:text-red-400 border-gray-200"}`}
                                  >Reject</button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {selectedApp.loan.status === "pending" && selectedApp.loan.ownership === "open" && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setOfferForm({ interestRate: "", repaymentTermMonths: "", offeredAmount: String(selectedApp.loan.amount), lenderNotes: "" });
                          setShowOfferModal(true);
                        }}
                        className="flex-1 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-semibold transition-all shadow-lg"
                      >Make Offer</button>
                      <button onClick={handlePass} disabled={actionLoading}
                        className={`py-3 px-4 rounded-xl font-medium text-sm transition border ${isDark ? "bg-gray-800 hover:bg-gray-700 text-gray-400 border-gray-700" : "bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-200"}`}
                      >Pass</button>
                    </div>
                  )}

                  {selectedApp.loan.status === "approved" && selectedApp.loan.ownership === "yours" && (
                    <button
                      onClick={async () => {
                        setActionLoading(true);
                        try {
                          await lenderApi.put(`/api/lender/applications/${selectedApp.loan._id}/disburse`);
                          setActionMessage({ type: "success", text: "Loan disbursed!" });
                          setSelectedApp(null); fetchData();
                        } catch (err) {
                          setActionMessage({ type: "error", text: err.response?.data?.error || "Failed" });
                        } finally { setActionLoading(false); }
                      }}
                      disabled={actionLoading}
                      className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50"
                    >{actionLoading ? "..." : `Disburse ₹${selectedApp.loan.approvedAmount?.toLocaleString()}`}</button>
                  )}

                  {selectedApp.loan.status === "disbursed" && selectedApp.loan.ownership === "yours" && (
                    <button
                      onClick={async () => {
                        if (!confirm("Mark as defaulted?")) return;
                        setActionLoading(true);
                        try {
                          await lenderApi.put(`/api/lender/applications/${selectedApp.loan._id}/default`);
                          setActionMessage({ type: "success", text: "Defaulted." });
                          setSelectedApp(null); fetchData();
                        } catch (err) { setActionMessage({ type: "error", text: err.response?.data?.error || "Failed" }); }
                        finally { setActionLoading(false); }
                      }}
                      className={`w-full py-2.5 rounded-xl text-sm font-medium transition border ${isDark ? "bg-gray-800 hover:bg-red-900/30 text-gray-400 hover:text-red-400 border-gray-700" : "bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 border-gray-200"}`}
                    >Mark as Defaulted</button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Make Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-md shadow-2xl border ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
            <h3 className={`text-lg font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>Make Offer</h3>
            <p className={`text-xs mb-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}>The borrower will review your terms and decide whether to accept.</p>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Interest Rate (% per annum)</label>
                <input type="number" value={offerForm.interestRate}
                  onChange={(e) => setOfferForm({ ...offerForm, interestRate: e.target.value })}
                  placeholder="e.g. 12" min="1" max="36" step="0.5"
                  className={`w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition text-sm ${isDark ? "bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500" : "border-gray-200 text-gray-700"}`} required />
              </div>
              <div>
                <label className={`block text-sm mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Repayment Term (Months)</label>
                <input type="number" value={offerForm.repaymentTermMonths}
                  onChange={(e) => setOfferForm({ ...offerForm, repaymentTermMonths: e.target.value })}
                  placeholder="e.g. 6" min="1" max="36"
                  className={`w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition text-sm ${isDark ? "bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500" : "border-gray-200 text-gray-700"}`} required />
              </div>
              <div>
                <label className={`block text-sm mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Offer Amount (₹)</label>
                <input type="number" value={offerForm.offeredAmount}
                  onChange={(e) => setOfferForm({ ...offerForm, offeredAmount: e.target.value })}
                  min="1000"
                  className={`w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition text-sm ${isDark ? "bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500" : "border-gray-200 text-gray-700"}`} />
              </div>
              <div>
                <label className={`block text-sm mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Notes (optional)</label>
                <textarea value={offerForm.lenderNotes}
                  onChange={(e) => setOfferForm({ ...offerForm, lenderNotes: e.target.value })}
                  rows={2} placeholder="Why your offer is competitive..."
                  className={`w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition text-sm resize-none ${isDark ? "bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500" : "border-gray-200 text-gray-700"}`} />
              </div>
              {/* Live EMI preview */}
              {offerForm.interestRate && offerForm.repaymentTermMonths && (
                <div className={`p-3 rounded-lg text-center border ${isDark ? "bg-blue-900/20 border-blue-800" : "bg-blue-50 border-blue-200"}`}>
                  <p className={`text-xs ${isDark ? "text-blue-400" : "text-blue-700"}`}>Estimated EMI</p>
                  <p className={`font-bold text-lg ${isDark ? "text-white" : "text-gray-900"}`}>₹{Math.round(
                    (Number(offerForm.offeredAmount || selectedApp?.loan.amount) + (Number(offerForm.offeredAmount || selectedApp?.loan.amount) * Number(offerForm.interestRate) * Number(offerForm.repaymentTermMonths)) / (12 * 100)) / Number(offerForm.repaymentTermMonths)
                  ).toLocaleString()}/mo</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowOfferModal(false)} className={`flex-1 py-2.5 rounded-xl font-medium transition ${isDark ? "bg-gray-800 hover:bg-gray-700 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}>Cancel</button>
              <button onClick={handleMakeOffer} disabled={actionLoading || !offerForm.interestRate || !offerForm.repaymentTermMonths}
                className="flex-1 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-semibold transition disabled:opacity-40"
              >{actionLoading ? "Sending..." : "Send Offer"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
