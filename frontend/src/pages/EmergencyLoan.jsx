import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import axios from "axios";

const PURPOSE_OPTIONS = [
  { value: "medical", label: "🏥 Medical Emergency", color: "text-red-400" },
  { value: "vehicle_repair", label: "🔧 Vehicle Repair", color: "text-orange-400" },
  { value: "family_emergency", label: "👪 Family Emergency", color: "text-pink-400" },
  { value: "rent", label: "🏠 Rent / Housing", color: "text-blue-400" },
  { value: "equipment", label: "🛠️ Equipment Purchase", color: "text-yellow-400" },
  { value: "education", label: "📚 Education", color: "text-green-400" },
  { value: "other", label: "📋 Other", color: "text-gray-400" }
];

const URGENCY_OPTIONS = [
  { value: "critical", label: "Critical — Need within 24hrs", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { value: "high", label: "High — Need within 3 days", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  { value: "medium", label: "Medium — Need within a week", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" }
];

const STATUS_STYLES = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  under_review: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  approved: "bg-green-500/20 text-green-400 border-green-500/40",
  rejected: "bg-red-500/20 text-red-400 border-red-500/40",
  disbursed: "bg-purple-500/20 text-purple-400 border-purple-500/40",
  repaid: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  defaulted: "bg-gray-500/20 text-gray-400 border-gray-500/40"
};

export default function EmergencyLoan() {
  const { user } = useAuth();
  const [tab, setTab] = useState("apply"); // apply | history
  const [eligibility, setEligibility] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [offerActionLoading, setOfferActionLoading] = useState(null); // offerId being acted on
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Form state
  const [form, setForm] = useState({
    amount: "",
    purpose: "",
    purposeDescription: "",
    urgencyLevel: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eligRes, loansRes] = await Promise.all([
        axios.get("/api/loans/eligibility"),
        axios.get("/api/loans/my-loans")
      ]);
      setEligibility(eligRes.data.data);
      setLoans(loansRes.data.data);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (loanId, offerId, orgName) => {
    if (!confirm(`Accept offer from ${orgName}? This will finalize your loan with them.`)) return;
    setOfferActionLoading(offerId);
    try {
      await axios.put(`/api/loans/${loanId}/offers/${offerId}/accept`);
      setSuccess(`✅ Offer from ${orgName} accepted! Your loan is now approved.`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to accept offer");
    } finally {
      setOfferActionLoading(null);
    }
  };

  const handleRejectOffer = async (loanId, offerId, orgName) => {
    if (!confirm(`Reject offer from ${orgName}? Your loan stays open for other lenders.`)) return;
    setOfferActionLoading(offerId);
    try {
      await axios.put(`/api/loans/${loanId}/offers/${offerId}/reject`);
      setSuccess(`Offer from ${orgName} rejected. Your loan stays open for other offers.`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reject offer");
    } finally {
      setOfferActionLoading(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await axios.post("/api/loans/apply", {
        amount: Number(form.amount),
        purpose: form.purpose,
        purposeDescription: form.purposeDescription,
        urgencyLevel: form.urgencyLevel
      });

      setSuccess("🎉 Application submitted! Lenders will make offers on your loan — you decide which to accept.");
      setForm({ amount: "", purpose: "", purposeDescription: "", urgencyLevel: "" });
      fetchData();
      setTimeout(() => setTab("history"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-gray-400 text-lg">Loading loan details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Emergency Loan</h1>
              <p className="text-gray-400">Quick financing for gig workers based on your credit profile</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-gray-800/50 rounded-xl mb-8 w-fit">
          <button
            onClick={() => setTab("apply")}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
              tab === "apply"
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/25"
                : "text-gray-400 hover:text-white hover:bg-gray-700/50"
            }`}
          >
            Apply for Loan
          </button>
          <button
            onClick={() => setTab("history")}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
              tab === "history"
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/25"
                : "text-gray-400 hover:text-white hover:bg-gray-700/50"
            }`}
          >
            My Loans
            {loans.length > 0 && (
              <span className="px-2 py-0.5 bg-blue-500/30 text-blue-300 rounded-full text-xs">{loans.length}</span>
            )}
          </button>
        </div>

        {/* Apply Tab */}
        {tab === "apply" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Eligibility Card */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 sticky top-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                  Your Eligibility
                </h3>

                {eligibility ? (
                  <div className="space-y-4">
                    {/* Credit Score Gauge */}
                    <div className="text-center py-4">
                      <div className="relative w-32 h-32 mx-auto">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r="50" fill="none" stroke="#1f2937" strokeWidth="10"/>
                          <circle
                            cx="60" cy="60" r="50" fill="none"
                            stroke={eligibility.creditScore >= 650 ? "#22c55e" : eligibility.creditScore >= 500 ? "#eab308" : "#ef4444"}
                            strokeWidth="10" strokeLinecap="round"
                            strokeDasharray={`${(eligibility.creditScore / 850) * 314} 314`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold text-white">{eligibility.creditScore}</span>
                          <span className="text-xs text-gray-400">/ 850</span>
                        </div>
                      </div>
                    </div>

                    {/* Eligibility Status */}
                    <div className={`p-3 rounded-xl border text-center font-medium ${
                      eligibility.eligible
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : "bg-red-500/10 border-red-500/30 text-red-400"
                    }`}>
                      {eligibility.eligible ? "✅ Eligible for Loan" : "❌ Not Eligible"}
                    </div>

                    {/* Stats */}
                    {eligibility.eligible && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
                          <span className="text-gray-400 text-sm">Max Amount</span>
                          <span className="text-white font-bold text-lg">₹{eligibility.maxAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
                          <span className="text-gray-400 text-sm">Interest Rate</span>
                          <span className="text-white font-semibold">{eligibility.suggestedInterestRate}%</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
                          <span className="text-gray-400 text-sm">Risk Level</span>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            eligibility.riskLevel === "LOW" ? "bg-green-500/20 text-green-400" :
                            eligibility.riskLevel === "MEDIUM" ? "bg-yellow-500/20 text-yellow-400" :
                            "bg-red-500/20 text-red-400"
                          }`}>{eligibility.riskLevel}</span>
                        </div>
                      </div>
                    )}

                    {/* Reasons */}
                    {eligibility.reasons.length > 0 && (
                      <div className="pt-3 border-t border-gray-700/50">
                        {eligibility.reasons.map((r, i) => (
                          <p key={i} className="text-xs text-gray-400 flex items-start gap-1.5 mb-1.5">
                            <span className="text-blue-400 mt-0.5">ℹ</span> {r}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Unable to check eligibility</p>
                )}
              </div>
            </div>

            {/* Application Form */}
            <div className="lg:col-span-2">
              <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  Loan Application
                </h3>

                {!eligibility?.eligible ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                      </svg>
                    </div>
                    <h4 className="text-white font-semibold text-lg mb-2">Not Eligible Yet</h4>
                    <p className="text-gray-400">Complete your credit analysis first to check loan eligibility.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Loan Amount (₹)</label>
                      <input
                        type="number"
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                        min="1000"
                        max={eligibility.maxAmount}
                        placeholder={`₹1,000 — ₹${eligibility.maxAmount.toLocaleString()}`}
                        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
                        required
                      />
                      <p className="mt-1.5 text-xs text-gray-500">Max eligible: ₹{eligibility.maxAmount.toLocaleString()}</p>
                    </div>

                    {/* Purpose */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Purpose</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {PURPOSE_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setForm({ ...form, purpose: opt.value })}
                            className={`p-3 rounded-xl border text-sm font-medium transition-all duration-200 text-left ${
                              form.purpose === opt.value
                                ? "bg-blue-600/20 border-blue-500/50 text-blue-300 shadow-lg shadow-blue-500/10"
                                : "bg-gray-800/50 border-gray-700/50 text-gray-400 hover:border-gray-600 hover:text-gray-300"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Describe your need</label>
                      <textarea
                        value={form.purposeDescription}
                        onChange={(e) => setForm({ ...form, purposeDescription: e.target.value })}
                        rows={3}
                        maxLength={500}
                        placeholder="Briefly describe why you need this emergency loan..."
                        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition resize-none"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500 text-right">{form.purposeDescription.length}/500</p>
                    </div>

                    {/* Urgency */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Urgency Level</label>
                      <div className="space-y-2">
                        {URGENCY_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setForm({ ...form, urgencyLevel: opt.value })}
                            className={`w-full p-3 rounded-xl border text-sm font-medium transition-all duration-200 text-left ${
                              form.urgencyLevel === opt.value
                                ? opt.color + " shadow-lg"
                                : "bg-gray-800/50 border-gray-700/50 text-gray-400 hover:border-gray-600"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Messages */}
                    {error && (
                      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                        {error}
                      </div>
                    )}
                    {success && (
                      <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
                        {success}
                      </div>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={submitting || !form.amount || !form.purpose || !form.purposeDescription || !form.urgencyLevel}
                      className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                          </svg>
                          Submit Application
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {tab === "history" && (
          <div className="space-y-4">
            {loans.length === 0 ? (
              <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-700/30 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
                  </svg>
                </div>
                <h4 className="text-white font-semibold text-lg mb-2">No Loans Yet</h4>
                <p className="text-gray-400 mb-4">You haven't applied for any emergency loans.</p>
                <button
                  onClick={() => setTab("apply")}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                >
                  Apply Now
                </button>
              </div>
            ) : (
              loans.map((loan) => (
                <div
                  key={loan._id}
                  className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:border-gray-600/50 transition-all duration-300"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-xl font-bold text-white">₹{loan.amount.toLocaleString()}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLES[loan.status]}`}>
                          {loan.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        {PURPOSE_OPTIONS.find(p => p.value === loan.purpose)?.label || loan.purpose} • Applied {new Date(loan.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      {loan.lenderOrganization && (
                        <p className="text-indigo-400 text-xs mt-1 font-medium">🏦 {loan.lenderOrganization}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-xs">Credit Score at Application</p>
                      <p className="text-white font-bold text-lg">{loan.creditScoreAtApplication}</p>
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm mb-4 bg-gray-900/30 p-3 rounded-lg">{loan.purposeDescription}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-gray-900/30 p-3 rounded-lg">
                      <p className="text-gray-500 text-xs">Urgency</p>
                      <p className="text-white font-medium text-sm capitalize">{loan.urgencyLevel}</p>
                    </div>
                    <div className="bg-gray-900/30 p-3 rounded-lg">
                      <p className="text-gray-500 text-xs">Risk Level</p>
                      <p className="text-white font-medium text-sm">{loan.riskLevelAtApplication}</p>
                    </div>
                    {loan.interestRate && (
                      <div className="bg-gray-900/30 p-3 rounded-lg">
                        <p className="text-gray-500 text-xs">Interest Rate</p>
                        <p className="text-white font-medium text-sm">{loan.interestRate}%</p>
                      </div>
                    )}
                    {loan.approvedAmount && (
                      <div className="bg-gray-900/30 p-3 rounded-lg">
                        <p className="text-gray-500 text-xs">Approved Amount</p>
                        <p className="text-green-400 font-bold text-sm">₹{loan.approvedAmount.toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Incoming Offers for pending loans */}
                  {loan.status === "pending" && loan.offers?.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        📥 Incoming Offers
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                          {loan.offers.filter(o => o.status === "offered").length} active
                        </span>
                      </h5>
                      <div className="space-y-3">
                        {loan.offers.filter(o => ["offered", "borrower_rejected"].includes(o.status)).map((offer) => (
                          <div key={offer._id}
                            className={`p-4 rounded-xl border transition-all ${
                              offer.status === "borrower_rejected"
                                ? "bg-gray-900/30 border-gray-700/30 opacity-60"
                                : "bg-gradient-to-r from-gray-800/60 to-gray-900/60 border-gray-600/50 hover:border-indigo-500/40"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 font-bold text-xs">
                                  {offer.lenderOrganization?.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-white font-semibold text-sm">{offer.lenderOrganization}</p>
                                  <p className="text-gray-500 text-xs">Offered {new Date(offer.offeredAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                                </div>
                              </div>
                              {offer.status === "borrower_rejected" && (
                                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-[10px] font-bold">REJECTED</span>
                              )}
                            </div>

                            <div className="grid grid-cols-4 gap-2 text-center mb-3">
                              <div className="bg-gray-900/50 p-2 rounded-lg">
                                <p className="text-gray-500 text-[10px]">Rate</p>
                                <p className="text-white font-bold text-sm">{offer.interestRate}%</p>
                              </div>
                              <div className="bg-gray-900/50 p-2 rounded-lg">
                                <p className="text-gray-500 text-[10px]">EMI</p>
                                <p className="text-white font-bold text-sm">₹{offer.monthlyEmi.toLocaleString()}</p>
                              </div>
                              <div className="bg-gray-900/50 p-2 rounded-lg">
                                <p className="text-gray-500 text-[10px]">Term</p>
                                <p className="text-white font-bold text-sm">{offer.repaymentTermMonths}mo</p>
                              </div>
                              <div className="bg-gray-900/50 p-2 rounded-lg">
                                <p className="text-gray-500 text-[10px]">Total</p>
                                <p className="text-amber-400 font-bold text-sm">₹{offer.totalRepayable.toLocaleString()}</p>
                              </div>
                            </div>

                            {offer.lenderNotes && (
                              <p className="text-gray-400 text-xs mb-3 italic">"{offer.lenderNotes}"</p>
                            )}

                            {offer.status === "offered" && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAcceptOffer(loan._id, offer._id, offer.lenderOrganization)}
                                  disabled={offerActionLoading === offer._id}
                                  className="flex-1 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg text-sm font-semibold transition shadow-lg shadow-green-600/20 disabled:opacity-50"
                                >
                                  {offerActionLoading === offer._id ? "..." : "✅ Accept"}
                                </button>
                                <button
                                  onClick={() => handleRejectOffer(loan._id, offer._id, offer.lenderOrganization)}
                                  disabled={offerActionLoading === offer._id}
                                  className="flex-1 py-2 bg-gray-700/50 hover:bg-red-600/20 text-gray-400 hover:text-red-400 border border-gray-600/50 rounded-lg text-sm font-medium transition disabled:opacity-50"
                                >
                                  ❌ Reject
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Show no-offers message for pending loans */}
                  {loan.status === "pending" && (!loan.offers || loan.offers.filter(o => o.status === "offered").length === 0) && (
                    <div className="mt-4 p-4 bg-gray-900/30 border border-gray-700/30 rounded-xl text-center">
                      <p className="text-gray-500 text-sm">⏳ Waiting for lenders to review and make offers...</p>
                    </div>
                  )}

                  {/* Accepted offer badge for approved loans */}
                  {["approved", "disbursed", "repaid"].includes(loan.status) && loan.lenderOrganization && (
                    <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
                      <span className="text-green-400 text-sm">✅ Accepted offer from</span>
                      <span className="text-white font-semibold text-sm">{loan.lenderOrganization}</span>
                      {loan.interestRate && <span className="text-gray-400 text-xs">@ {loan.interestRate}% interest</span>}
                    </div>
                  )}

                  {/* EMI & Due Date for approved+ loans */}
                  {loan.monthlyEmi > 0 && (
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-lg text-center">
                        <p className="text-indigo-400 text-xs">Monthly EMI</p>
                        <p className="text-white font-bold">₹{loan.monthlyEmi.toLocaleString()}</p>
                      </div>
                      <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-lg text-center">
                        <p className="text-indigo-400 text-xs">Total Repayable</p>
                        <p className="text-white font-bold">₹{loan.totalRepayable.toLocaleString()}</p>
                      </div>
                      <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-lg text-center">
                        <p className="text-indigo-400 text-xs">Due By</p>
                        <p className="text-white font-bold text-sm">{new Date(loan.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                    </div>
                  )}

                  {/* Repayment Progress for disbursed/repaid/defaulted */}
                  {["disbursed", "repaid", "defaulted"].includes(loan.status) && loan.totalRepayable > 0 && (
                    <div className="mt-4 p-4 bg-gray-900/40 rounded-xl">
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-gray-400">₹{(loan.totalRepaid || 0).toLocaleString()} confirmed</span>
                        <span className="text-gray-400">₹{loan.totalRepayable.toLocaleString()} total</span>
                      </div>
                      <div className="w-full bg-gray-700/50 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${loan.status === "repaid" ? "bg-emerald-500" : loan.status === "defaulted" ? "bg-red-500" : "bg-indigo-500"}`}
                          style={{ width: `${Math.min(((loan.totalRepaid || 0) / loan.totalRepayable) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-xs text-gray-500">Remaining: ₹{(loan.totalRepayable - (loan.totalRepaid || 0)).toLocaleString()}</span>
                        <span className="text-xs text-gray-500">{Math.round(((loan.totalRepaid || 0) / loan.totalRepayable) * 100)}%</span>
                      </div>

                      {/* Submit Payment (only for disbursed, no pending request) */}
                      {loan.status === "disbursed" && !(loan.repaymentHistory?.some(p => p.status === "pending_confirmation")) && (
                        <div className="mt-4 p-3 bg-gray-800/50 border border-gray-700/30 rounded-lg">
                          <p className="text-xs text-gray-400 font-medium mb-2">💳 Submit Payment</p>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder={`Amount (max ₹${(loan.totalRepayable - (loan.totalRepaid || 0)).toLocaleString()})`}
                              id={`pay-amount-${loan._id}`}
                              min="1"
                              max={loan.totalRepayable - (loan.totalRepaid || 0)}
                              className="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-600/50 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                            <select
                              id={`pay-method-${loan._id}`}
                              className="px-2 py-2 bg-gray-900/50 border border-gray-600/50 rounded-lg text-white text-xs focus:outline-none"
                            >
                              <option value="upi">UPI</option>
                              <option value="bank_transfer">Bank Transfer</option>
                              <option value="cash">Cash</option>
                              <option value="auto_debit">Auto Debit</option>
                            </select>
                            <button
                              onClick={async () => {
                                const amtInput = document.getElementById(`pay-amount-${loan._id}`);
                                const methodInput = document.getElementById(`pay-method-${loan._id}`);
                                const refInput = document.getElementById(`pay-ref-${loan._id}`);
                                const amount = Number(amtInput?.value);
                                if (!amount || amount <= 0) { setError("Enter a valid amount"); return; }
                                setOfferActionLoading(loan._id);
                                try {
                                  await axios.post(`/api/loans/${loan._id}/repay`, {
                                    amount, method: methodInput?.value || "upi", reference: refInput?.value || ""
                                  });
                                  setSuccess("Payment request submitted! Waiting for lender confirmation.");
                                  fetchData();
                                } catch (err) {
                                  setError(err.response?.data?.error || "Failed to submit");
                                } finally { setOfferActionLoading(null); }
                              }}
                              disabled={offerActionLoading === loan._id}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
                            >{offerActionLoading === loan._id ? "..." : "Submit"}</button>
                          </div>
                          <input
                            type="text"
                            placeholder="Reference / TXN ID (optional)"
                            id={`pay-ref-${loan._id}`}
                            className="w-full mt-2 px-3 py-2 bg-gray-900/50 border border-gray-600/50 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          />
                        </div>
                      )}

                      {/* Pending payment notice */}
                      {loan.status === "disbursed" && loan.repaymentHistory?.some(p => p.status === "pending_confirmation") && (
                        <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-center">
                          <p className="text-amber-400 text-xs font-medium">⏳ You have a pending payment awaiting lender confirmation</p>
                        </div>
                      )}

                      {/* Payment History with status */}
                      {loan.repaymentHistory?.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          <p className="text-xs text-gray-400 font-medium">Your Payments</p>
                          {loan.repaymentHistory.map((p, i) => (
                            <div key={i} className={`flex justify-between items-center text-xs p-2 rounded-lg ${
                              p.status === "pending_confirmation" ? "bg-amber-500/10 border border-amber-500/20" :
                              p.status === "confirmed" ? "bg-green-500/5 border border-green-500/20" :
                              "bg-red-500/5 border border-red-500/20"
                            }`}>
                              <div className="flex items-center gap-2">
                                <span className={`font-semibold ${
                                  p.status === "confirmed" ? "text-green-400" :
                                  p.status === "rejected" ? "text-red-400 line-through" : "text-amber-400"
                                }`}>₹{p.amount.toLocaleString()}</span>
                                <span className="text-gray-500">{p.method?.replace("_", " ")}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  p.status === "pending_confirmation" ? "bg-amber-500/20 text-amber-400" :
                                  p.status === "confirmed" ? "bg-green-500/20 text-green-400" :
                                  "bg-red-500/20 text-red-400"
                                }`}>
                                  {p.status === "pending_confirmation" ? "⏳" : p.status === "confirmed" ? "✅" : "❌"}
                                </span>
                                <span className="text-gray-500">{new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Success/Error from offer actions */}
        {(success || error) && tab === "history" && (
          <div className={`fixed bottom-6 right-6 max-w-md p-4 rounded-xl border shadow-2xl z-50 ${
            success ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}>
            <p className="text-sm font-medium">{success || error}</p>
            <button onClick={() => { setSuccess(""); setError(""); }} className="absolute top-2 right-3 text-current opacity-60 hover:opacity-100">✕</button>
          </div>
        )}
      </div>
    </div>
  );
}
