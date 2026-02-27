import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function CreditAnalysis() {
  const { user, logout } = useAuth();
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

  // Extract values safely from financialSummary and creditData
  const monthlyIncome = safeGet(financialSummary?.monthlyAvgIncome || financialSummary?.averageMonthlyIncome, 30000);
  
  const totalIncome = safeGet(financialSummary?.totalIncome, monthlyIncome * 3);
  const totalExpenses = safeGet(financialSummary?.totalExpenses, monthlyIncome * 1.2);
  // Cap expenseRatio display at 200% max for sanity; store raw for calcs
  const expenseRatioRaw = safeGet(totalIncome > 0 ? totalExpenses / totalIncome : 0, 0.4);
  const expenseRatio = expenseRatioRaw; // kept for calculations
  
  // Derive consistency score from raw value using band thresholds (handles stale DB where score=0 but value>0)
  const rawConsistencyValue = Math.min(100, safeGet(creditData?.metrics?.incomeConsistency?.value, 0));
  const storedConsistencyScore = safeGet(creditData?.metrics?.incomeConsistency?.score, 0);
  const derivedConsistencyScore = rawConsistencyValue >= 91 ? 100
    : rawConsistencyValue >= 76 ? 80
    : rawConsistencyValue >= 61 ? 60
    : rawConsistencyValue >= 41 ? 40
    : rawConsistencyValue > 0  ? 20 : 0;
  const consistencyScore = storedConsistencyScore > 0 ? storedConsistencyScore : (derivedConsistencyScore || safeGet(financialSummary?.incomeConsistencyScore, 75));

  // Active work days - estimate from data
  const workDays = safeGet(
    creditData?.metrics?.activeWorkDays?.value ||
    financialSummary?.activeWorkDays,
    22
  );

  // What-If Simulation State
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

  if (!creditData || !financialSummary) {
    return null;
  }

  const getRiskColor = (level) => {
    switch (level) {
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      case 'Medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getScoreColor = (score) => {
    // Score is on 0-1000 scale — normalize to 0-100 for color thresholds
    const normalizedScore = score > 100 ? (score / 850) * 100 : score;
    
    if (normalizedScore >= 75) return 'text-green-600';
    if (normalizedScore >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Calculate simulated credit score on 0-1000 scale
  const calculateSimulatedScore = () => {
    if (!financialSummary) return 0;
    
    const simExpenseRatio = simulatedExpenses / simulatedIncome;
    const simConsistency = Math.min(100, (simulatedWorkDays / 30) * 100);
    const simSavings = Math.max(0, 1 - simExpenseRatio);
    
    let score = 0;
    score += simConsistency * 0.4;
    score += (simulatedWorkDays / 30) * 100 * 0.3;
    score += simSavings * 100 * 0.2;
    score += Math.min(100, (simulatedIncome / 30000) * 100) * 0.1;
    // Scale to 0-1000
    return Math.round(Math.min(1000, Math.max(0, score * 10)));
  };

  const simulatedScore = calculateSimulatedScore();
  const simulatedCreditAmount = Math.round((simulatedScore / 850) * 100000);
  const scoreChange = simulatedScore - safeGet(creditData?.score || creditData?.creditScore, 0);

  // Use actual scoreBreakdown from API (all 0-100) for the pie chart
  const scoreBreakdownData = [
    { name: 'Income Quality',    value: Math.max(0, Math.round(safeGet(creditData?.scoreBreakdown?.incomeQualityScore, 0))),    color: '#1e3a8a' },
    { name: 'Spending Behavior', value: Math.max(0, Math.round(safeGet(creditData?.scoreBreakdown?.spendingBehaviorScore, 0))), color: '#fbbf24' },
    { name: 'Liquidity',         value: Math.max(0, Math.round(safeGet(creditData?.scoreBreakdown?.liquidityScore, 0))),         color: '#10b981' },
    { name: 'Gig Stability',     value: Math.max(0, Math.round(safeGet(creditData?.scoreBreakdown?.gigStabilityScore, 0))),     color: '#8b5cf6' }
  ];

  const incomeExpenseData = [
    { month: 'Month 1', income: monthlyIncome * 0.9, expenses: monthlyIncome * expenseRatio * 0.85 },
    { month: 'Month 2', income: monthlyIncome * 0.95, expenses: monthlyIncome * expenseRatio * 0.9 },
    { month: 'Month 3', income: monthlyIncome, expenses: monthlyIncome * expenseRatio }
  ];

  // Categorize factors
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
      
      if (isHelping && !isHolding) {
        helping.push(factor);
      } else if (isHolding) {
        holding.push(factor);
      } else {
        helping.push(factor); // Default to helping
      }
    });
    
    return { helping, holding };
  };

  const { helping, holding } = categorizeFactors();

  // Generate improvement timeline
  const getImprovementTimeline = () => {
    if (!financialSummary || !creditData) return [];
    
    const timeline = [];
    const currentScore = safeGet(creditData.score || creditData.creditScore, 0);
    const activeWorkDays = creditData?.metrics?.activeWorkDays?.value || financialSummary?.activeWorkDays || 0;
    
    if (activeWorkDays < 25) {
      timeline.push({
        timeframe: '2 weeks',
        action: 'Work 25+ days consistently',
        impact: '+50 to +80 pts',
        newScore: Math.min(1000, currentScore + 60)
      });
    }
    
    if (expenseRatioRaw > 0.6) {
      timeline.push({
        timeframe: '1 month',
        action: 'Reduce expenses by 10%',
        impact: '+80 to +120 pts',
        newScore: Math.min(1000, currentScore + 100)
      });
    }
    
    if (monthlyIncome < 40000) {
      timeline.push({
        timeframe: '2 months',
        action: 'Increase income streams',
        impact: '+100 to +150 pts',
        newScore: Math.min(1000, currentScore + 120)
      });
    }
    
    timeline.push({
      timeframe: '3 months',
      action: 'Maintain all improvements',
      impact: '+150 to +200 pts',
      newScore: Math.min(1000, currentScore + 180)
    });

    return timeline;
  };

  const improvementTimeline = getImprovementTimeline();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-blue-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-900" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-white">CreditFlow</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 text-white hover:text-yellow-400 transition text-sm font-medium"
            >
              Dashboard
            </button>
            <button
              onClick={() => { logout(); navigate("/"); }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-blue-900 hover:text-blue-700 flex items-center text-sm font-medium"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Credit Score Analysis</h1>
          <p className="text-sm text-gray-600 mt-1">Complete financial assessment based on your bank statement</p>
        </div>

        {/* Main Score Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-900">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="text-center md:text-left">
                <div className="text-sm font-semibold text-gray-600 mb-2">Your Credit Score</div>
                <div className={`text-6xl font-bold ${getScoreColor(creditData.creditScore || creditData.score || 0)} mb-2`}>
                  {Math.round(safeGet(creditData.creditScore || creditData.score, 0))}
                </div>
                <div className="text-xs text-gray-500">out of 850</div>
                <div className={`inline-block mt-3 px-4 py-1 rounded-full border text-sm font-semibold ${getRiskColor(creditData.riskLevel)}`}>
                  {creditData.riskLevel || 'Medium'} Risk
                </div>
              </div>
              <div className="flex-1 w-full">
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-yellow-900">Eligible Credit</span>
                    <svg className="w-5 h-5 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-yellow-900">₹{creditData.eligibleCreditAmount?.toLocaleString()}</div>
                  <div className="text-xs text-yellow-800 mt-1">Pre-approved loan amount</div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-gray-600">Processing Time</span>
                  <span className="font-semibold text-blue-900">24-48 hours</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-2">
                  <span className="text-gray-600">Interest Rate</span>
                  <span className="font-semibold text-blue-900">
                    {creditData.riskLevel === 'Low' ? '12-15%' : creditData.riskLevel === 'Medium' ? '15-18%' : '18-22%'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full px-4 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-medium transition text-sm">
                Apply for Loan
              </button>
              <button className="w-full px-4 py-3 bg-white border-2 border-blue-900 text-blue-900 hover:bg-blue-50 rounded-lg font-medium transition text-sm">
                Download Report
              </button>
              <button className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition text-sm">
                Share Analysis
              </button>
            </div>
          </div>
        </div>

        {/* Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-600">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600">Monthly Income</span>
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"/>
              </svg>
            </div>
            <div className="text-2xl font-bold text-gray-900">₹{Math.round(monthlyIncome).toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">Average per month</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600">Consistency Score</span>
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            </div>
            <div className="text-2xl font-bold text-gray-900">{Math.round(consistencyScore)}/100</div>
            <div className="text-xs text-gray-500 mt-1">Income reliability score</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600">Work Days</span>
              <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
              </svg>
            </div>
            <div className="text-2xl font-bold text-gray-900">{Math.round(workDays)}</div>
            <div className="text-xs text-gray-500 mt-1">Days per month</div>
          </div>

          <div className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${expenseRatioRaw > 1 ? 'border-red-500' : expenseRatioRaw > 0.6 ? 'border-orange-500' : 'border-purple-500'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600">Expense Ratio</span>
              <svg className={`w-4 h-4 ${expenseRatioRaw > 1 ? 'text-red-500' : 'text-purple-500'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
              </svg>
            </div>
            <div className={`text-2xl font-bold ${expenseRatioRaw > 1 ? 'text-red-600' : 'text-gray-900'}`}>{(expenseRatioRaw * 100).toFixed(0)}%</div>
            <div className="text-xs mt-1">
              {expenseRatioRaw > 1
                ? <span className="text-red-500 font-semibold">Expenses exceed income!</span>
                : <span className="text-gray-500">Of total income</span>}
            </div>
          </div>
        </div>

        {/* Visual Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Credit Score Breakdown Chart */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Score Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={scoreBreakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {scoreBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {scoreBreakdownData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs text-gray-700">{item.name}</span>
                  <span className="text-xs font-bold text-gray-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Income vs Expense Trend */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Income vs Expenses Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={incomeExpenseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value) => `₹${value.toLocaleString()}`}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="income" fill="#1e3a8a" name="Income" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#fbbf24" name="Expenses" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* What-If Credit Simulation */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md p-6 mb-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <div>
              <h3 className="text-lg font-bold text-gray-900">What-If Credit Simulation</h3>
              <p className="text-xs text-gray-600">Adjust variables to see how your score could change</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sliders */}
            <div className="lg:col-span-2 space-y-6">
              {/* Monthly Income Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-gray-700">Monthly Income</label>
                  <span className="text-sm font-bold text-blue-900">₹{simulatedIncome.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={Math.round((financialSummary.averageMonthlyIncome || 30000) * 0.5)}
                  max={Math.round((financialSummary.averageMonthlyIncome || 30000) * 1.5)}
                  step={1000}
                  value={simulatedIncome}
                  onChange={(e) => setSimulatedIncome(parseInt(e.target.value))}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #1e3a8a 0%, #1e3a8a ${((simulatedIncome - Math.round((financialSummary.averageMonthlyIncome || 30000) * 0.5)) / (Math.round((financialSummary.averageMonthlyIncome || 30000) * 1.5) - Math.round((financialSummary.averageMonthlyIncome || 30000) * 0.5))) * 100}%, #dbeafe ${((simulatedIncome - Math.round((financialSummary.averageMonthlyIncome || 30000) * 0.5)) / (Math.round((financialSummary.averageMonthlyIncome || 30000) * 1.5) - Math.round((financialSummary.averageMonthlyIncome || 30000) * 0.5))) * 100}%, #dbeafe 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>₹{Math.round((financialSummary.averageMonthlyIncome || 30000) * 0.5).toLocaleString()}</span>
                  <span>₹{Math.round((financialSummary.averageMonthlyIncome || 30000) * 1.5).toLocaleString()}</span>
                </div>
              </div>

              {/* Monthly Expenses Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-gray-700">Monthly Expenses</label>
                  <span className="text-sm font-bold text-blue-900">₹{Math.round(simulatedExpenses).toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={Math.round((financialSummary.averageMonthlyIncome || 30000) * 0.2)}
                  max={Math.round((financialSummary.averageMonthlyIncome || 30000) * 0.8)}
                  step={1000}
                  value={simulatedExpenses}
                  onChange={(e) => setSimulatedExpenses(parseInt(e.target.value))}
                  className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${((simulatedExpenses - Math.round((financialSummary.averageMonthlyIncome || 30000) * 0.2)) / (Math.round((financialSummary.averageMonthlyIncome || 30000) * 0.8) - Math.round((financialSummary.averageMonthlyIncome || 30000) * 0.2))) * 100}%, #fef3c7 ${((simulatedExpenses - Math.round((financialSummary.averageMonthlyIncome || 30000) * 0.2)) / (Math.round((financialSummary.averageMonthlyIncome || 30000) * 0.8) - Math.round((financialSummary.averageMonthlyIncome || 30000) * 0.2))) * 100}%, #fef3c7 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>₹{Math.round((financialSummary.averageMonthlyIncome || 30000) * 0.2).toLocaleString()}</span>
                  <span>₹{Math.round((financialSummary.averageMonthlyIncome || 30000) * 0.8).toLocaleString()}</span>
                </div>
              </div>

              {/* Work Days Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-gray-700">Active Work Days</label>
                  <span className="text-sm font-bold text-blue-900">{simulatedWorkDays} days</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={30}
                  step={1}
                  value={simulatedWorkDays}
                  onChange={(e) => setSimulatedWorkDays(parseInt(e.target.value))}
                  className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${((simulatedWorkDays - 10) / 20) * 100}%, #d1fae5 ${((simulatedWorkDays - 10) / 20) * 100}%, #d1fae5 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>10 days</span>
                  <span>30 days</span>
                </div>
              </div>
            </div>

            {/* Simulation Results */}
            <div className="bg-white rounded-xl p-5 shadow-lg border-2 border-blue-300">
              <div className="text-center mb-4">
                <div className="text-xs font-semibold text-gray-600 mb-2">Simulated Credit Score</div>
                <div className={`text-5xl font-bold ${getScoreColor(simulatedScore)}`}>{simulatedScore}</div>
                <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold" 
                  style={{ 
                    backgroundColor: scoreChange >= 0 ? '#dcfce7' : '#fee2e2',
                    color: scoreChange >= 0 ? '#15803d' : '#991b1b'
                  }}>
                  {scoreChange >= 0 ? '↑' : '↓'} {Math.abs(scoreChange)} points
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="text-xs text-gray-600 mb-1">Simulated Credit Amount</div>
                <div className="text-2xl font-bold text-yellow-900">₹{simulatedCreditAmount.toLocaleString()}</div>
                <div className="text-xs text-gray-600 mt-3">
                  {scoreChange > 0 ? '✨ Great! Keep improving your metrics' : 
                   scoreChange < 0 ? '⚠️ Your score may decrease with these changes' :
                   '→ No change from current score'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Credit Improvement Timeline */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Credit Improvement Timeline</h3>
              <p className="text-xs text-gray-600">Projected score growth with recommended actions</p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-blue-200"></div>
            <div className="space-y-6">
              {improvementTimeline.map((milestone, index) => (
                <div key={index} className="relative flex items-start gap-4 pl-2">
                  <div className="absolute left-4 w-4 h-4 bg-blue-900 rounded-full border-4 border-blue-100"></div>
                  <div className="ml-10 flex-1 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-blue-900 px-3 py-1 bg-blue-200 rounded-full">
                        {milestone.timeframe}
                      </span>
                      <span className="text-lg font-bold text-green-600">{milestone.impact}</span>
                    </div>
                    <div className="text-sm font-semibold text-gray-900 mb-1">{milestone.action}</div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-600">Projected Score:</span>
                      <span className="text-xl font-bold text-blue-900">{milestone.newScore}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Score Factors - Reorganized */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* What's Helping Your Score */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <h3 className="text-lg font-bold text-gray-900">What's Helping Your Score</h3>
            </div>
            {helping.length > 0 ? (
              <div className="space-y-3">
                {helping.map((factor, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-sm text-gray-700">{factor}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-700 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="font-semibold mb-1">Continue Building Your Credit</p>
                <p className="text-xs text-gray-600">As you maintain consistent income and controlled spending, positive factors will appear here.</p>
              </div>
            )}
          </div>

          {/* What's Holding It Back */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <h3 className="text-lg font-bold text-gray-900">What's Holding It Back</h3>
            </div>
            {holding.length > 0 ? (
              <div className="space-y-3">
                {holding.map((factor, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-sm text-gray-700">{factor}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-green-700 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <p className="font-semibold">Excellent! No Concerns Identified</p>
                </div>
                <p className="text-xs text-gray-700">Your financial profile shows strong fundamentals with no major risk factors.</p>
              </div>
            )}
          </div>
        </div>

        {/* Comparison Chart */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Peer Comparison</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Your Score</span>
                <span className="font-semibold text-blue-900">{creditData.score} / 850</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-900 to-yellow-400 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, safeGet((creditData.score / 850) * 100, 0))}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Average Gig Worker</span>
                <span className="font-semibold text-gray-700">450 / 850</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-gray-400 h-3 rounded-full" style={{ width: '55%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Top 10% Workers</span>
                <span className="font-semibold text-gray-700">700 / 850</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-green-500 h-3 rounded-full" style={{ width: '82%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
