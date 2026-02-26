/**
 * Liquidity Metrics Calculator
 * 
 * Calculates liquidity and balance-related metrics from transaction data
 * All functions return { value, score, status }
 */

import { LIQUIDITY_METRICS, getScoreFromBands } from "../../config/metricDefinitions.js";

/**
 * Helper: Calculate daily balances from transactions
 */
function calculateDailyBalances(transactions) {
  if (transactions.length === 0) {
    return [];
  }

  // Sort transactions by date
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const dailyBalances = {};
  let runningBalance = 0;

  // Get date range
  const startDate = new Date(sortedTransactions[0].date);
  const endDate = new Date(sortedTransactions[sortedTransactions.length - 1].date);

  // Process transactions
  sortedTransactions.forEach((t) => {
    const dateKey = new Date(t.date).toISOString().slice(0, 10);

    if (!dailyBalances[dateKey]) {
      dailyBalances[dateKey] = runningBalance;
    }

    if (t.type === "credit") {
      runningBalance += t.amount;
    } else if (t.type === "debit") {
      runningBalance -= t.amount;
    }

    dailyBalances[dateKey] = runningBalance;
  });

  // Fill in missing days with previous balance
  const allBalances = [];
  let currentDate = new Date(startDate);
  let lastBalance = 0;

  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().slice(0, 10);
    const balance = dailyBalances[dateKey] !== undefined ? dailyBalances[dateKey] : lastBalance;
    allBalances.push(balance);
    lastBalance = balance;
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return allBalances;
}

/**
 * Calculate average daily balance
 */
export function calculateAvgDailyBalance(transactions) {
  const dailyBalances = calculateDailyBalances(transactions);

  if (dailyBalances.length === 0) {
    return { value: 0, score: 0, status: "No Transaction Data" };
  }

  const avgBalance =
    dailyBalances.reduce((sum, balance) => sum + balance, 0) / dailyBalances.length;

  const { score, status } = getScoreFromBands(
    avgBalance,
    LIQUIDITY_METRICS.avgDailyBalance.scoringBands
  );

  return {
    value: Math.round(avgBalance),
    score,
    status,
    lastUpdated: new Date()
  };
}

/**
 * Calculate negative balance risk
 * Percentage of days with balance below 10% of average
 */
export function calculateNegativeBalanceRisk(transactions) {
  const dailyBalances = calculateDailyBalances(transactions);

  if (dailyBalances.length === 0) {
    return { value: 0, score: 0, status: "No Transaction Data" };
  }

  const avgBalance =
    dailyBalances.reduce((sum, balance) => sum + balance, 0) / dailyBalances.length;

  // Calculate threshold (10% of average balance or minimum of 1000)
  const threshold = Math.max(avgBalance * 0.1, 1000);

  // Count days with balance below threshold
  const lowBalanceDays = dailyBalances.filter((balance) => balance < threshold).length;
  const riskPercentage = (lowBalanceDays / dailyBalances.length) * 100;

  const { score, status } = getScoreFromBands(
    riskPercentage,
    LIQUIDITY_METRICS.negativeBalanceRisk.scoringBands
  );

  return {
    value: parseFloat(riskPercentage.toFixed(2)),
    score,
    status,
    lastUpdated: new Date()
  };
}

/**
 * Calculate all liquidity metrics
 */
export function calculateAllLiquidityMetrics(transactions) {
  return {
    avgDailyBalance: calculateAvgDailyBalance(transactions),
    negativeBalanceRisk: calculateNegativeBalanceRisk(transactions)
  };
}
