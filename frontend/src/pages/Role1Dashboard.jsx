import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import CreditPolicyBot from "../components/CreditPolicyBot";

export default function Role1Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [creditData, setCreditData] = useState(null);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [savingsGoal, setSavingsGoal] = useState(10000);
  const [showEditGoal, setShowEditGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(10000);
  
  const [newExpense, setNewExpense] = useState({
    category: "food",
    amount: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    paymentMethod: "cash",
  });

  const addSampleExpenses = async () => {
    const sampleExpenses = [
      { category: "food", amount: 250, description: "Lunch at cafe", date: new Date().toISOString().split('T')[0], paymentMethod: "upi" },
      { category: "transport", amount: 150, description: "Cab ride", date: new Date(Date.now() - 86400000).toISOString().split('T')[0], paymentMethod: "cash" },
      { category: "utilities", amount: 500, description: "Mobile recharge", date: new Date(Date.now() - 172800000).toISOString().split('T')[0], paymentMethod: "card" },
      { category: "entertainment", amount: 300, description: "Movie ticket", date: new Date(Date.now() - 259200000).toISOString().split('T')[0], paymentMethod: "upi" },
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

  const categories = ["food", "transport", "utilities", "entertainment", "healthcare", "education", "other"];
  const paymentMethods = ["cash", "card", "upi", "other"];

  useEffect(() => {
    fetchExpenses();
    fetchStats();
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
      await axios.post("/api/expenses", newExpense);
      setShowAddExpense(false);
      setNewExpense({
        category: "food",
        amount: "",
        description: "",
        date: new Date().toISOString().split('T')[0],
        paymentMethod: "cash",
      });
      fetchExpenses();
      fetchStats();
    } catch (error) {
      alert("Error adding expense: " + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm("Delete this expense?")) return;
    try {
      await axios.delete(`/api/expenses/${id}`);
      fetchExpenses();
      fetchStats();
    } catch (error) {
      alert("Error deleting expense");
    }
  };

  const handleCSVUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      alert("Please select a CSV file");
      return;
    }

    const formData = new FormData();
    formData.append("bankStatement", csvFile);

    setUploadLoading(true);
    try {
      const { data } = await axios.post("/api/user/upload-statement", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      // Store the complete data
      setCreditData(data.creditScore);
      setFinancialSummary(data.financialSummary);
      
      // Navigate to analysis page
      navigate("/credit-analysis", {
        state: {
          creditData: data.creditScore,
          financialSummary: data.financialSummary
        }
      });
    } catch (error) {
      alert("Error uploading CSV: " + (error.response?.data?.message || error.message));
    } finally {
      setUploadLoading(false);
      setCsvFile(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Financial Health Calculation Functions
  const getFinancialHealth = () => {
    if (creditData) {
      if (creditData.score >= 75) return { status: "Excellent", color: "green", icon: "✓", detail: "Your financial health is outstanding" };
      if (creditData.score >= 50) return { status: "Stable", color: "blue", icon: "→", detail: "Good financial habits detected" };
      return { status: "Needs Attention", color: "yellow", icon: "!", detail: "Focus on reducing expenses and increasing consistency" };
    }
    
    // No credit data uploaded
    return { status: "Pre-Assessment", color: "gray", icon: "○", detail: "Upload bank statement to generate insights" };
  };

  const getCreditReadiness = () => {
    if (creditData) {
      if (creditData.score >= 70) return { status: "Eligible", color: "green", detail: `₹${creditData.eligibleCreditAmount?.toLocaleString()} pre-approved credit available` };
      if (creditData.score >= 50) return { status: "Partially Eligible", color: "yellow", detail: "Qualified for small loans with standard rates" };
      return { status: "Building Eligibility", color: "orange", detail: "Continue improving financial patterns for approval" };
    }
    
    // No credit data uploaded
    return { status: "Upload Statement", color: "gray", detail: "Bank statement required for credit assessment" };
  };

  const getRiskLevel = () => {
    if (creditData) {
      const level = creditData.riskLevel || "Medium";
      const colors = { "Low": "green", "Medium": "yellow", "High": "red" };
      const details = {
        "Low": "Low default risk based on stable income and controlled spending",
        "Medium": "Moderate risk profile with room for improvement",
        "High": "Higher risk due to expense patterns or income inconsistency"
      };
      return { level, color: colors[level] || "yellow", detail: details[level] || "Risk calculated from spending behavior" };
    }
    
    // No credit data uploaded
    return { level: "Not Evaluated", color: "gray", detail: "Risk assessment requires bank statement data" };
  };

  const getSmartInsights = () => {
    const insights = [];
    
    if (creditData && financialSummary) {
      // Income consistency insight
      if (financialSummary.incomeConsistencyScore >= 70) {
        insights.push({
          type: "positive",
          icon: "✓",
          title: "Strong Income Consistency",
          detail: `${financialSummary.incomeConsistencyScore}% consistency boosts lender confidence`
        });
      } else if (financialSummary.incomeConsistencyScore) {
        insights.push({
          type: "warning",
          icon: "!",
          title: "Irregular Income Pattern",
          detail: "More consistent earnings improve credit eligibility"
        });
      }
      
      // Expense ratio insight
      const expenseRatio = financialSummary.expenseToIncomeRatio || 0;
      if (expenseRatio < 0.5) {
        insights.push({
          type: "positive",
          icon: "✓",
          title: "Healthy Expense Management",
          detail: `${Math.round(expenseRatio * 100)}% expense ratio is excellent`
        });
      } else {
        insights.push({
          type: "warning",
          icon: "!",
          title: "High Expense Ratio",
          detail: `${Math.round(expenseRatio * 100)}% - Consider reducing expenses below 50%`
        });
      }
      
      // Work days insight
      if (financialSummary.activeWorkDays >= 20) {
        insights.push({
          type: "positive",
          icon: "✓",
          title: "Regular Activity",
          detail: `${financialSummary.activeWorkDays} active days shows commitment`
        });
      }
    } else {
      // Default insights when no credit data
      insights.push({
        type: "info",
        icon: "📊",
        title: "Get Your Credit Score",
        detail: "Upload your bank statement (CSV format) for instant credit assessment"
      });
      
      insights.push({
        type: "info",
        icon: "🔒",
        title: "Secure & Private Analysis",
        detail: "Your financial data is analyzed locally and never shared with third parties"
      });
      
      insights.push({
        type: "info",
        icon: "⚡",
        title: "Designed for Gig Workers",
        detail: "Unlike traditional credit bureaus, we understand irregular income patterns"
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
        title: "Calculate Your Credit Score",
        detail: "Upload bank statement to get instant credit assessment",
        action: "Upload Now",
        onClick: () => setShowUploadForm(true)
      });
    } else if (creditData.score < 70) {
      actions.push({
        priority: "medium",
        icon: "📈",
        title: "Improve Your Score",
        detail: `Current score: ${creditData.score}/100 - Track more consistent income`,
        action: "View Tips"
      });
    }
    
    if (stats?.totalExpenses && financialSummary?.averageMonthlyIncome) {
      const ratio = stats.totalExpenses / financialSummary.averageMonthlyIncome;
      if (ratio > 0.5) {
        actions.push({
          priority: "medium",
          icon: "💰",
          title: "Reduce Expense Ratio",
          detail: `Currently at ${Math.round(ratio * 100)}% - Target below 50% for better rates`,
          action: "Track Expenses"
        });
      }
    }
    
    if (!creditData && expenses.length > 0) {
      actions.push({
        priority: "low",
        icon: "📝",
        title: "Optional: Track Daily Expenses",
        detail: "While not required for credit score, expense tracking helps you manage finances",
        action: "Add Expense",
        onClick: () => setShowAddExpense(true)
      });
    }
    
    if (actions.length === 0) {
      actions.push({
        priority: "low",
        icon: "🎉",
        title: "You're Doing Great!",
        detail: "Keep maintaining your financial discipline",
        action: "View Analysis",
        onClick: () => creditData && navigate("/credit-analysis", { state: { creditData, financialSummary } })
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-blue-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-900" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-white">CreditFlow</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-white text-sm">Welcome, {user?.name}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Quick Actions Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <button className="flex items-center justify-center gap-2 bg-white p-3 rounded-lg shadow hover:shadow-md transition border border-gray-200">
            <svg className="w-5 h-5 text-blue-900" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
            <span className="text-sm font-medium text-gray-700">Upload Statement</span>
          </button>
          <button 
            onClick={() => navigate('/credit-analysis')}
            className="flex items-center justify-center gap-2 bg-white p-3 rounded-lg shadow hover:shadow-md transition border border-gray-200 hover:border-blue-300"
          >
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
            </svg>
            <span className="text-sm font-medium text-gray-700">View Credit Report</span>
          </button>
          <button 
            onClick={() => {
              const chatbot = document.querySelector('[data-chatbot-icon]');
              if (chatbot) {
                chatbot.click();
                chatbot.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }}
            className="flex items-center justify-center gap-2 bg-white p-3 rounded-lg shadow hover:shadow-md transition border border-gray-200 hover:border-green-300"
          >
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
            </svg>
            <span className="text-sm font-medium text-gray-700">Learning Center</span>
          </button>
          <button 
            onClick={() => {
              alert(`Account: ${user?.name || 'User'}\nEmail: ${user?.email || 'N/A'}\nRole: ${user?.role || 'Gig Worker'}`);
            }}
            className="flex items-center justify-center gap-2 bg-white p-3 rounded-lg shadow hover:shadow-md transition border border-gray-200 hover:border-purple-300"
          >
            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
            </svg>
            <span className="text-sm font-medium text-gray-700">My Account</span>
          </button>
        </div>

        {/* Welcome Banner with Insights */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg shadow-md p-6 mb-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.name}! 👋</h2>
              <p className="text-blue-100 text-sm mb-4">Track your financial journey and build your credit score with every transaction.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                    <span className="text-xs font-semibold">Did you know?</span>
                  </div>
                  <p className="text-xs text-blue-100">Regular income tracking can improve your credit score by up to 30%</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-xs font-semibold">Pro Tip</span>
                  </div>
                  <p className="text-xs text-blue-100">Keep your expense ratio below 50% to qualify for better loan rates</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-xs font-semibold">Your Goal</span>
                  </div>
                  <p className="text-xs text-blue-100">Upload your bank statement to get your personalized credit score</p>
                </div>
              </div>
            </div>
            {!creditData && (
              <button
                onClick={() => setShowUploadForm(!showUploadForm)}
                className="ml-4 px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-blue-900 rounded-lg font-bold shadow-lg transition text-sm whitespace-nowrap"
              >
                Calculate My Score
              </button>
            )}
          </div>
        </div>

        {/* Upload Form - Only shown when Calculate Score is clicked */}
        {showUploadForm && !creditData && (
          <div className="bg-white rounded-lg shadow-md p-5 mb-6 border-l-4 border-yellow-400">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold text-blue-900">Upload Bank Statement</h2>
                <p className="text-xs text-gray-600 mt-1">Upload your CSV file to calculate your credit score instantly</p>
              </div>
              <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <form onSubmit={handleCSVUpload} className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files[0])}
                className="flex-1 text-sm px-3 py-2 border-2 border-blue-200 rounded-lg text-gray-700 focus:border-blue-900 focus:outline-none"
              />
              <button
                type="submit"
                disabled={uploadLoading || !csvFile}
                className="px-6 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-medium shadow transition disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
              >
                {uploadLoading ? "Analyzing..." : "Analyze Now"}
              </button>
            </form>
          </div>
        )}

        {/* Future Integration Informational Note */}
        {!creditData && (
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg shadow-sm p-4 mb-6 border border-indigo-200">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-indigo-900 mb-1">Future Enhancement</h3>
                <p className="text-xs text-gray-700 leading-relaxed">
                  In future versions, we plan to integrate directly with gig platforms (e.g., food delivery and ride-hailing companies) 
                  to securely access earnings data with user consent. This will enable real-time credit monitoring and automatic score updates.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Financial Health Snapshot */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Financial Health Status */}
          <div className={`bg-white rounded-lg shadow-md p-5 border-l-4 border-${financialHealth.color}-500`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full bg-${financialHealth.color}-100 flex items-center justify-center`}>
                  <span className={`text-${financialHealth.color}-600 text-xl font-bold`}>{financialHealth.icon}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600">Financial Health</p>
                  <p className={`text-lg font-bold text-${financialHealth.color}-700`}>{financialHealth.status}</p>
                </div>
              </div>
              <svg className={`w-6 h-6 text-${financialHealth.color}-500`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
              </svg>
            </div>
            <p className="text-xs text-gray-600">{financialHealth.detail}</p>
          </div>

          {/* Credit Readiness */}
          <div className={`bg-white rounded-lg shadow-md p-5 border-l-4 border-${creditReadiness.color}-500`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full bg-${creditReadiness.color}-100 flex items-center justify-center`}>
                  <svg className={`w-6 h-6 text-${creditReadiness.color}-600`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600">Credit Readiness</p>
                  <p className={`text-lg font-bold text-${creditReadiness.color}-700`}>{creditReadiness.status}</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-600">{creditReadiness.detail}</p>
          </div>

          {/* Risk Level */}
          <div className={`bg-white rounded-lg shadow-md p-5 border-l-4 border-${riskLevel.color}-500`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full bg-${riskLevel.color}-100 flex items-center justify-center`}>
                  <svg className={`w-6 h-6 text-${riskLevel.color}-600`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600">Risk Assessment</p>
                  <p className={`text-lg font-bold text-${riskLevel.color}-700`}>{riskLevel.level} Risk</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-600">{riskLevel.detail}</p>
          </div>
        </div>

        {/* Smart Financial Insights */}
        <div className="bg-white rounded-lg shadow-md p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-blue-900" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
            </svg>
            <h2 className="text-lg font-bold text-blue-900">Smart Financial Insights</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {smartInsights.map((insight, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  insight.type === 'positive' ? 'bg-green-50 border-green-500' :
                  insight.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                  'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`text-2xl ${
                    insight.type === 'positive' ? 'text-green-600' :
                    insight.type === 'warning' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`}>
                    {insight.icon}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900 mb-1">{insight.title}</h3>
                    <p className="text-xs text-gray-600">{insight.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Best Actions */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg shadow-md p-5 mb-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
            </svg>
            <h2 className="text-lg font-bold">Recommended Actions</h2>
          </div>
          <div className="space-y-3">
            {nextActions.map((action, index) => (
              <div 
                key={index}
                className={`bg-white/10 backdrop-blur-sm rounded-lg p-4 ${
                  action.priority === 'high' ? 'border-2 border-yellow-400' : 'border border-white/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-2xl">{action.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold">{action.title}</h3>
                        {action.priority === 'high' && (
                          <span className="px-2 py-0.5 bg-yellow-400 text-blue-900 text-xs font-bold rounded">Priority</span>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-900 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600">Total Expenses</span>
              <svg className="w-5 h-5 text-blue-900" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
              </svg>
            </div>
            <div className="text-2xl font-bold text-blue-900">₹{(stats?.totalExpenses || expenses.reduce((sum, e) => sum + e.amount, 0))?.toLocaleString()}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-400 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600">Transactions</span>
              <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            </div>
            <div className="text-2xl font-bold text-blue-900">{expenses.length}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600">Daily Average</span>
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"/>
              </svg>
            </div>
            <div className="text-2xl font-bold text-blue-900">₹{stats?.dailyAverage?.toFixed(0) || 0}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500 hover:shadow-lg transition cursor-pointer" onClick={() => { setShowEditGoal(true); setTempGoal(savingsGoal); }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600">Savings Goal</span>
              <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            </div>
            <div className="text-2xl font-bold text-blue-900 mb-2">₹{savingsGoal.toLocaleString()}</div>
            
            {/* Calculate savings (income - expenses if we have financial data, or estimate) */}
            {(() => {
              const totalExpenses = stats?.totalExpenses || expenses.reduce((sum, e) => sum + e.amount, 0);
              const estimatedIncome = financialSummary?.averageMonthlyIncome || (totalExpenses > 0 ? totalExpenses * 1.5 : 15000);
              const savedAmount = Math.max(0, estimatedIncome - totalExpenses);
              const progressPercent = Math.min(100, (savedAmount / savingsGoal) * 100);
              
              return (
                <>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">Saved: ₹{savedAmount.toLocaleString()}</span>
                    <span className="text-xs font-bold text-purple-600">{progressPercent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Click to edit goal</p>
                </>
              );
            })()}
          </div>
        </div>

        {/* Category Breakdown */}
        {stats?.categoryBreakdown && (
          <div className="bg-white rounded-lg shadow-md p-5 mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <svg className="w-5 h-5 text-blue-900" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
              </svg>
              <h2 className="text-lg font-bold text-blue-900">Category Breakdown</h2>
            </div>
            <div className="space-y-3">
              {Object.entries(stats.categoryBreakdown).map(([category, amount]) => (
                <div key={category}>
                  <div className="flex justify-between mb-1">
                    <span className="capitalize font-medium text-gray-700 text-sm">{category}</span>
                    <span className="font-bold text-blue-900 text-sm">₹{amount.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-900 to-yellow-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(amount / stats.totalExpenses) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Savings Goal Edit Modal */}
        {showEditGoal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditGoal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-blue-900">Edit Savings Goal</h3>
                <button onClick={() => setShowEditGoal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Monthly Savings Target</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setTempGoal(Math.max(1000, tempGoal - 1000))}
                    className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-2xl font-bold text-gray-700 transition"
                  >
                    -
                  </button>
                  <div className="flex-1">
                    <input
                      type="number"
                      value={tempGoal}
                      onChange={(e) => setTempGoal(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full text-center text-3xl font-bold text-blue-900 border-2 border-purple-200 rounded-lg py-3 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => setTempGoal(tempGoal + 1000)}
                    className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-2xl font-bold text-gray-700 transition"
                  >
                    +
                  </button>
                </div>
                
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {[5000, 10000, 20000, 50000].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setTempGoal(amount)}
                      className={`py-2 rounded-lg text-sm font-medium transition ${
                        tempGoal === amount 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      ₹{(amount/1000)}k
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-purple-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                  <div>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      Set a realistic monthly savings goal based on your income and expenses. Track your progress and adjust as needed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditGoal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setSavingsGoal(tempGoal);
                    setShowEditGoal(false);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-medium shadow-md transition"
                >
                  Save Goal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-blue-900" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
            </svg>
            <h2 className="text-lg font-bold text-blue-900">Your Expenses</h2>
          </div>
          <button
            onClick={() => setShowAddExpense(!showAddExpense)}
            className="px-5 py-2 bg-yellow-400 hover:bg-yellow-500 text-blue-900 rounded-lg font-medium shadow transition text-sm"
          >
            {showAddExpense ? "Cancel" : "+ Add Expense"}
          </button>
        </div>

        {/* Add Expense Form */}
        {showAddExpense && (
          <div className="bg-white rounded-lg shadow-md p-5 mb-6 border-l-4 border-yellow-400">
            <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg text-gray-700 focus:border-blue-900 focus:outline-none text-sm"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  required
                  min="1"
                  className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg text-gray-700 focus:border-blue-900 focus:outline-none text-sm"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg text-gray-700 focus:border-blue-900 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Method</label>
                <select
                  value={newExpense.paymentMethod}
                  onChange={(e) => setNewExpense({ ...newExpense, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg text-gray-700 focus:border-blue-900 focus:outline-none text-sm"
                >
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg text-gray-700 focus:border-blue-900 focus:outline-none text-sm"
                  placeholder="Optional description..."
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-medium shadow transition text-sm"
                >
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Expenses List */}
        <div className="bg-white rounded-lg shadow-md p-5">
          {expenses.length === 0 ? (
            <div className="text-center py-10">
              <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-semibold text-gray-700 mb-2">No expenses tracked yet</p>
              <p className="text-sm text-gray-500 mb-6">Start tracking your daily expenses to manage your finances better</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <button
                  onClick={() => setShowAddExpense(true)}
                  className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-medium shadow transition text-sm"
                >
                  Add Your First Expense
                </button>
                <button
                  onClick={addSampleExpenses}
                  className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium shadow-sm transition text-sm border border-gray-300"
                >
                  Load Sample Data
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div
                  key={expense._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-l-4 border-blue-900 hover:shadow-md transition"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100">
                        <svg className="w-5 h-5 text-blue-900" fill="currentColor" viewBox="0 0 20 20">
                          {expense.category === "food" && <path d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"/>}
                          {expense.category === "transport" && <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>}
                          {expense.category === "utilities" && <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z"/>}
                          {["entertainment", "healthcare", "education", "other"].includes(expense.category) && (
                            <>
                              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                            </>
                          )}
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold capitalize text-blue-900 text-sm">{expense.category}</div>
                        <div className="text-xs text-gray-600">
                          {expense.description || "No description"} • {new Date(expense.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">-₹{expense.amount}</div>
                      <div className="text-xs text-gray-500 uppercase">{expense.paymentMethod}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteExpense(expense._id)}
                      className="p-2 bg-red-100 hover:bg-red-600 hover:text-white text-red-600 rounded-lg transition"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Credit Policy Assistant */}
      <CreditPolicyBot />
    </div>
  );
}

