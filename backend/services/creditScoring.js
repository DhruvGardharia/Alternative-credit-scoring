/**
 * Credit Scoring Engine
 * Rule-based scoring system for gig workers
 * Converts financial metrics into credit score, risk level, and eligible amount
 * Enhanced with advanced risk metrics: volatility, cash flow, expense shocks
 */

/**
 * Calculate Income Volatility from monthly income data
 */
const calculateIncomeVolatility = (monthlyIncomes) => {
  if (!monthlyIncomes || monthlyIncomes.length < 2) {
    return { volatility: 0, volatilityBand: 'Low', volatilityScore: 20 };
  }
  
  const mean = monthlyIncomes.reduce((sum, val) => sum + val, 0) / monthlyIncomes.length;
  const variance = monthlyIncomes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / monthlyIncomes.length;
  const stdDev = Math.sqrt(variance);
  const volatility = mean > 0 ? stdDev / mean : 0;
  
  let volatilityBand, volatilityScore;
  if (volatility <= 0.15) {
    volatilityBand = 'Low';
    volatilityScore = 20; // Good stability
  } else if (volatility <= 0.30) {
    volatilityBand = 'Medium';
    volatilityScore = 12; // Moderate stability
  } else {
    volatilityBand = 'High';
    volatilityScore = 5; // High risk
  }
  
  return { volatility: Math.round(volatility * 100) / 100, volatilityBand, volatilityScore };
};

/**
 * Calculate Net Cash Flow Ratio
 */
const calculateNetCashFlowRatio = (totalCredits, totalDebits) => {
  if (!totalCredits || totalCredits === 0) {
    return { netCashFlowRatio: 0, cashFlowBand: 'Negative', cashFlowScore: 0 };
  }
  
  const netCashFlowRatio = (totalCredits - totalDebits) / totalCredits;
  
  let cashFlowBand, cashFlowScore;
  if (netCashFlowRatio >= 0.20) {
    cashFlowBand = 'Positive';
    cashFlowScore = 15; // Strong savings
  } else if (netCashFlowRatio >= 0.05) {
    cashFlowBand = 'Neutral';
    cashFlowScore = 8; // Breaking even
  } else {
    cashFlowBand = 'Negative';
    cashFlowScore = 2; // Overspending
  }
  
  return { 
    netCashFlowRatio: Math.round(netCashFlowRatio * 100) / 100, 
    cashFlowBand, 
    cashFlowScore 
  };
};

/**
 * Detect Expense Shocks (months with abnormally high expenses)
 */
const detectExpenseShocks = (monthlyDebits) => {
  if (!monthlyDebits || monthlyDebits.length < 2) {
    return { shockMonths: 0, expenseShockBand: 'None', shockScore: 10 };
  }
  
  const avgDebits = monthlyDebits.reduce((sum, val) => sum + val, 0) / monthlyDebits.length;
  const shockThreshold = avgDebits * 1.5;
  const shockMonths = monthlyDebits.filter(debit => debit > shockThreshold).length;
  
  let expenseShockBand, shockScore;
  if (shockMonths === 0) {
    expenseShockBand = 'None';
    shockScore = 10; // Excellent control
  } else if (shockMonths <= 2) {
    expenseShockBand = 'Occasional';
    shockScore = 6; // Some spikes
  } else {
    expenseShockBand = 'Frequent';
    shockScore = 2; // Poor planning
  }
  
  return { shockMonths, expenseShockBand, shockScore };
};

/**
 * Non-linear risk-band scoring
 */
const applyRiskBandScoring = (metric, thresholds, scores) => {
  for (let i = 0; i < thresholds.length; i++) {
    if (metric >= thresholds[i]) {
      return scores[i];
    }
  }
  return scores[scores.length - 1];
};

export const calculateCreditScore = (financialSummary) => {
  const {
    averageMonthlyIncome,
    incomeConsistencyScore,
    activeWorkDays,
    expenseToIncomeRatio,
    averageDailyBalance,
    monthlyIncomes = [], // New: array of monthly income values
    totalCredits = averageMonthlyIncome * 3, // New: default 3 months
    totalDebits = totalCredits * expenseToIncomeRatio, // New: derived
    monthlyDebits = [] // New: array of monthly debit values
  } = financialSummary;

  let score = 0;
  const explanation = [];
  
  // === ADVANCED METRICS ===
  
  // 1️⃣ Income Volatility Analysis
  const volatilityMetrics = calculateIncomeVolatility(monthlyIncomes);
  score += volatilityMetrics.volatilityScore;
  explanation.push(`Income volatility: ${volatilityMetrics.volatilityBand} (±${volatilityMetrics.volatility * 100}%)`);
  
  // 2️⃣ Net Cash Flow Analysis
  const cashFlowMetrics = calculateNetCashFlowRatio(totalCredits, totalDebits);
  score += cashFlowMetrics.cashFlowScore;
  explanation.push(`Net cash flow: ${cashFlowMetrics.cashFlowBand} (${Math.round(cashFlowMetrics.netCashFlowRatio * 100)}%)`);
  
  // 3️⃣ Expense Shock Detection
  const shockMetrics = detectExpenseShocks(monthlyDebits);
  score += shockMetrics.shockScore;
  explanation.push(`Expense shocks: ${shockMetrics.expenseShockBand} (${shockMetrics.shockMonths} months)`);
  
  // === EXISTING METRICS WITH NON-LINEAR SCORING ===

  // 1. Income Level (Risk-Band Scoring: 25 points)
  const incomeScore = applyRiskBandScoring(
    averageMonthlyIncome,
    [40000, 30000, 20000],
    [25, 18, 12, 6]
  );
  score += incomeScore;
  
  if (averageMonthlyIncome >= 40000) {
    explanation.push('Income: Strong (₹40k+)');
  } else if (averageMonthlyIncome >= 30000) {
    explanation.push('Income: Good (₹30k-40k)');
  } else if (averageMonthlyIncome >= 20000) {
    explanation.push('Income: Moderate (₹20k-30k)');
  } else {
    explanation.push('Income: Risky (below ₹20k)');
  }

  // 2. Income Consistency (Risk-Band Scoring: 15 points)
  const consistencyScore = applyRiskBandScoring(
    incomeConsistencyScore,
    [85, 70, 60],
    [15, 11, 7, 3]
  );
  score += consistencyScore;
  
  if (incomeConsistencyScore >= 85) {
    explanation.push('Consistency: Good (85%+)');
  } else if (incomeConsistencyScore >= 70) {
    explanation.push('Consistency: Moderate (70-85%)');
  } else {
    explanation.push('Consistency: Risky (below 70%)');
  }

  // 3. Work Activity (Risk-Band Scoring: 10 points)
  const activityScore = applyRiskBandScoring(
    activeWorkDays,
    [25, 20, 15],
    [10, 8, 5, 2]
  );
  score += activityScore;
  
  if (activeWorkDays >= 25) {
    explanation.push('Activity: Good (25+ days)');
  } else if (activeWorkDays >= 20) {
    explanation.push('Activity: Moderate (20-25 days)');
  } else {
    explanation.push('Activity: Risky (below 20 days)');
  }

  // 4. Account Balance (Risk-Band Scoring: 5 points)
  const balanceScore = applyRiskBandScoring(
    averageDailyBalance,
    [10000, 7000, 5000],
    [5, 4, 2, 1]
  );
  score += balanceScore;
  
  if (averageDailyBalance >= 10000) {
    explanation.push('Balance: Good (₹10k+)');
  } else if (averageDailyBalance >= 7000) {
    explanation.push('Balance: Moderate (₹7k-10k)');
  } else {
    explanation.push('Balance: Risky (below ₹7k)');
  }

  // Determine risk level
  let riskLevel;
  if (score >= 75) {
    riskLevel = 'Low';
  } else if (score >= 50) {
    riskLevel = 'Medium';
  } else {
    riskLevel = 'High';
  }

  // Calculate eligible credit amount (based on income and score)
  let eligibleCreditAmount = 0;
  if (score >= 75) {
    eligibleCreditAmount = Math.floor(averageMonthlyIncome * 3); // 3x monthly income
  } else if (score >= 50) {
    eligibleCreditAmount = Math.floor(averageMonthlyIncome * 2); // 2x monthly income
  } else if (score >= 35) {
    eligibleCreditAmount = Math.floor(averageMonthlyIncome * 1); // 1x monthly income
  } else {
    eligibleCreditAmount = Math.floor(averageMonthlyIncome * 0.5); // 0.5x monthly income
  }

  return {
    score: Math.min(score, 100), // Cap at 100
    riskLevel,
    eligibleCreditAmount,
    explanation,
    // New enhanced metrics (appended to existing response)
    advancedMetrics: {
      incomeVolatility: volatilityMetrics.volatility,
      incomeVolatilityBand: volatilityMetrics.volatilityBand,
      netCashFlowRatio: cashFlowMetrics.netCashFlowRatio,
      cashFlowBand: cashFlowMetrics.cashFlowBand,
      expenseShockMonths: shockMetrics.shockMonths,
      expenseShockBand: shockMetrics.expenseShockBand
    }
  };
};

/**
 * Get human-readable credit decision summary
 */
export const getCreditDecisionSummary = (creditScore) => {
  const { score, riskLevel, eligibleCreditAmount } = creditScore;

  let summary = '';
  if (riskLevel === 'Low') {
    summary = 'Excellent creditworthiness! You qualify for the maximum loan amount.';
  } else if (riskLevel === 'Medium') {
    summary = 'Good financial profile. You qualify for a moderate loan amount.';
  } else {
    summary = 'Your profile shows some risk factors. You may qualify for a smaller loan amount.';
  }

  return {
    summary,
    score,
    riskLevel,
    eligibleCreditAmount
  };
};
