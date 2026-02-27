import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Navbar from "../components/Navbar";

export default function CreditAnalysis() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { creditData, financialSummary } = location.state || {};

  // Helper function to safely get values with defaults
  const safeGet = (value, defaultValue = 0) => {
    if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
      return defaultValue;
    }
    return value;
  };

  const monthlyIncome = safeGet(financialSummary?.monthlyAvgIncome || financialSummary?.averageMonthlyIncome, 30000);
  const totalIncome = safeGet(financialSummary?.totalIncome, monthlyIncome * 3);
  const totalExpenses = safeGet(financialSummary?.totalExpenses, monthlyIncome * 1.2);
  const expenseRatio = safeGet(totalIncome > 0 ? totalExpenses / totalIncome : 0, 0.4);

  const consistencyScore = safeGet(
    creditData?.metrics?.incomeConsistency?.value ||
    creditData?.metrics?.avgMonthlyIncome?.score ||
    financialSummary?.incomeConsistencyScore,
    75
  );

  const workDays = safeGet(
    creditData?.metrics?.activeWorkDays?.value ||
    financialSummary?.activeWorkDays,
    22
  );

  const [simulatedIncome, setSimulatedIncome] = useState(monthlyIncome);
  const [simulatedExpenses, setSimulatedExpenses] = useState(monthlyIncome * expenseRatio);
  const [simulatedWorkDays, setSimulatedWorkDays] = useState(workDays);

  useEffect(() => {
    if (financialSummary || creditData) {
      setSimulatedIncome(monthlyIncome);
      setSimulatedExpenses(monthlyIncome * expenseRatio);
      setSimulatedWorkDays(workDays);
    }
  }, [financialSummary, creditData]);

  useEffect(() => {
    if (!creditData || !financialSummary) {
      navigate("/dashboard");
    }
  }, [creditData, financialSummary, navigate]);

  if (!creditData || !financialSummary) return null;

  // Theme helpers
  const bg = isDark ? "bg-gray-950" : "bg-gray-50";
  const card = isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200";
  const cardShadow = isDark ? "bg-gray-900 shadow-md" : "bg-white shadow-md";
  const headingColor = isDark ? "text-white" : "text-gray-900";
  const subText = isDark ? "text-gray-400" : "text-gray-600";
  const mutedText = isDark ? "text-gray-500" : "text-gray-500";
  const labelText = isDark ? "text-gray-300" : "text-gray-700";
  const borderColor = isDark ? "border-gray-700" : "border-gray-200";
  const tooltipStyle = {
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
    borderRadius: '8px',
    fontSize: '12px',
    color: isDark ? '#f9fafb' : '#111827',
  };

  const getRiskColor = (level) => {
    if (isDark) {
      switch (level) {
        case 'Low': return 'text-green-400 bg-green-900/30 border-green-700';
        case 'Medium': return 'text-yellow-400 bg-yellow-900/30 border-yellow-700';
        case 'High': return 'text-red-400 bg-red-900/30 border-red-700';
        default: return 'text-gray-400 bg-gray-800 border-gray-700';
      }
    }
    switch (level) {
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      case 'Medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getScoreColor = (score) => {
    const normalizedScore = score > 100 ? (score / 1000) * 100 : score;
    if (normalizedScore >= 75) return isDark ? 'text-green-400' : 'text-green-600';
    if (normalizedScore >= 50) return isDark ? 'text-yellow-400' : 'text-yellow-600';
    return isDark ? 'text-red-400' : 'text-red-600';
  };

  const calculateSimulatedScore = () => {
    if (!financialSummary) return 0;
    const expenseRatio = simulatedExpenses / simulatedIncome;
    const consistencyScore = Math.min(100, (simulatedWorkDays / 30) * 100);
    const savingsRate = Math.max(0, 1 - expenseRatio);
    let score = 0;
    score += consistencyScore * 0.4;
    score += (simulatedWorkDays / 30) * 100 * 0.3;
    score += savingsRate * 100 * 0.2;
    score += Math.min(100, (simulatedIncome / 30000) * 100) * 0.1;
    return Math.round(Math.min(100, Math.max(0, score)));
  };

  const simulatedScore = calculateSimulatedScore();
  const simulatedCreditAmount = Math.round((simulatedScore / 100) * 200000);
  const scoreChange = simulatedScore - (creditData?.score || 0);

  const scoreBreakdownData = [
    { name: 'Income Consistency', value: Math.round(safeGet(consistencyScore, 0)), color: '#1e3a8a' },
    { name: 'Work Days', value: Math.round(safeGet((workDays / 30) * 100, 0)), color: '#fbbf24' },
    { name: 'Expense Control', value: Math.round(safeGet((1 - expenseRatio) * 100, 50)), color: '#10b981' },
    { name: 'Balance Stability', value: Math.round(safeGet(((creditData?.score || creditData?.creditScore || 50) / 100) * 80, 40)), color: '#8b5cf6' }
  ];

  const incomeExpenseData = [
    { month: 'Month 1', income: monthlyIncome * 0.9, expenses: monthlyIncome * expenseRatio * 0.85 },
    { month: 'Month 2', income: monthlyIncome * 0.95, expenses: monthlyIncome * expenseRatio * 0.9 },
    { month: 'Month 3', income: monthlyIncome, expenses: monthlyIncome * expenseRatio }
  ];

  const categorizeFactors = () => {
    if (!creditData?.explanation) return { helping: [], holding: [] };
    const helpingKeywords = ['consistent', 'good', 'stable', 'regular', 'maintain', 'adequate'];
    const holdingKeywords = ['high', 'low', 'reduce', 'increase', 'improve', 'irregular'];
    const helping = [];
    const holding = [];
    creditData.explanation.forEach(factor => {
      const lower = factor.toLowerCase();
      const isHelping = helpingKeywords.some(kw => lower.includes(kw));
      const isHolding = holdingKeywords.some(kw => lower.includes(kw));
      if (isHelping && !isHolding) helping.push(factor);
      else if (isHolding) holding.push(factor);
      else helping.push(factor);
    });
    return { helping, holding };
  };

  const { helping, holding } = categorizeFactors();

  const getImprovementTimeline = () => {
    if (!financialSummary || !creditData) return [];
    const timeline = [];
    const currentScore = creditData.score || 0;
    if (financialSummary.activeWorkDays < 25) {
      timeline.push({ timeframe: '2 weeks', action: 'Work 25+ days consistently', impact: '+5 to +8 points', newScore: Math.min(100, currentScore + 6) });
    }
    if (financialSummary.expenseToIncomeRatio > 0.6) {
      timeline.push({ timeframe: '1 month', action: 'Reduce expenses by 10%', impact: '+8 to +12 points', newScore: Math.min(100, currentScore + 10) });
    }
    if (financialSummary.averageMonthlyIncome < 40000) {
      timeline.push({ timeframe: '2 months', action: 'Increase income streams', impact: '+10 to +15 points', newScore: Math.min(100, currentScore + 12) });
    }
    timeline.push({ timeframe: '3 months', action: 'Maintain all improvements', impact: '+15 to +20 points', newScore: Math.min(100, currentScore + 18) });
    return timeline;
  };

  const improvementTimeline = getImprovementTimeline();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${bg}`}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/dashboard")}
            className={`flex items-center text-sm font-medium transition ${isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-900 hover:text-blue-700"}`}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        {/* Page Title */}
        <div className="mb-6">
          <h1 className={`text-2xl font-bold ${headingColor}`}>Credit Score Analysis</h1>
          <p className={`text-sm mt-1 ${subText}`}>Complete financial assessment based on your bank statement</p>
        </div>

        {/* Main Score Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className={`lg:col-span-2 rounded-xl shadow-md p-6 border-l-4 border-blue-900 ${cardShadow} border ${borderColor}`}>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="text-center md:text-left">
                <div className={`text-sm font-semibold mb-2 ${subText}`}>Your Credit Score</div>
                <div className={`text-6xl font-bold mb-2 ${getScoreColor(creditData.creditScore || creditData.score || 0)}`}>
                  {Math.round(safeGet(creditData.creditScore || creditData.score, 0))}
                </div>
                <div className={`text-xs ${mutedText}`}>out of 850</div>
                <div className={`inline-block mt-3 px-4 py-1 rounded-full border text-sm font-semibold ${getRiskColor(creditData.riskLevel)}`}>
                  {creditData.riskLevel || 'Medium'} Risk
                </div>
              </div>
              <div className="flex-1 w-full">
                <div className={`rounded-lg p-4 ${isDark ? "bg-yellow-900/20 border border-yellow-800" : "bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-semibold ${isDark ? "text-yellow-300" : "text-yellow-900"}`}>Eligible Credit</span>
                    <svg className={`w-5 h-5 ${isDark ? "text-yellow-400" : "text-yellow-700"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className={`text-3xl font-bold ${isDark ? "text-yellow-300" : "text-yellow-900"}`}>₹{creditData.eligibleCreditAmount?.toLocaleString()}</div>
                  <div className={`text-xs mt-1 ${isDark ? "text-yellow-400" : "text-yellow-800"}`}>Pre-approved loan amount</div>
                </div>
                <div className={`mt-4 flex items-center justify-between text-xs`}>
                  <span className={subText}>Processing Time</span>
                  <span className={`font-semibold ${isDark ? "text-blue-400" : "text-blue-900"}`}>24-48 hours</span>
                </div>
                <div className={`flex items-center justify-between text-xs mt-2`}>
                  <span className={subText}>Interest Rate</span>
                  <span className={`font-semibold ${isDark ? "text-blue-400" : "text-blue-900"}`}>
                    {creditData.riskLevel === 'Low' ? '12-15%' : creditData.riskLevel === 'Medium' ? '15-18%' : '18-22%'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-xl shadow-md p-6 border ${card}`}>
            <h3 className={`text-sm font-bold mb-4 ${headingColor}`}>Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full px-4 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-medium transition text-sm">
                Apply for Loan
              </button>
              <button className={`w-full px-4 py-3 border-2 rounded-lg font-medium transition text-sm ${isDark ? "border-blue-700 text-blue-400 hover:bg-blue-900/30" : "border-blue-900 text-blue-900 hover:bg-blue-50"}`}>
                Download Report
              </button>
              <button className={`w-full px-4 py-3 border-2 rounded-lg font-medium transition text-sm ${isDark ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
                Share Analysis
              </button>
            </div>
          </div>
        </div>

        {/* Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Monthly Income', value: `₹${Math.round(monthlyIncome).toLocaleString()}`, sub: 'Average per month', accent: 'border-blue-600', icon: 'M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z', iconColor: 'text-blue-600' },
            { label: 'Consistency Score', value: `${Math.round(consistencyScore)}%`, sub: 'Income reliability', accent: 'border-green-500', icon: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z', iconColor: 'text-green-500' },
            { label: 'Work Days', value: `${Math.round(workDays)}`, sub: 'Days per month', accent: 'border-yellow-500', icon: 'M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z', iconColor: 'text-yellow-500' },
            { label: 'Expense Ratio', value: `${(expenseRatio * 100).toFixed(0)}%`, sub: 'Of total income', accent: 'border-purple-500', icon: 'M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z', iconColor: 'text-purple-500' },
          ].map((metric) => (
            <div key={metric.label} className={`rounded-lg shadow-md p-4 border-l-4 ${metric.accent} ${isDark ? "bg-gray-900" : "bg-white"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${subText}`}>{metric.label}</span>
                <svg className={`w-4 h-4 ${metric.iconColor}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d={metric.icon} clipRule="evenodd" />
                </svg>
              </div>
              <div className={`text-2xl font-bold ${headingColor}`}>{metric.value}</div>
              <div className={`text-xs mt-1 ${mutedText}`}>{metric.sub}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className={`rounded-xl shadow-md p-6 border ${card}`}>
            <h3 className={`text-lg font-bold mb-4 ${headingColor}`}>Score Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={scoreBreakdownData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {scoreBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {scoreBreakdownData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className={`text-xs ${labelText}`}>{item.name}</span>
                  <span className={`text-xs font-bold ${headingColor}`}>{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`rounded-xl shadow-md p-6 border ${card}`}>
            <h3 className={`text-lg font-bold mb-4 ${headingColor}`}>Income vs Expenses Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={incomeExpenseData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: isDark ? "#9ca3af" : "#4b5563" }} />
                <YAxis tick={{ fontSize: 12, fill: isDark ? "#9ca3af" : "#4b5563" }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => `₹${value.toLocaleString()}`} />
                <Legend wrapperStyle={{ fontSize: '12px', color: isDark ? '#9ca3af' : '#4b5563' }} />
                <Bar dataKey="income" fill="#1e3a8a" name="Income" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#fbbf24" name="Expenses" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* What-If Simulation */}
        <div className={`rounded-xl shadow-md p-6 mb-6 border ${isDark ? "bg-blue-950/40 border-blue-900" : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"}`}>
          <div className="flex items-center gap-3 mb-6">
            <svg className={`w-6 h-6 ${isDark ? "text-blue-400" : "text-blue-900"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <div>
              <h3 className={`text-lg font-bold ${headingColor}`}>What-If Credit Simulation</h3>
              <p className={`text-xs ${subText}`}>Adjust variables to see how your score could change</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Income Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className={`text-sm font-semibold ${labelText}`}>Monthly Income</label>
                  <span className={`text-sm font-bold ${isDark ? "text-blue-400" : "text-blue-900"}`}>₹{simulatedIncome.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={Math.round((financialSummary.averageMonthlyIncome || 30000) * 0.5)}
                  max={Math.round((financialSummary.averageMonthlyIncome || 30000) * 1.5)}
                  step={1000}
                  value={simulatedIncome}
                  onChange={(e) => setSimulatedIncome(parseInt(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #1e3a8a 0%, #1e3a8a ${((simulatedIncome - Math.round((financialSummary.averageMonthlyIncome || 30000) * 0.5)) / (Math.round((financialSummary.averageMonthlyIncome || 30000) * 1.5) - Math.round((financialSummary.averageMonthlyIncome || 30000) * 0.5))) * 100}%, ${isDark ? "#374151" : "#dbeafe"} ${((simulatedIncome - Math.round((financialSummary.averageMonthlyIncome || 30000) * 0.5)) / (Math.round((financialSummary.averageMonthlyIncome || 30000) * 1.5) - Math.round((financialSummary.averageMonthlyIncome || 30000) * 0.5))) * 100}%, ${isDark ? "#374151" : "#dbeafe"} 100%)` }}
                />
                <div className={`flex justify-between text-xs mt-1 ${subText}`}>
                  <span>₹{Math.round((financialSummary.averageMonthlyIncome || 30000) * 0.5).toLocaleString()}</span>
                  <span>₹{Math.round((financialSummary.averageMonthlyIncome || 30000) * 1.5).toLocaleString()}</span>
                </div>
              </div>

              {/* Expenses Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className={`text-sm font-semibold ${labelText}`}>Monthly Expenses</label>
                  <span className={`text-sm font-bold ${isDark ? "text-blue-400" : "text-blue-900"}`}>₹{Math.round(simulatedExpenses).toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={Math.round((financialSummary.averageMonthlyIncome || 30000) * 0.2)}
                  max={Math.round((financialSummary.averageMonthlyIncome || 30000) * 0.8)}
                  step={1000}
                  value={simulatedExpenses}
                  onChange={(e) => setSimulatedExpenses(parseInt(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${((simulatedExpenses - Math.round((financialSummary.averageMonthlyIncome || 30000) * 0.2)) / (Math.round((financialSummary.averageMonthlyIncome || 30000) * 0.8) - Math.round((financialSummary.averageMonthlyIncome || 30000) * 0.2))) * 100}%, ${isDark ? "#374151" : "#fef3c7"} ${((simulatedExpenses - Math.round((financialSummary.averageMonthlyIncome || 30000) * 0.2)) / (Math.round((financialSummary.averageMonthlyIncome || 30000) * 0.8) - Math.round((financialSummary.averageMonthlyIncome || 30000) * 0.2))) * 100}%, ${isDark ? "#374151" : "#fef3c7"} 100%)` }}
                />
                <div className={`flex justify-between text-xs mt-1 ${subText}`}>
                  <span>₹{Math.round((financialSummary.averageMonthlyIncome || 30000) * 0.2).toLocaleString()}</span>
                  <span>₹{Math.round((financialSummary.averageMonthlyIncome || 30000) * 0.8).toLocaleString()}</span>
                </div>
              </div>

              {/* Work Days Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className={`text-sm font-semibold ${labelText}`}>Active Work Days</label>
                  <span className={`text-sm font-bold ${isDark ? "text-blue-400" : "text-blue-900"}`}>{simulatedWorkDays} days</span>
                </div>
                <input
                  type="range"
                  min={10} max={30} step={1}
                  value={simulatedWorkDays}
                  onChange={(e) => setSimulatedWorkDays(parseInt(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #10b981 0%, #10b981 ${((simulatedWorkDays - 10) / 20) * 100}%, ${isDark ? "#374151" : "#d1fae5"} ${((simulatedWorkDays - 10) / 20) * 100}%, ${isDark ? "#374151" : "#d1fae5"} 100%)` }}
                />
                <div className={`flex justify-between text-xs mt-1 ${subText}`}>
                  <span>10 days</span>
                  <span>30 days</span>
                </div>
              </div>
            </div>

            {/* Simulation Result */}
            <div className={`rounded-xl p-5 shadow-lg border-2 ${isDark ? "bg-gray-900 border-blue-800" : "bg-white border-blue-300"}`}>
              <div className="text-center mb-4">
                <div className={`text-xs font-semibold mb-2 ${subText}`}>Simulated Credit Score</div>
                <div className={`text-5xl font-bold ${getScoreColor(simulatedScore)}`}>{simulatedScore}</div>
                <div className={`mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold`}
                  style={{
                    backgroundColor: scoreChange >= 0 ? (isDark ? '#14532d' : '#dcfce7') : (isDark ? '#7f1d1d' : '#fee2e2'),
                    color: scoreChange >= 0 ? (isDark ? '#4ade80' : '#15803d') : (isDark ? '#f87171' : '#991b1b')
                  }}>
                  {scoreChange >= 0 ? '↑' : '↓'} {Math.abs(scoreChange)} points
                </div>
              </div>
              <div className={`border-t pt-4 ${borderColor}`}>
                <div className={`text-xs mb-1 ${subText}`}>Simulated Credit Amount</div>
                <div className={`text-2xl font-bold ${isDark ? "text-yellow-400" : "text-yellow-900"}`}>₹{simulatedCreditAmount.toLocaleString()}</div>
                <div className={`text-xs mt-3 ${subText}`}>
                  {scoreChange > 0 ? '✨ Great! Keep improving your metrics' :
                    scoreChange < 0 ? '⚠️ Your score may decrease with these changes' :
                      '→ No change from current score'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Improvement Timeline */}
        <div className={`rounded-xl shadow-md p-6 mb-6 border ${card}`}>
          <div className="flex items-center gap-3 mb-6">
            <svg className={`w-6 h-6 ${isDark ? "text-blue-400" : "text-blue-900"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <div>
              <h3 className={`text-lg font-bold ${headingColor}`}>Credit Improvement Timeline</h3>
              <p className={`text-xs ${subText}`}>Projected score growth with recommended actions</p>
            </div>
          </div>
          <div className="relative">
            <div className={`absolute left-6 top-0 bottom-0 w-0.5 ${isDark ? "bg-blue-900" : "bg-blue-200"}`}></div>
            <div className="space-y-6">
              {improvementTimeline.map((milestone, index) => (
                <div key={index} className="relative flex items-start gap-4 pl-2">
                  <div className={`absolute left-4 w-4 h-4 bg-blue-900 rounded-full border-4 ${isDark ? "border-gray-900" : "border-blue-100"}`}></div>
                  <div className={`ml-10 flex-1 rounded-lg p-4 border ${isDark ? "bg-blue-950/30 border-blue-900" : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${isDark ? "bg-blue-900 text-blue-300" : "bg-blue-200 text-blue-900"}`}>
                        {milestone.timeframe}
                      </span>
                      <span className={`text-lg font-bold ${isDark ? "text-green-400" : "text-green-600"}`}>{milestone.impact}</span>
                    </div>
                    <div className={`text-sm font-semibold mb-1 ${headingColor}`}>{milestone.action}</div>
                    <div className="flex items-center justify-between mt-3">
                      <span className={`text-xs ${subText}`}>Projected Score:</span>
                      <span className={`text-xl font-bold ${isDark ? "text-blue-400" : "text-blue-900"}`}>{milestone.newScore}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Score Factors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className={`rounded-xl shadow-md p-6 border ${card}`}>
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h3 className={`text-lg font-bold ${headingColor}`}>What's Helping Your Score</h3>
            </div>
            {helping.length > 0 ? (
              <div className="space-y-3">
                {helping.map((factor, index) => (
                  <div key={index} className={`flex items-start gap-3 p-3 rounded-lg border ${isDark ? "bg-green-900/20 border-green-800" : "bg-green-50 border-green-200"}`}>
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className={`text-sm ${labelText}`}>{factor}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-sm p-4 rounded-lg border ${isDark ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-700"}`}>
                <p className="font-semibold mb-1">Continue Building Your Credit</p>
                <p className={`text-xs ${subText}`}>As you maintain consistent income, positive factors will appear here.</p>
              </div>
            )}
          </div>

          <div className={`rounded-xl shadow-md p-6 border ${card}`}>
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <h3 className={`text-lg font-bold ${headingColor}`}>What's Holding It Back</h3>
            </div>
            {holding.length > 0 ? (
              <div className="space-y-3">
                {holding.map((factor, index) => (
                  <div key={index} className={`flex items-start gap-3 p-3 rounded-lg border ${isDark ? "bg-yellow-900/20 border-yellow-800" : "bg-yellow-50 border-yellow-200"}`}>
                    <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className={`text-sm ${labelText}`}>{factor}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-sm p-4 rounded-lg border ${isDark ? "bg-green-900/20 border-green-800 text-green-400" : "bg-green-50 border-green-200 text-green-700"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="font-semibold">Excellent! No Concerns Identified</p>
                </div>
                <p className={`text-xs ${subText}`}>Your financial profile shows strong fundamentals.</p>
              </div>
            )}
          </div>
        </div>

        {/* Peer Comparison */}
        <div className={`rounded-xl shadow-md p-6 mb-6 border ${card}`}>
          <h3 className={`text-lg font-bold mb-4 ${headingColor}`}>Peer Comparison</h3>
          <div className="space-y-4">
            {(() => {
              // Detect scale: if score > 100 assume 0–1000, else 0–100
              const maxScore = (creditData.score || 0) > 100 ? 1000 : 100;
              const avgGigWorker = maxScore === 1000 ? 550 : 55;
              const top10 = maxScore === 1000 ? 820 : 82;
              const userScore = safeGet(creditData.score, 0);

              const items = [
                { label: 'Your Score', value: userScore, display: Math.round(userScore), barClass: 'bg-gradient-to-r from-blue-900 to-yellow-400' },
                { label: 'Average Gig Worker', value: avgGigWorker, display: avgGigWorker, barClass: 'bg-gray-400' },
                { label: 'Top 10% Workers', value: top10, display: top10, barClass: 'bg-green-500' },
              ];

              return items.map((item) => {
                const pct = Math.min(100, (item.value / maxScore) * 100);
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className={subText}>{item.label}</span>
                      <span className={`font-semibold ${headingColor}`}>
                        {item.display}
                        <span className={`ml-1 text-xs font-normal ${subText}`}>/ {maxScore}</span>
                      </span>
                    </div>
                    <div className={`w-full rounded-full h-3 ${isDark ? "bg-gray-700" : "bg-gray-200"}`}>
                      <div
                        className={`${item.barClass} h-3 rounded-full transition-all duration-1000`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

      </div>
    </div>
  );
}
