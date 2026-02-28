import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import axios from "axios";

import Navbar from "../components/Navbar";

export default function Role1Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [creditData, setCreditData] = useState(null);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [savingsGoal, setSavingsGoal] = useState(10000);
  const [showEditGoal, setShowEditGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(10000);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: "food",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "cash",
  });

  // Helper function to get userId from context or localStorage
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

  const addSampleExpenses = async () => {
    const sampleExpenses = [
      {
        category: "food",
        amount: 250,
        description: "Lunch at cafe",
        date: new Date().toISOString().split("T")[0],
        paymentMethod: "upi",
      },
      {
        category: "transport",
        amount: 150,
        description: "Cab ride",
        date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
        paymentMethod: "cash",
      },
      {
        category: "utilities",
        amount: 500,
        description: "Mobile recharge",
        date: new Date(Date.now() - 172800000).toISOString().split("T")[0],
        paymentMethod: "card",
      },
      {
        category: "entertainment",
        amount: 300,
        description: "Movie ticket",
        date: new Date(Date.now() - 259200000).toISOString().split("T")[0],
        paymentMethod: "upi",
      },
    ];

    try {
      for (const expense of sampleExpenses) {
        await axios.post("/api/expenses", expense);
      }
      fetchExpenses();
      fetchStats();
    } catch (error) {
      console.error("Error adding sample expenses:", error);
    }
  };

  const categories = [
    "food",
    "transport",
    "utilities",
    "rent",
    "healthcare",
    "entertainment",
    "education",
    "other",
  ];
  const paymentMethods = ["cash", "card", "upi", "wallet"];

  // Load credit data on mount so the dashboard reflects latest score
  const fetchCreditData = async () => {
    try {
      const userId = getUserId();
      if (!userId) return;
      const { data } = await axios.get(`/api/credit/${userId}`);
      console.log('\n===== BACKEND CREDIT RESPONSE =====');
      console.log('Full response:', JSON.stringify(data, null, 2));
      if (data.success && data.data) {
        const cd = data.data;
        console.log('\n--- KEY FIELDS ---');
        console.log('creditScore:', cd.creditScore);
        console.log('score (alias):', cd.score);
        console.log('riskLevel:', cd.riskLevel);
        console.log('eligibleCreditAmount:', cd.eligibleCreditAmount);
        console.log('scoreBreakdown:', cd.scoreBreakdown);
        console.log('riskAnalysis:', cd.riskAnalysis);
        console.log('financialSummary:', cd.financialSummary);
        console.log('===================================\n');
        setCreditData(cd);
        setFinancialSummary(cd.financialSummary || {});
      }
    } catch (err) {
      // No credit profile yet — that's fine
      console.log('No credit profile found yet:', err?.response?.data?.error || err.message);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchStats();
    fetchCreditData();
  }, []);

  const fetchExpenses = async () => {
    try {
      const { data } = await axios.get("/api/expenses");
      setExpenses(data.expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await axios.get("/api/expenses/stats");
      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const { otherNote, ...rest } = newExpense;
      const payload = {
        ...rest,
        description:
          newExpense.category === "other" && otherNote
            ? otherNote
            : newExpense.description,
      };
      await axios.post("/api/expenses", payload);
      setShowAddExpense(false);
      setNewExpense({
        category: "food",
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        paymentMethod: "cash",
      });
      fetchExpenses();
      fetchStats();
    } catch (error) {
      alert(
        "Error adding expense: " +
          (error.response?.data?.message || error.message),
      );
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm(t("deleteExpenseConfirm"))) return;
    try {
      await axios.delete(`/api/expenses/${id}`);
      fetchExpenses();
      fetchStats();
    } catch (error) {
      alert("Error deleting expense");
    }
  };

  const getFinancialHealth = () => {
    if (creditData) {
      const s = creditData.score;
      if (s >= 750) return { status: t("excellent"), color: "green", icon: "✓", detail: t("excellentDetail") };
      if (s >= 500) return { status: t("stable"), color: "blue", icon: "→", detail: t("stableDetail") };
      return { status: t("needsAttention"), color: "yellow", icon: "!", detail: t("needsAttentionDetail") };
    }
    return {
      status: t("preAssessment"),
      color: "gray",
      icon: "○",
      detail: t("preAssessmentDetail"),
    };
  };

  const getCreditReadiness = () => {
    if (creditData) {
      const s = creditData.score;
      if (s >= 700) return { status: t("eligible"), color: "green", detail: `₹${creditData.eligibleCreditAmount?.toLocaleString()} pre-approved credit available` };
      if (s >= 500) return { status: t("partiallyEligible"), color: "yellow", detail: t("partiallyEligibleDetail") };
      return { status: t("buildingEligibility"), color: "orange", detail: t("buildingEligibilityDetail") };
    }
    return {
      status: t("uploadStatementStatus"),
      color: "gray",
      detail: t("uploadStatementDetail"),
    };
  };

  const getRiskLevel = () => {
    if (creditData) {
      const level = creditData.riskLevel || "Medium";
      const colors = { Low: "green", Medium: "yellow", High: "red" };
      const details = {
        Low: t("lowRiskDetail"),
        Medium: t("mediumRiskDetail"),
        High: t("highRiskDetail"),
      };
      const labels = {
        Low: t("low"),
        Medium: t("medium"),
        High: t("high"),
      };
      return {
        level: labels[level] || level,
        color: colors[level] || "yellow",
        detail: details[level] || t("mediumRiskDetail"),
      };
    }
    return {
      level: t("notEvaluated"),
      color: "gray",
      detail: t("notEvaluatedDetail"),
    };
  };

  const getSmartInsights = () => {
    const insights = [];

    if (creditData && financialSummary) {
      if (financialSummary.incomeConsistencyScore >= 70) {
        insights.push({
          type: "positive",
          icon: "✓",
          title: t("strongIncomeConsistency"),
          detail: `${financialSummary.incomeConsistencyScore}% consistency boosts lender confidence`,
        });
      } else if (financialSummary.incomeConsistencyScore) {
        insights.push({
          type: "warning",
          icon: "!",
          title: t("irregularIncomePattern"),
          detail: t("irregularIncomeDetail"),
        });
      }

      const expenseRatio = financialSummary.expenseToIncomeRatio || 0;
      if (expenseRatio < 0.5) {
        insights.push({
          type: "positive",
          icon: "✓",
          title: t("healthyExpenseManagement"),
          detail: `${Math.round(expenseRatio * 100)}% expense ratio is excellent`,
        });
      } else {
        insights.push({
          type: "warning",
          icon: "!",
          title: t("highExpenseRatio"),
          detail: `${Math.round(expenseRatio * 100)}% - ${t("highExpenseRatioDetail")}`,
        });
      }

      if (financialSummary.activeWorkDays >= 20) {
        insights.push({
          type: "positive",
          icon: "✓",
          title: t("regularActivity"),
          detail: `${financialSummary.activeWorkDays} ${t("activeDaysDetail")}`,
        });
      }
    } else {
      insights.push({
        type: "info",
        icon: "📊",
        title: t("getCreditScore"),
        detail: t("getCreditScoreDetail"),
      });
      insights.push({
        type: "info",
        icon: "🔒",
        title: t("securePrivate"),
        detail: t("securePrivateDetail"),
      });
      insights.push({
        type: "info",
        icon: "⚡",
        title: t("designedForGig"),
        detail: t("designedForGigDetail"),
      });
    }

    return insights;
  };

  const getNextActions = () => {
    const actions = [];

    if (!creditData) {
      actions.push({
        priority: "high",
        icon: "📊",
        title: t("calculateCreditScore"),
        detail: t("calculateCreditScoreDetail"),
        action: t("uploadNow"),
        onClick: () => setShowUploadModal(true)
      });
    } else if (creditData.score < 700) {
      actions.push({
        priority: "medium",
        icon: "📈",
        title: t("improveYourScore"),
        detail: `Current score: ${creditData.score}/850 - Track more consistent income`,
        action: "View Tips"
      });
    }

    if (stats?.totalExpenses && financialSummary?.averageMonthlyIncome) {
      const ratio = stats.totalExpenses / financialSummary.averageMonthlyIncome;
      if (ratio > 0.5) {
        actions.push({
          priority: "medium",
          icon: "💰",
          title: t("reduceExpenseRatio"),
          detail: `Currently at ${Math.round(ratio * 100)}% - ${t("targetBelow50")}`,
          action: t("trackExpenses"),
        });
      }
    }

    if (!creditData && expenses.length > 0) {
      actions.push({
        priority: "low",
        icon: "📝",
        title: t("trackDailyExpenses"),
        detail: t("trackDailyExpensesDetail"),
        action: t("addExpense"),
        onClick: () => setShowAddExpense(true),
      });
    }

    if (actions.length === 0) {
      actions.push({
        priority: "low",
        icon: "🎉",
        title: t("doingGreat"),
        detail: t("doingGreatDetail"),
        action: t("viewAnalysis"),
        onClick: () =>
          creditData &&
          navigate("/credit-analysis", {
            state: { creditData, financialSummary },
          }),
      });
    }

    return actions;
  };

  const financialHealth = getFinancialHealth();
  const creditReadiness = getCreditReadiness();
  const riskLevel = getRiskLevel();
  const smartInsights = getSmartInsights();
  const nextActions = getNextActions();

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isDark ? "bg-gray-950" : "bg-white"}`}
      >
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-900"></div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-gray-950" : "bg-gray-50"}`}
    >
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Quick Actions Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* 1. Upload Statement */}
          <button
            onClick={() => setShowUploadModal(true)}
            className={`relative flex flex-col items-start p-6 rounded-2xl shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border text-left group overflow-hidden ${isDark ? "bg-gradient-to-br from-blue-900/40 to-gray-900 border-blue-800/60 hover:border-blue-500" : "bg-gradient-to-br from-white to-blue-50/50 border-blue-100 hover:border-blue-400"}`}
          >
            {/* Background Glow */}
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-40 ${isDark ? "bg-blue-500" : "bg-blue-400"}`}></div>
            
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 shadow-sm ${isDark ? "bg-blue-900/60 text-blue-400" : "bg-blue-100 text-blue-600"}`}>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <span className={`text-lg font-bold mb-1 flex items-center gap-2 ${isDark ? "text-gray-100" : "text-gray-800"}`}>
              📄 {t("uploadStatement")}
            </span>
            <span className={`text-sm leading-relaxed ${isDark ? "text-gray-400 group-hover:text-gray-300" : "text-gray-500 group-hover:text-gray-700"} transition-colors`}>
              {t("uploadStatementDesc") || "Analyze your bank statement"}
            </span>
          </button>

          {/* 2. Manage Platforms */}
          <button
            onClick={() => navigate("/platforms")}
            className={`relative flex flex-col items-start p-6 rounded-2xl shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border text-left group overflow-hidden ${isDark ? "bg-gradient-to-br from-indigo-900/40 to-gray-900 border-indigo-800/60 hover:border-indigo-500" : "bg-gradient-to-br from-white to-indigo-50/50 border-indigo-100 hover:border-indigo-400"}`}
          >
            {/* Background Glow */}
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-40 ${isDark ? "bg-indigo-500" : "bg-indigo-400"}`}></div>

            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 shadow-sm ${isDark ? "bg-indigo-900/60 text-indigo-400" : "bg-indigo-100 text-indigo-600"}`}>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 7H7v6h6V7z" />
                <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
              </svg>
            </div>
            <span className={`text-lg font-bold mb-1 flex items-center gap-2 ${isDark ? "text-gray-100" : "text-gray-800"}`}>
              💼 {t("managePlatforms") || "Manage Platforms"}
            </span>
            <span className={`text-sm leading-relaxed ${isDark ? "text-gray-400 group-hover:text-gray-300" : "text-gray-500 group-hover:text-gray-700"} transition-colors`}>
              {t("managePlatformsDesc") || "Connect your gig platforms"}
            </span>
          </button>

          {/* 3. View Credit Report */}
          <button
            onClick={async () => {
              try {
                const userId = getUserId();
                if (!userId) {
                  alert("Please login to view your credit score");
                  return;
                }
                // Try to GET existing profile first (teammate's improvement: fallback to calculate)
                let creditData = null;
                try {
                  const getRes = await axios.get(`/api/credit/${userId}`);
                  if (getRes.data.success && getRes.data.data) {
                    creditData = getRes.data.data;
                  }
                } catch (_) {
                  // profile not found — trigger calculation
                }

                // If no existing profile, calculate from saved DB data
                if (!creditData) {
                  try {
                    await axios.post("/api/credit/calculate", { userId });
                    const getRes2 = await axios.get(`/api/credit/${userId}`);
                    if (getRes2.data.success && getRes2.data.data) {
                      creditData = getRes2.data.data;
                    }
                  } catch (calcErr) {
                    console.error('Credit calculation error:', calcErr?.response?.data || calcErr.message);
                  }
                }

                if (creditData) {
                  navigate("/credit-analysis", {
                    state: {
                      creditData,
                      financialSummary: creditData.financialSummary || {},
                    },
                  });
                } else {
                  alert("No credit score available yet. Please upload your bank statement first.");
                }
              } catch (error) {
                console.error("Error loading credit report:", error);
                alert("No credit score available yet. Please upload your bank statement first.");
              }
            }}
             className={`relative flex flex-col items-start p-6 rounded-2xl shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border text-left group overflow-hidden ${isDark ? "bg-gradient-to-br from-purple-900/40 to-gray-900 border-purple-800/60 hover:border-purple-500" : "bg-gradient-to-br from-white to-purple-50/50 border-purple-100 hover:border-purple-400"}`}
          >
             {/* Background Glow */}
             <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-40 ${isDark ? "bg-purple-500" : "bg-purple-400"}`}></div>

             <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 shadow-sm ${isDark ? "bg-purple-900/60 text-purple-400" : "bg-purple-100 text-purple-600"}`}>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
            </div>
             <span className={`text-lg font-bold mb-1 flex items-center gap-2 ${isDark ? "text-gray-100" : "text-gray-800"}`}>
              📊 {t("viewCreditReport")}
            </span>
            <span className={`text-sm leading-relaxed ${isDark ? "text-gray-400 group-hover:text-gray-300" : "text-gray-500 group-hover:text-gray-700"} transition-colors`}>
              {t("viewCreditReportDesc") || "Access your credit details"}
            </span>
          </button>

          {/* 4. Tax Summary */}
          <button
            onClick={() => navigate("/tax-summary")}
             className={`relative flex flex-col items-start p-6 rounded-2xl shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border text-left group overflow-hidden ${isDark ? "bg-gradient-to-br from-amber-900/40 to-gray-900 border-amber-800/60 hover:border-amber-500" : "bg-gradient-to-br from-white to-amber-50/50 border-amber-100 hover:border-amber-400"}`}
          >
             {/* Background Glow */}
             <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-40 ${isDark ? "bg-amber-500" : "bg-amber-400"}`}></div>

             <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 shadow-sm ${isDark ? "bg-amber-900/60 text-amber-400" : "bg-amber-100 text-amber-600"}`}>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd" />
              </svg>
            </div>
            <span className={`text-lg font-bold mb-1 flex items-center gap-2 ${isDark ? "text-gray-100" : "text-gray-800"}`}>
              💰 {t("taxSummary") || "Tax Summary"}
            </span>
            <span className={`text-sm leading-relaxed ${isDark ? "text-gray-400 group-hover:text-gray-300" : "text-gray-500 group-hover:text-gray-700"} transition-colors`}>
              {t("taxSummaryDesc") || "Clear breakdown of taxes"}
            </span>
          </button>
        </div>

        {/* Welcome Banner with Insights */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg shadow-md p-6 mb-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">
                {t("welcomeBack")}, {user?.name}! 👋
              </h2>
              <p className="text-blue-100 text-sm mb-4">
                {t("welcomeSubtitle")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <svg
                      className="w-4 h-4 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-xs font-semibold">
                      {t("didYouKnow")}
                    </span>
                  </div>
                  <p className="text-xs text-blue-100">{t("didYouKnowText")}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <svg
                      className="w-4 h-4 text-green-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-xs font-semibold">{t("proTip")}</span>
                  </div>
                  <p className="text-xs text-blue-100">{t("proTipText")}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <svg
                      className="w-4 h-4 text-purple-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-xs font-semibold">
                      {t("yourGoal")}
                    </span>
                  </div>
                  <p className="text-xs text-blue-100">{t("yourGoalText")}</p>
                </div>
              </div>
            </div>
            {!creditData && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="ml-4 px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-blue-900 rounded-lg font-bold shadow-lg transition text-sm whitespace-nowrap"
              >
                {t("calculateMyScore")}
              </button>
            )}
          </div>
        </div>



        {/* Future Integration Note */}
        {!creditData && (
          <div
            className={`rounded-lg shadow-sm p-4 mb-6 border ${isDark ? "bg-indigo-950/40 border-indigo-800" : "bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200"}`}
          >
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <h3
                  className={`text-sm font-bold mb-1 ${isDark ? "text-indigo-400" : "text-indigo-900"}`}
                >
                  {t("futureEnhancement")}
                </h3>
                <p
                  className={`text-xs leading-relaxed ${isDark ? "text-gray-400" : "text-gray-700"}`}
                >
                  {t("futureEnhancementText")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div
            className={`rounded-lg shadow-md p-4 border-l-4 border-blue-900 hover:shadow-lg transition ${isDark ? "bg-gray-900" : "bg-white"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-xs font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                {t("totalExpenses")}
              </span>
              <svg
                className={`w-5 h-5 ${isDark ? "text-blue-400" : "text-blue-900"}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div
              className={`text-2xl font-bold ${isDark ? "text-blue-400" : "text-blue-900"}`}
            >
              ₹
              {(
                stats?.totalExpenses ||
                expenses.reduce((sum, e) => sum + e.amount, 0)
              )?.toLocaleString()}
            </div>
          </div>

          <div
            className={`rounded-lg shadow-md p-4 border-l-4 border-yellow-400 hover:shadow-lg transition ${isDark ? "bg-gray-900" : "bg-white"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-xs font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                {t("transactions")}
              </span>
              <svg
                className="w-5 h-5 text-yellow-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div
              className={`text-2xl font-bold ${isDark ? "text-blue-400" : "text-blue-900"}`}
            >
              {expenses.length}
            </div>
          </div>

          <div
            className={`rounded-lg shadow-md p-4 border-l-4 border-green-500 hover:shadow-lg transition ${isDark ? "bg-gray-900" : "bg-white"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-xs font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                {t("dailyAverage")}
              </span>
              <svg
                className="w-5 h-5 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div
              className={`text-2xl font-bold ${isDark ? "text-blue-400" : "text-blue-900"}`}
            >
              ₹{stats?.dailyAverage?.toFixed(0) || 0}
            </div>
          </div>

          <div
            className={`rounded-lg shadow-md p-4 border-l-4 border-purple-500 hover:shadow-lg transition cursor-pointer ${isDark ? "bg-gray-900" : "bg-white"}`}
            onClick={() => {
              setShowEditGoal(true);
              setTempGoal(savingsGoal);
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-xs font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                {t("savingsGoal")}
              </span>
              <svg
                className="w-5 h-5 text-purple-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div
              className={`text-2xl font-bold mb-2 ${isDark ? "text-blue-400" : "text-blue-900"}`}
            >
              ₹{savingsGoal.toLocaleString()}
            </div>

            {(() => {
              const totalExpenses =
                stats?.totalExpenses ||
                expenses.reduce((sum, e) => sum + e.amount, 0);
              const estimatedIncome =
                financialSummary?.averageMonthlyIncome ||
                (totalExpenses > 0 ? totalExpenses * 1.5 : 15000);
              const savedAmount = Math.max(0, estimatedIncome - totalExpenses);
              const progressPercent = Math.min(
                100,
                (savedAmount / savingsGoal) * 100,
              );

              return (
                <>
                  <div className="flex justify-between items-center mb-1">
                    <span
                      className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      {t("saved")}: ₹{savedAmount.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-purple-600">
                      {progressPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div
                    className={`w-full rounded-full h-2 ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                  >
                    <div
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                  <p
                    className={`text-xs mt-2 ${isDark ? "text-gray-500" : "text-gray-500"}`}
                  >
                    {t("clickToEditGoal")}
                  </p>
                </>
              );
            })()}
          </div>
        </div>


        {/* Category Breakdown — computed from all expenses (no period filter) */}
        {expenses.length > 0 && (() => {
          const categoryMap = expenses.reduce((acc, exp) => {
            const key = exp.category || "other";
            acc[key] = (acc[key] || 0) + (exp.amount || 0);
            return acc;
          }, {});
          const grandTotal = Object.values(categoryMap).reduce((s, v) => s + v, 0);
          const sorted = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
          return (
            <div
              className={`rounded-lg shadow-md p-5 mb-6 ${isDark ? "bg-gray-900" : "bg-white"}`}
            >
              <div className="flex items-center space-x-2 mb-4">
                <svg
                  className={`w-5 h-5 ${isDark ? "text-blue-400" : "text-blue-900"}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                <h2
                  className={`text-lg font-bold ${isDark ? "text-blue-400" : "text-blue-900"}`}
                >
                  {t("categoryBreakdown")}
                </h2>
              </div>
              <div className="space-y-3">
                {sorted.map(([category, amount]) => (
                  <div key={category}>
                    <div className="flex justify-between mb-1">
                      <span
                        className={`capitalize font-medium text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}
                      >
                        {category}
                      </span>
                      <span
                        className={`font-bold text-sm ${isDark ? "text-blue-400" : "text-blue-900"}`}
                      >
                        ₹{amount.toLocaleString()}
                      </span>
                    </div>
                    <div
                      className={`w-full rounded-full h-2 ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                    >
                      <div
                        className="bg-gradient-to-r from-blue-900 to-yellow-400 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${grandTotal > 0 ? (amount / grandTotal) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}



        {/* Actions */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <svg
              className={`w-5 h-5 ${isDark ? "text-blue-400" : "text-blue-900"}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            <h2
              className={`text-lg font-bold ${isDark ? "text-blue-400" : "text-blue-900"}`}
            >
              {t("yourExpenses")}
            </h2>
          </div>
          <button
            onClick={() => setShowAddExpense(!showAddExpense)}
            className="px-5 py-2 bg-yellow-400 hover:bg-yellow-500 text-blue-900 rounded-lg font-medium shadow transition text-sm"
          >
            {showAddExpense ? t("cancelBtn") : t("addExpenseBtn")}
          </button>
        </div>

        {/* Add Expense Form */}
        {showAddExpense && (
          <div
            className={`rounded-lg shadow-md p-5 mb-6 border-l-4 border-yellow-400 ${isDark ? "bg-gray-900" : "bg-white"}`}
          >
            <form
              onSubmit={handleAddExpense}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <div>
                <label
                  className={`block text-xs font-semibold mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  {t("category")}
                </label>
                <select
                  value={newExpense.category}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, category: e.target.value })
                  }
                  className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none text-sm ${isDark ? "bg-gray-800 border-blue-800 text-gray-300 focus:border-blue-500" : "border-blue-200 text-gray-700 focus:border-blue-900"}`}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className={`block text-xs font-semibold mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  {t("amount")}
                </label>
                <input
                  type="number"
                  value={newExpense.amount}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, amount: e.target.value })
                  }
                  required
                  min="1"
                  className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none text-sm ${isDark ? "bg-gray-800 border-blue-800 text-gray-300 focus:border-blue-500" : "border-blue-200 text-gray-700 focus:border-blue-900"}`}
                  placeholder="0"
                />
              </div>

              <div>
                <label
                  className={`block text-xs font-semibold mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  {t("date")}
                </label>
                <input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, date: e.target.value })
                  }
                  className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none text-sm ${isDark ? "bg-gray-800 border-blue-800 text-gray-300 focus:border-blue-500" : "border-blue-200 text-gray-700 focus:border-blue-900"}`}
                />
              </div>

              <div>
                <label
                  className={`block text-xs font-semibold mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  {t("paymentMethod")}
                </label>
                <select
                  value={newExpense.paymentMethod}
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      paymentMethod: e.target.value,
                    })
                  }
                  className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none text-sm ${isDark ? "bg-gray-800 border-blue-800 text-gray-300 focus:border-blue-500" : "border-blue-200 text-gray-700 focus:border-blue-900"}`}
                >
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label
                  className={`block text-xs font-semibold mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  {t("description")}
                </label>
                <input
                  type="text"
                  value={newExpense.description}
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      description: e.target.value,
                    })
                  }
                  className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none text-sm ${isDark ? "bg-gray-800 border-blue-800 text-gray-300 focus:border-blue-500" : "border-blue-200 text-gray-700 focus:border-blue-900"}`}
                  placeholder={t("descriptionPlaceholder")}
                />
              </div>

              {newExpense.category === "other" && (
                <div className="md:col-span-2">
                  <label
                    className={`block text-xs font-semibold mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                  >
                    {t("otherNoteLabel") || "Note (describe the other expense)"}
                  </label>
                  <input
                    type="text"
                    value={newExpense.otherNote || ""}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, otherNote: e.target.value })
                    }
                    className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none text-sm ${isDark ? "bg-gray-800 border-yellow-700 text-gray-300 focus:border-yellow-500" : "border-yellow-300 text-gray-700 focus:border-yellow-500"}`}
                    placeholder={t("otherNotePlaceholder") || "E.g. Gift, donation, misc…"}
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-medium shadow transition text-sm"
                >
                  {t("addExpenseSubmit")}
                </button>
              </div>
            </form>
          </div>
        )}



        <div className="mb-6">
          <button
            onClick={() => navigate("/expense-tracker")}
            className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-medium shadow transition text-sm"
          >
            {t("trackExpensesCta") || "Track Your Expenses"}
          </button>
        </div>
              {/* Financial Health Snapshot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {/* Financial Health Status */}
          <div
            className={`rounded-lg shadow-md p-5 border-l-4 border-${financialHealth.color}-500 ${isDark ? "bg-gray-900" : "bg-white"}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full bg-${financialHealth.color}-100 ${isDark ? `bg-${financialHealth.color}-900/30` : ""} flex items-center justify-center`}
                >
                  <span
                    className={`text-${financialHealth.color}-600 text-xl font-bold`}
                  >
                    {financialHealth.icon}
                  </span>
                </div>
                <div>
                  <p
                    className={`text-xs font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    {t("financialHealth")}
                  </p>
                  <p
                    className={`text-lg font-bold text-${financialHealth.color}-700 ${isDark ? `text-${financialHealth.color}-400` : ""}`}
                  >
                    {financialHealth.status}
                  </p>
                </div>
              </div>
              <svg
                className={`w-6 h-6 text-${financialHealth.color}-500`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p
              className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              {financialHealth.detail}
            </p>
          </div>

          {/* Credit Readiness */}
          <div
            className={`rounded-lg shadow-md p-5 border-l-4 border-${creditReadiness.color}-500 ${isDark ? "bg-gray-900" : "bg-white"}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? `bg-${creditReadiness.color}-900/30` : `bg-${creditReadiness.color}-100`}`}
                >
                  <svg
                    className={`w-6 h-6 text-${creditReadiness.color}-600`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path
                      fillRule="evenodd"
                      d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p
                    className={`text-xs font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    {t("creditReadiness")}
                  </p>
                  <p
                    className={`text-lg font-bold ${isDark ? `text-${creditReadiness.color}-400` : `text-${creditReadiness.color}-700`}`}
                  >
                    {creditReadiness.status}
                  </p>
                </div>
              </div>
            </div>
            <p
              className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              {creditReadiness.detail}
            </p>
          </div>

          {/* Risk Level */}
          <div
            className={`rounded-lg shadow-md p-5 border-l-4 border-${riskLevel.color}-500 ${isDark ? "bg-gray-900" : "bg-white"}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? `bg-${riskLevel.color}-900/30` : `bg-${riskLevel.color}-100`}`}
                >
                  <svg
                    className={`w-6 h-6 text-${riskLevel.color}-600`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p
                    className={`text-xs font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    {t("riskAssessment")}
                  </p>
                  <p
                    className={`text-lg font-bold ${isDark ? `text-${riskLevel.color}-400` : `text-${riskLevel.color}-700`}`}
                  >
                    {riskLevel.level} {t("risk")}
                  </p>
                </div>
              </div>
            </div>
            <p
              className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              {riskLevel.detail}
            </p>
          </div>
        </div>

        {/* Smart Financial Insights */}
        <div
          className={`rounded-lg shadow-md p-5 mb-6 ${isDark ? "bg-gray-900" : "bg-white"}`}
        >
          <div className="flex items-center gap-2 mb-4">
            <svg
              className={`w-5 h-5 ${isDark ? "text-blue-400" : "text-blue-900"}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path
                fillRule="evenodd"
                d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                clipRule="evenodd"
              />
            </svg>
            <h2
              className={`text-lg font-bold ${isDark ? "text-blue-400" : "text-blue-900"}`}
            >
              {t("smartFinancialInsights")}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {smartInsights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  insight.type === "positive"
                    ? isDark
                      ? "bg-green-900/20 border-green-500"
                      : "bg-green-50 border-green-500"
                    : insight.type === "warning"
                      ? isDark
                        ? "bg-yellow-900/20 border-yellow-500"
                        : "bg-yellow-50 border-yellow-500"
                      : isDark
                        ? "bg-blue-900/20 border-blue-500"
                        : "bg-blue-50 border-blue-500"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`text-2xl ${
                      insight.type === "positive"
                        ? "text-green-600"
                        : insight.type === "warning"
                          ? "text-yellow-600"
                          : "text-blue-600"
                    }`}
                  >
                    {insight.icon}
                  </span>
                  <div className="flex-1">
                    <h3
                      className={`text-sm font-bold mb-1 ${isDark ? "text-gray-100" : "text-gray-900"}`}
                    >
                      {insight.title}
                    </h3>
                    <p
                      className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      {insight.detail}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Best Actions */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg shadow-md p-5 mb-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <svg
              className="w-5 h-5 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                clipRule="evenodd"
              />
            </svg>
            <h2 className="text-lg font-bold">{t("recommendedActions")}</h2>
          </div>
          <div className="space-y-3">
            {nextActions.map((action, index) => (
              <div
                key={index}
                className={`bg-white/10 backdrop-blur-sm rounded-lg p-4 ${
                  action.priority === "high"
                    ? "border-2 border-yellow-400"
                    : "border border-white/20"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-2xl">{action.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold">{action.title}</h3>
                        {action.priority === "high" && (
                          <span className="px-2 py-0.5 bg-yellow-400 text-blue-900 text-xs font-bold rounded">
                            {t("priority")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-blue-100">{action.detail}</p>
                    </div>
                  </div>
                  {action.action && (
                    <button
                      onClick={action.onClick}
                      className="ml-3 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-blue-900 rounded-lg font-medium text-xs whitespace-nowrap transition"
                    >
                      {action.action}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Savings Goal Edit Modal */}
        {showEditGoal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditGoal(false)}
          >
            <div
              className={`rounded-2xl shadow-2xl max-w-md w-full p-6 ${isDark ? "bg-gray-900" : "bg-white"}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3
                  className={`text-xl font-bold ${isDark ? "text-blue-400" : "text-blue-900"}`}
                >
                  {t("editSavingsGoal")}
                </h3>
                <button
                  onClick={() => setShowEditGoal(false)}
                  className={`${isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <label
                  className={`block text-sm font-semibold mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  {t("monthlyTarget")}
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setTempGoal(Math.max(1000, tempGoal - 1000))}
                    className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl font-bold transition ${isDark ? "bg-gray-800 hover:bg-gray-700 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                  >
                    -
                  </button>
                  <div className="flex-1">
                    <input
                      type="number"
                      value={tempGoal}
                      onChange={(e) =>
                        setTempGoal(Math.max(0, parseInt(e.target.value) || 0))
                      }
                      className={`w-full text-center text-3xl font-bold border-2 rounded-lg py-3 focus:outline-none ${isDark ? "bg-gray-800 border-purple-700 text-blue-400 focus:border-purple-500" : "border-purple-200 text-blue-900 focus:border-purple-500"}`}
                    />
                  </div>
                  <button
                    onClick={() => setTempGoal(tempGoal + 1000)}
                    className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl font-bold transition ${isDark ? "bg-gray-800 hover:bg-gray-700 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                  >
                    +
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                  {[5000, 10000, 20000, 50000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setTempGoal(amount)}
                      className={`py-2 rounded-lg text-sm font-medium transition ${
                        tempGoal === amount
                          ? "bg-purple-600 text-white"
                          : isDark
                            ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      ₹{amount / 1000}k
                    </button>
                  ))}
                </div>
              </div>

              <div
                className={`rounded-lg p-4 mb-6 ${isDark ? "bg-purple-900/20 border border-purple-800" : "bg-purple-50"}`}
              >
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-purple-600 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p
                      className={`text-xs leading-relaxed ${isDark ? "text-gray-400" : "text-gray-700"}`}
                    >
                      {t("savingsGoalInfo")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditGoal(false)}
                  className={`flex-1 py-3 rounded-lg font-medium transition ${isDark ? "bg-gray-800 hover:bg-gray-700 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={() => {
                    setSavingsGoal(tempGoal);
                    setShowEditGoal(false);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-medium shadow-md transition"
                >
                  {t("saveGoal")}
                </button>
              </div>
            </div>
          </div>
        )}

</div>

      {/* PDF Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowUploadModal(false)}
          ></div>
          
          <div className={`relative w-full max-w-md rounded-2xl shadow-2xl p-8 ${isDark ? "bg-gray-900 border border-gray-800" : "bg-white"} animate-scale-in`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                Upload Bank Statement
              </h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className={`p-2 rounded-lg hover:bg-gray-100 ${isDark ? "hover:bg-gray-800" : ""}`}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Select PDF File (Max 5MB)
                </label>
                <div className={`border-2 border-dashed rounded-xl p-8 text-center ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-gray-50"}`}>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        if (file.type !== "application/pdf") {
                          alert("Only PDF files allowed");
                          return;
                        }
                        if (file.size > 5 * 1024 * 1024) {
                          alert("File must be less than 5MB");
                          return;
                        }
                        setPdfFile(file);
                      }
                    }}
                    className="hidden"
                    id="pdf-upload-dashboard"
                  />
                  <label htmlFor="pdf-upload-dashboard" className="cursor-pointer">
                    <svg className={`w-16 h-16 mx-auto mb-4 ${isDark ? "text-gray-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      {pdfFile ? pdfFile.name : "Click to select PDF file"}
                    </p>
                    <p className={`text-xs mt-2 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                      Bank statement PDF (max 5MB)
                    </p>
                  </label>
                </div>
              </div>
              
              <button
                onClick={async () => {
                  if (!pdfFile) {
                    alert("Please select a PDF file");
                    return;
                  }
                  
                  const userId = getUserId();
                  if (!userId) {
                    alert("User not authenticated. Please login again.");
                    return;
                  }

                  setPdfUploading(true);
                  const formData = new FormData();
                  formData.append("statement", pdfFile);
                  formData.append("userId", userId);

                  try {
                    console.log('Uploading PDF:', pdfFile.name, 'for user:', userId);
                    const { data } = await axios.post("/api/statement/upload", formData, {
                      headers: { "Content-Type": "multipart/form-data" },
                    });

                    console.log('Upload response:', data);

                    if (data.success) {
                      setShowUploadModal(false);
                      setPdfFile(null);

                      const userId = getUserId();

                      // If the upload response already contains a credit profile, use it directly
                      if (data.data?.creditProfile?.creditScore) {
                        console.log('✅ Credit score from upload response:', data.data.creditProfile.creditScore);
                        try {
                          // Fetch the full enriched profile (includes financialSummary, riskAnalysis etc.)
                          const creditResponse = await axios.get(`/api/credit/${userId}`);
                          if (creditResponse.data.success && creditResponse.data.data) {
                            setCreditData(creditResponse.data.data);
                            navigate("/credit-analysis", {
                              state: {
                                creditData: creditResponse.data.data,
                                financialSummary: creditResponse.data.data.financialSummary || {}
                              }
                            });
                            return;
                          }
                        } catch (_) {}
                        // Fallback: use the profile straight from upload response
                        setCreditData(data.data.creditProfile);
                        navigate("/credit-analysis", {
                          state: {
                            creditData: data.data.creditProfile,
                            financialSummary: {}
                          }
                        });
                        return;
                      }

                      // Credit calculation during upload failed — explicitly trigger it now
                      try {
                        console.log('📊 Credit not in upload response, calling /api/credit/calculate...');
                        const calcRes = await axios.post("/api/credit/calculate", { userId });
                        console.log('✅ Calculate response:', calcRes.data);
                        const creditResponse = await axios.get(`/api/credit/${userId}`);
                        if (creditResponse.data.success && creditResponse.data.data) {
                          setCreditData(creditResponse.data.data);
                          navigate("/credit-analysis", {
                            state: {
                              creditData: creditResponse.data.data,
                              financialSummary: creditResponse.data.data.financialSummary || {}
                            }
                          });
                        } else {
                          alert("Statement uploaded. Click \"View Credit Report\" to load your score.");
                          fetchCreditData();
                          fetchExpenses();
                          fetchStats();
                        }
                      } catch (creditError) {
                        console.error('Credit calculation error:', creditError?.response?.data || creditError.message);
                        alert(`Statement uploaded. Credit score error: ${creditError?.response?.data?.error || creditError.message}`);
                        fetchExpenses();
                        fetchStats();
                      }
                    } else {
                      alert(data.error || "Upload failed");
                    }
                  } catch (error) {
                    console.error('Upload error:', error);
                    const errorMsg = error?.response?.data?.error || error?.message || "Upload failed. Please try again.";
                    alert(errorMsg);
                  } finally {
                    setPdfUploading(false);
                  }
                }}
                disabled={!pdfFile || pdfUploading}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {pdfUploading ? "Uploading..." : "Upload Statement"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
