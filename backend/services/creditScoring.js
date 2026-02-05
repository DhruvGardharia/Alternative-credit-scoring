/**
 * Credit Scoring Engine
 * Rule-based scoring system for gig workers
 * Converts financial metrics into credit score, risk level, and eligible amount
 */

export const calculateCreditScore = (financialSummary) => {
  const {
    averageMonthlyIncome,
    incomeConsistencyScore,
    activeWorkDays,
    expenseToIncomeRatio,
    averageDailyBalance
  } = financialSummary;

  let score = 0;
  const explanation = [];

  // 1. Income Level (30 points)
  if (averageMonthlyIncome >= 40000) {
    score += 30;
    explanation.push('Strong monthly income (₹40k+)');
  } else if (averageMonthlyIncome >= 30000) {
    score += 22;
    explanation.push('Good monthly income (₹30k-40k)');
  } else if (averageMonthlyIncome >= 20000) {
    score += 15;
    explanation.push('Moderate monthly income (₹20k-30k)');
  } else {
    score += 8;
    explanation.push('Low monthly income (below ₹20k)');
  }

  // 2. Income Consistency (25 points)
  if (incomeConsistencyScore >= 85) {
    score += 25;
    explanation.push('Highly consistent income pattern');
  } else if (incomeConsistencyScore >= 70) {
    score += 18;
    explanation.push('Fairly consistent income');
  } else if (incomeConsistencyScore >= 60) {
    score += 12;
    explanation.push('Moderate income consistency');
  } else {
    score += 5;
    explanation.push('Inconsistent income pattern');
  }

  // 3. Work Activity (20 points)
  if (activeWorkDays >= 25) {
    score += 20;
    explanation.push('Very active worker (25+ days/month)');
  } else if (activeWorkDays >= 20) {
    score += 15;
    explanation.push('Active worker (20-25 days/month)');
  } else if (activeWorkDays >= 15) {
    score += 10;
    explanation.push('Moderately active (15-20 days/month)');
  } else {
    score += 5;
    explanation.push('Low work activity (below 15 days/month)');
  }

  // 4. Expense Management (15 points)
  if (expenseToIncomeRatio <= 0.6) {
    score += 15;
    explanation.push('Excellent expense management (60% or less)');
  } else if (expenseToIncomeRatio <= 0.75) {
    score += 10;
    explanation.push('Good expense management (60-75%)');
  } else if (expenseToIncomeRatio <= 0.85) {
    score += 5;
    explanation.push('Fair expense management (75-85%)');
  } else {
    score += 2;
    explanation.push('High expense ratio (above 85%)');
  }

  // 5. Account Balance (10 points)
  if (averageDailyBalance >= 10000) {
    score += 10;
    explanation.push('Strong account balance (₹10k+)');
  } else if (averageDailyBalance >= 7000) {
    score += 7;
    explanation.push('Good account balance (₹7k-10k)');
  } else if (averageDailyBalance >= 5000) {
    score += 4;
    explanation.push('Moderate account balance (₹5k-7k)');
  } else {
    score += 2;
    explanation.push('Low account balance (below ₹5k)');
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
    explanation
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
