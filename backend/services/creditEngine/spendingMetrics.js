/**
 * Spending Metrics Calculator
 * 
 * Calculates spending behavior metrics from transaction data
 * All functions return { value, score, status }
 */

import { SPENDING_METRICS, getScoreFromBands } from "../../config/metricDefinitions.js";

/**
 * Helper: Group transactions by month
 */
function getMonthlyData(transactions) {
  const monthlyData = {};

  transactions.forEach((t) => {
    const monthKey = new Date(t.date).toISOString().slice(0, 7); // YYYY-MM
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { credits: 0, debits: 0, transactions: [] };
    }

    if (t.type === "credit") {
      monthlyData[monthKey].credits += t.amount;
    } else if (t.type === "debit") {
      monthlyData[monthKey].debits += t.amount;
    }

    monthlyData[monthKey].transactions.push(t);
  });

  return monthlyData;
}

/**
 * Calculate net cash flow ratio
 * (Income - Expenses) / Income
 */
export function calculateNetCashFlowRatio(transactions) {
  const monthlyData = getMonthlyData(transactions);
  const months = Object.values(monthlyData);

  if (months.length === 0) {
    return { value: 0, score: 0, status: "No Transaction Data" };
  }

  // Calculate average cash flow ratio across all months
  let totalRatio = 0;
  let validMonths = 0;

  months.forEach((month) => {
    if (month.credits > 0) {
      const ratio = (month.credits - month.debits) / month.credits;
      totalRatio += ratio;
      validMonths++;
    }
  });

  const avgRatio = validMonths > 0 ? totalRatio / validMonths : 0;

  const { score, status } = getScoreFromBands(
    avgRatio,
    SPENDING_METRICS.netCashFlowRatio.scoringBands
  );

  return {
    value: parseFloat(avgRatio.toFixed(3)),
    score,
    status,
    lastUpdated: new Date()
  };
}

/**
 * Calculate savings behavior
 * Percentage of months with positive cash flow
 */
export function calculateSavingsBehavior(transactions) {
  const monthlyData = getMonthlyData(transactions);
  const months = Object.values(monthlyData);

  if (months.length === 0) {
    return { value: 0, score: 0, status: "No Transaction Data" };
  }

  const monthsWithSavings = months.filter((month) => month.credits > month.debits).length;
  const savingsRate = (monthsWithSavings / months.length) * 100;

  const { score, status } = getScoreFromBands(
    savingsRate,
    SPENDING_METRICS.savingsBehavior.scoringBands
  );

  return {
    value: parseFloat(savingsRate.toFixed(2)),
    score,
    status,
    lastUpdated: new Date()
  };
}

/**
 * Calculate expense shocks
 * Number of months with expenses > 150% of average expenses
 */
export function calculateExpenseShocks(transactions) {
  const monthlyData = getMonthlyData(transactions);
  const months = Object.values(monthlyData);

  if (months.length < 2) {
    return { value: 0, score: 100, status: "Insufficient Data" };
  }

  // Calculate average monthly expenses
  const avgExpenses =
    months.reduce((sum, month) => sum + month.debits, 0) / months.length;

  // Count months with expense shocks (>150% of average)
  const shockThreshold = avgExpenses * 1.5;
  const shockMonths = months.filter((month) => month.debits > shockThreshold).length;

  const { score, status } = getScoreFromBands(
    shockMonths,
    SPENDING_METRICS.expenseShocks.scoringBands
  );

  return {
    value: shockMonths,
    score,
    status,
    lastUpdated: new Date()
  };
}

/**
 * Calculate fixed obligation ratio
 * Recurring fixed expenses / Average monthly income
 */
export function calculateFixedObligationRatio(transactions) {
  const monthlyData = getMonthlyData(transactions);
  const months = Object.values(monthlyData);

  if (months.length < 2) {
    return { value: 0, score: 100, status: "Insufficient Data" };
  }

  // Identify recurring expenses
  // For simplicity, we'll use expenses that appear in multiple months with similar amounts
  const expensePatterns = {};

  months.forEach((month) => {
    const debits = month.transactions.filter((t) => t.type === "debit");

    debits.forEach((t) => {
      const key = t.category || t.description || "uncategorized";
      const amount = Math.round(t.amount / 100) * 100; // Round to nearest 100 for pattern matching

      if (!expensePatterns[key]) {
        expensePatterns[key] = [];
      }
      expensePatterns[key].push(amount);
    });
  });

  // Find recurring patterns (appear in at least 50% of months)
  let totalRecurringExpenses = 0;
  const minOccurrences = Math.ceil(months.length * 0.5);

  Object.values(expensePatterns).forEach((amounts) => {
    if (amounts.length >= minOccurrences) {
      // Take the median amount as the recurring amount
      const sorted = amounts.sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      totalRecurringExpenses += median;
    }
  });

  // Calculate average monthly income
  const avgIncome =
    months.reduce((sum, month) => sum + month.credits, 0) / months.length;

  const obligationRatio = avgIncome > 0 ? totalRecurringExpenses / avgIncome : 0;

  const { score, status } = getScoreFromBands(
    obligationRatio,
    SPENDING_METRICS.fixedObligationRatio.scoringBands
  );

  return {
    value: parseFloat(obligationRatio.toFixed(3)),
    score,
    status,
    lastUpdated: new Date()
  };
}

/**
 * Calculate all spending metrics
 */
export function calculateAllSpendingMetrics(transactions) {
  return {
    netCashFlowRatio: calculateNetCashFlowRatio(transactions),
    savingsBehavior: calculateSavingsBehavior(transactions),
    expenseShocks: calculateExpenseShocks(transactions),
    fixedObligationRatio: calculateFixedObligationRatio(transactions)
  };
}
