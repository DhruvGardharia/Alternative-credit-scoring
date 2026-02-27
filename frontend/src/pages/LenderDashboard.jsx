import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLenderAuth } from "../context/LenderAuthContext";
import axios from "axios";

const STATUS_STYLES = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  approved: "bg-green-500/20 text-green-400 border-green-500/40",
  disbursed: "bg-purple-500/20 text-purple-400 border-purple-500/40",
  repaid: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  defaulted: "bg-gray-500/20 text-gray-400 border-gray-500/40",
  cancelled: "bg-gray-500/20 text-gray-400 border-gray-500/40"
};

const OWNERSHIP_STYLES = {
  open: { label: "OPEN", style: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  offer_sent: { label: "OFFER SENT", style: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  yours: { label: "YOURS", style: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" }
};

const PURPOSE_LABELS = {
  medical: "🏥 Medical", vehicle_repair: "🔧 Vehicle Repair", family_emergency: "👪 Family Emergency",
  rent: "🏠 Rent", equipment: "🛠️ Equipment", education: "📚 Education", other: "📋 Other"
};

export default function LenderDashboard() {
  const { lender, lenderToken, isLenderAuthenticated, loading: authLoading, lenderLogout } = useLenderAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });

  const [offerForm, setOfferForm] = useState({
    interestRate: "", repaymentTermMonths: "", offeredAmount: "", lenderNotes: ""
  });
  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "bank_transfer", reference: "", note: "" });

  const lenderApi = axios.create({ headers: { Authorization: `Bearer ${lenderToken}` } });

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
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950">
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-gray-400 text-lg">Loading lender dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950">
      {/* Top Bar */}
      <div className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">Lender Portal</h2>
              <p className="text-gray-500 text-xs">{lender?.organization}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-white text-sm font-medium">{lender?.name}</p>
              <p className="text-gray-500 text-xs">{lender?.email}</p>
            </div>
            <button
              onClick={() => { lenderLogout(); navigate("/lender-login"); }}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium transition"
            >Logout</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Loan Marketplace</h1>
          <p className="text-gray-400">Browse loan requests, make offers, and manage your portfolio</p>
        </div>

        {/* Action Message */}
        {actionMessage.text && (
          <div className={`mb-6 p-4 rounded-xl border text-sm font-medium ${
            actionMessage.type === "success"
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}>
            {actionMessage.text}
            <button onClick={() => setActionMessage({ type: "", text: "" })} className="float-right text-current opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
            {[
              { label: "Open", value: stats.openPendingCount, icon: "🔓", color: "text-cyan-400" },
              { label: "My Offers", value: stats.myOffersCount, icon: "📤", color: "text-amber-400" },
              { label: "Approved", value: stats.approvedCount, icon: "✅", color: "text-green-400" },
              { label: "Disbursed", value: stats.disbursedCount, icon: "💸", color: "text-purple-400" },
              { label: "Repaid", value: stats.repaidCount, icon: "💚", color: "text-emerald-400" },
              { label: "Defaulted", value: stats.defaultedCount, icon: "⚠️", color: "text-red-400" },
              { label: "Portfolio", value: `₹${((stats.totalApprovedAmount || 0) / 1000).toFixed(0)}K`, icon: "💰", color: "text-indigo-400" }
            ].map((s, i) => (
              <div key={i} className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">{s.icon}</span>
                  <span className="text-gray-400 text-xs">{s.label}</span>
                </div>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: "all", label: "All" },
            { key: "pending", label: "🔓 Open" },
            { key: "offered", label: "📤 My Offers" },
            { key: "approved", label: "✅ Approved" },
            { key: "disbursed", label: "💸 Disbursed" },
            { key: "repaid", label: "💚 Repaid" }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterStatus === key
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                  : "bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white"
              }`}
            >{label}</button>
          ))}
        </div>

        {/* List + Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Application List */}
          <div className={`${selectedApp ? "lg:col-span-2" : "lg:col-span-5"} space-y-3`}>
            {applications.length === 0 ? (
              <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-12 text-center">
                <p className="text-gray-400 text-lg">No applications found</p>
              </div>
            ) : (
              applications.map((app) => (
                <div
                  key={app._id}
                  onClick={() => viewDetail(app._id)}
                  className={`bg-gray-800/40 backdrop-blur-xl border rounded-xl p-4 cursor-pointer hover:bg-gray-800/60 transition-all ${
                    selectedApp?.loan?._id === app._id
                      ? "border-indigo-500/50 shadow-lg shadow-indigo-500/10"
                      : "border-gray-700/50 hover:border-gray-600/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {app.borrowerId?.name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <h4 className="text-white font-semibold text-sm">{app.borrowerId?.name || "Unknown"}</h4>
                        <p className="text-gray-500 text-xs">{app.borrowerId?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {OWNERSHIP_STYLES[app.ownership] && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${OWNERSHIP_STYLES[app.ownership].style}`}>
                          {OWNERSHIP_STYLES[app.ownership].label}
                        </span>
                      )}
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLES[app.status]}`}>
                        {app.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4">
                      <span className="text-white font-bold">₹{app.amount.toLocaleString()}</span>
                      <span className="text-gray-400 text-xs">{PURPOSE_LABELS[app.purpose]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        app.creditScoreAtApplication >= 650 ? "bg-green-500/20 text-green-400" :
                        app.creditScoreAtApplication >= 500 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"
                      }`}>Score: {app.creditScoreAtApplication}</span>
                      {app.offers?.filter(o => o.status === "offered").length > 0 && (
                        <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
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
                <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-12 text-center">
                  <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">Loading...</p>
                </div>
              ) : (
                <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 sticky top-6 space-y-5">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">Applicant Profile</h3>
                    <button onClick={() => setSelectedApp(null)} className="text-gray-400 hover:text-white transition p-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>

                  {/* Borrower Info */}
                  <div className="flex items-center gap-4 p-4 bg-gray-900/40 rounded-xl">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {selectedApp.loan.borrowerId?.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <h4 className="text-white font-semibold text-lg">{selectedApp.loan.borrowerId?.name}</h4>
                      <p className="text-gray-400 text-sm">{selectedApp.loan.borrowerId?.email}</p>
                      <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded capitalize">{selectedApp.loan.borrowerId?.employmentType}</span>
                    </div>
                  </div>

                  {/* Credit Score */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-900/40 rounded-xl p-4 text-center">
                      <div className="relative w-20 h-20 mx-auto mb-2">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r="50" fill="none" stroke="#1f2937" strokeWidth="10"/>
                          <circle cx="60" cy="60" r="50" fill="none"
                            stroke={selectedApp.loan.creditScoreAtApplication >= 650 ? "#22c55e" : selectedApp.loan.creditScoreAtApplication >= 500 ? "#eab308" : "#ef4444"}
                            strokeWidth="10" strokeLinecap="round"
                            strokeDasharray={`${(selectedApp.loan.creditScoreAtApplication / 850) * 314} 314`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xl font-bold text-white">{selectedApp.loan.creditScoreAtApplication}</span>
                          <span className="text-[10px] text-gray-400">/ 850</span>
                        </div>
                      </div>
                      <p className="text-gray-400 text-xs">Credit Score</p>
                    </div>
                    <div className="bg-gray-900/40 rounded-xl p-4 flex flex-col items-center justify-center">
                      <span className={`text-xl font-bold px-3 py-1 rounded mb-1 ${
                        selectedApp.loan.riskLevelAtApplication === "LOW" ? "bg-green-500/20 text-green-400" :
                        selectedApp.loan.riskLevelAtApplication === "MEDIUM" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"
                      }`}>{selectedApp.loan.riskLevelAtApplication}</span>
                      <p className="text-gray-400 text-xs">Risk Level</p>
                    </div>
                  </div>

                  {/* Loan Details */}
                  <div className="bg-gray-900/40 rounded-xl p-4">
                    <h5 className="text-sm font-semibold text-gray-300 mb-3">Loan Request</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-400">Amount</span><span className="text-white font-bold">₹{selectedApp.loan.amount.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Purpose</span><span className="text-white">{PURPOSE_LABELS[selectedApp.loan.purpose]}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Urgency</span><span className={`capitalize font-medium ${
                        selectedApp.loan.urgencyLevel === "critical" ? "text-red-400" : selectedApp.loan.urgencyLevel === "high" ? "text-orange-400" : "text-yellow-400"
                      }`}>{selectedApp.loan.urgencyLevel}</span></div>
                    </div>
                    <div className="mt-3 p-3 bg-gray-800/50 rounded-lg">
                      <p className="text-gray-300 text-sm">{selectedApp.loan.purposeDescription}</p>
                    </div>
                  </div>

                  {/* My Offer Status (if I already sent an offer) */}
                  {selectedApp.loan.myOffer && selectedApp.loan.myOffer.status === "offered" && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                      <h5 className="text-sm font-semibold text-amber-400 mb-2">📤 Your Offer (Pending)</h5>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div><span className="text-gray-400 block">Rate</span><span className="text-white font-bold">{selectedApp.loan.myOffer.interestRate}%</span></div>
                        <div><span className="text-gray-400 block">EMI</span><span className="text-white font-bold">₹{selectedApp.loan.myOffer.monthlyEmi.toLocaleString()}</span></div>
                        <div><span className="text-gray-400 block">Term</span><span className="text-white font-bold">{selectedApp.loan.myOffer.repaymentTermMonths}mo</span></div>
                      </div>
                      <button
                        onClick={handleWithdraw}
                        disabled={actionLoading}
                        className="mt-3 w-full py-2 bg-gray-700/50 hover:bg-red-600/20 text-gray-400 hover:text-red-400 border border-gray-600/50 rounded-lg text-sm font-medium transition"
                      >{actionLoading ? "..." : "Withdraw Offer"}</button>
                    </div>
                  )}

                  {selectedApp.loan.myOffer && selectedApp.loan.myOffer.status === "borrower_rejected" && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
                      <p className="text-red-400 text-sm font-medium">❌ Borrower rejected your offer</p>
                    </div>
                  )}

                  {selectedApp.loan.myOffer && selectedApp.loan.myOffer.status === "accepted" && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center">
                      <p className="text-green-400 text-sm font-medium">✅ Your offer was accepted!</p>
                    </div>
                  )}

                  {/* EMI schedule (for approved+ loans) */}
                  {selectedApp.loan.monthlyEmi > 0 && (
                    <div className="bg-gray-900/40 rounded-xl p-4">
                      <h5 className="text-sm font-semibold text-gray-300 mb-3">Repayment Schedule</h5>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gray-800/50 p-2 rounded-lg text-center">
                          <p className="text-gray-500 text-xs">EMI</p>
                          <p className="text-white font-bold text-sm">₹{selectedApp.loan.monthlyEmi.toLocaleString()}</p>
                        </div>
                        <div className="bg-gray-800/50 p-2 rounded-lg text-center">
                          <p className="text-gray-500 text-xs">Term</p>
                          <p className="text-white font-bold text-sm">{selectedApp.loan.repaymentTermMonths}mo</p>
                        </div>
                        <div className="bg-gray-800/50 p-2 rounded-lg text-center">
                          <p className="text-gray-500 text-xs">Due</p>
                          <p className="text-white font-bold text-xs">{new Date(selectedApp.loan.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Repayment Progress + Pending Payments */}
                  {["disbursed", "repaid", "defaulted"].includes(selectedApp.loan.status) && selectedApp.loan.totalRepayable > 0 && (
                    <div className="bg-gray-900/40 rounded-xl p-4">
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-gray-400">₹{(selectedApp.loan.totalRepaid || 0).toLocaleString()} confirmed</span>
                        <span className="text-gray-400">₹{selectedApp.loan.totalRepayable.toLocaleString()} total</span>
                      </div>
                      <div className="w-full bg-gray-700/50 rounded-full h-3">
                        <div className={`h-3 rounded-full ${selectedApp.loan.status === "repaid" ? "bg-emerald-500" : selectedApp.loan.status === "defaulted" ? "bg-red-500" : "bg-indigo-500"}`}
                          style={{ width: `${Math.min(((selectedApp.loan.totalRepaid || 0) / selectedApp.loan.totalRepayable) * 100, 100)}%` }} />
                      </div>

                      {/* Payment requests from borrower */}
                      {selectedApp.loan.repaymentHistory?.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs text-gray-400 font-medium">Payment Requests</p>
                          {selectedApp.loan.repaymentHistory.map((p, i) => (
                            <div key={i} className={`p-3 rounded-lg border ${
                              p.status === "pending_confirmation" ? "bg-amber-500/5 border-amber-500/30" :
                              p.status === "confirmed" ? "bg-green-500/5 border-green-500/20" :
                              "bg-red-500/5 border-red-500/20"
                            }`}>
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span className={`font-bold text-sm ${
                                    p.status === "confirmed" ? "text-green-400" :
                                    p.status === "rejected" ? "text-red-400 line-through" : "text-amber-400"
                                  }`}>₹{p.amount.toLocaleString()}</span>
                                  <span className="text-gray-500 text-xs">{p.method?.replace("_", " ")}</span>
                                  {p.reference && <span className="text-gray-600 text-xs">#{p.reference}</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    p.status === "pending_confirmation" ? "bg-amber-500/20 text-amber-400" :
                                    p.status === "confirmed" ? "bg-green-500/20 text-green-400" :
                                    "bg-red-500/20 text-red-400"
                                  }`}>
                                    {p.status === "pending_confirmation" ? "⏳ PENDING" :
                                     p.status === "confirmed" ? "✅ CONFIRMED" : "❌ REJECTED"}
                                  </span>
                                  <span className="text-gray-500 text-xs">{new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                                </div>
                              </div>

                              {/* Confirm/Reject buttons for pending payments */}
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
                                    className="flex-1 py-1.5 bg-green-600/80 hover:bg-green-600 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                                  >{actionLoading ? "..." : "✅ Confirm Payment"}</button>
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
                                    className="py-1.5 px-3 bg-gray-700/50 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-gray-600/50 rounded-lg text-xs transition disabled:opacity-50"
                                  >❌ Reject</button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}

                  {/* Open loan: Make Offer / Pass */}
                  {selectedApp.loan.status === "pending" && selectedApp.loan.ownership === "open" && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setOfferForm({ interestRate: "", repaymentTermMonths: "", offeredAmount: String(selectedApp.loan.amount), lenderNotes: "" });
                          setShowOfferModal(true);
                        }}
                        className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/20"
                      >📤 Make Offer</button>
                      <button onClick={handlePass} disabled={actionLoading}
                        className="py-3 px-4 bg-gray-700/50 hover:bg-gray-600/50 text-gray-400 border border-gray-600/50 rounded-xl font-medium text-sm transition"
                      >Pass</button>
                    </div>
                  )}

                  {/* Approved (yours): Disburse */}
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
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-600/20 disabled:opacity-50"
                    >{actionLoading ? "..." : `💸 Disburse ₹${selectedApp.loan.approvedAmount?.toLocaleString()}`}</button>
                  )}

                  {/* Disbursed (yours): Mark Default only — payments come from gig worker */}
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
                      className="w-full py-2.5 bg-gray-700/50 hover:bg-red-600/20 text-gray-400 hover:text-red-400 border border-gray-600/50 rounded-xl text-sm font-medium transition"
                    >⚠️ Mark as Defaulted</button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Make Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">📤 Make Offer</h3>
            <p className="text-gray-400 text-xs mb-4">The borrower will review your terms and decide whether to accept.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Interest Rate (% per annum)</label>
                <input type="number" value={offerForm.interestRate}
                  onChange={(e) => setOfferForm({ ...offerForm, interestRate: e.target.value })}
                  placeholder="e.g. 12" min="1" max="36" step="0.5"
                  className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" required />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Repayment Term (Months)</label>
                <input type="number" value={offerForm.repaymentTermMonths}
                  onChange={(e) => setOfferForm({ ...offerForm, repaymentTermMonths: e.target.value })}
                  placeholder="e.g. 6" min="1" max="36"
                  className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" required />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Offer Amount (₹)</label>
                <input type="number" value={offerForm.offeredAmount}
                  onChange={(e) => setOfferForm({ ...offerForm, offeredAmount: e.target.value })}
                  min="1000"
                  className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Notes (optional)</label>
                <textarea value={offerForm.lenderNotes}
                  onChange={(e) => setOfferForm({ ...offerForm, lenderNotes: e.target.value })}
                  rows={2} placeholder="Why your offer is competitive..."
                  className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none" />
              </div>
              {/* Live EMI preview */}
              {offerForm.interestRate && offerForm.repaymentTermMonths && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
                  <p className="text-blue-400 text-xs">Estimated EMI</p>
                  <p className="text-white font-bold text-lg">₹{Math.round(
                    (Number(offerForm.offeredAmount || selectedApp?.loan.amount) + (Number(offerForm.offeredAmount || selectedApp?.loan.amount) * Number(offerForm.interestRate) * Number(offerForm.repaymentTermMonths)) / (12 * 100)) / Number(offerForm.repaymentTermMonths)
                  ).toLocaleString()}/mo</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowOfferModal(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition">Cancel</button>
              <button onClick={handleMakeOffer} disabled={actionLoading || !offerForm.interestRate || !offerForm.repaymentTermMonths}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-40"
              >{actionLoading ? "Sending..." : "Send Offer"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
