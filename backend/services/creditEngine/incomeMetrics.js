/**
 * Income Metrics Calculator
 * 
 * Calculates income-related metrics from transaction data
 * All functions return { value, score, status }
 */

import { INCOME_METRICS, getScoreFromBands } from "../../config/metricDefinitions.js";

/**
 * Helper: Extract credit transactions and group by month
 */
function getMonthlyIncomes(transactions) {
  const monthlyData = {};

  transactions
    .filter((t) => t.type === "credit")
    .forEach((t) => {
      const monthKey = new Date(t.date).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { total: 0, transactions: [] };
      }
      monthlyData[monthKey].total += t.amount;
      monthlyData[monthKey].transactions.push(t);
    });

  return monthlyData;
}

/**
 * Calculate average monthly income
 */
export function calculateAvgMonthlyIncome(transactions) {
  const monthlyData = getMonthlyIncomes(transactions);
  const monthlyTotals = Object.values(monthlyData).map((m) => m.total);

  if (monthlyTotals.length === 0) {
    return { value: 0, score: 0, status: "No Income Data" };
  }

  const avgIncome = monthlyTotals.reduce((a, b) => a + b, 0) / monthlyTotals.length;
  const { score, status } = getScoreFromBands(avgIncome, INCOME_METRICS.avgMonthlyIncome.scoringBands);

  return {
    value: Math.round(avgIncome),
    score,
    status,
    lastUpdated: new Date()
  };
}

/**
 * Calculate income volatility (coefficient of variation)
 * Lower is better
 */
export function calculateIncomeVolatility(transactions) {
  const monthlyData = getMonthlyIncomes(transactions);
  const monthlyTotals = Object.values(monthlyData).map((m) => m.total);

  if (monthlyTotals.length < 2) {
    return { value: 0, score: 50, status: "Insufficient Data" };
  }

  const mean = monthlyTotals.reduce((a, b) => a + b, 0) / monthlyTotals.length;
  const variance =
    monthlyTotals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / monthlyTotals.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = mean > 0 ? stdDev / mean : 0;

  const { score, status } = getScoreFromBands(
    coefficientOfVariation,
    INCOME_METRICS.incomeVolatility.scoringBands
  );

  return {
    value: parseFloat(coefficientOfVariation.toFixed(3)),
    score,
    status,
    lastUpdated: new Date()
  };
}

/**
 * Calculate income consistency
 * Blends two signals:
 *   1. Monthly presence rate  – what % of calendar months had any income
 *   2. Daily regularity rate  – avg active-work-days per month / 22 expected days
 * The product of both gives a realistic picture: a worker with only 9 work-days
 * in a single month scores ~41 %, not 100 %.
 */
export function calculateIncomeConsistency(transactions) {
  if (transactions.length === 0) {
    return { value: 0, score: 0, status: "No Data" };
  }

  const allDates = transactions.map((t) => new Date(t.date));
  const minDate = new Date(Math.min(...allDates));
  const maxDate = new Date(Math.max(...allDates));

  const monthsDiff =
    (maxDate.getFullYear() - minDate.getFullYear()) * 12 +
    (maxDate.getMonth() - minDate.getMonth()) +
    1;

  const monthlyData = getMonthlyIncomes(transactions);
  const monthsWithIncome = Object.keys(monthlyData).length;

  // Signal 1: monthly presence (0-1)
  const monthlyPresence = Math.min(1, monthsWithIncome / Math.max(1, monthsDiff));

  // Signal 2: daily regularity – avg unique income days per month vs 22 expected
  const EXPECTED_WORK_DAYS = 22;
  const monthlyWorkDayCounts = Object.values(monthlyData).map((month) => {
    const uniqueDays = new Set(
      month.transactions.map((t) => new Date(t.date).toISOString().slice(0, 10))
    );
    return uniqueDays.size;
  });
  const avgWorkDays =
    monthlyWorkDayCounts.length > 0
      ? monthlyWorkDayCounts.reduce((a, b) => a + b, 0) / monthlyWorkDayCounts.length
      : 0;
  const dailyRegularity = Math.min(1, avgWorkDays / EXPECTED_WORK_DAYS);

  // Combined consistency rate (geometric mean to penalise weak signal on either axis)
  const rawRate = Math.sqrt(monthlyPresence * dailyRegularity) * 100;
  const consistencyRate = Math.min(100, parseFloat(rawRate.toFixed(2)));

  const { score, status } = getScoreFromBands(
    consistencyRate,
    INCOME_METRICS.incomeConsistency.scoringBands
  );

  return {
    value: consistencyRate,
    score,
    status,
    lastUpdated: new Date()
  };
}

/**
 * Calculate income trend
 * Month-over-month average growth rate
 */
export function calculateIncomeTrend(transactions) {
  const monthlyData = getMonthlyIncomes(transactions);
  const sortedMonths = Object.keys(monthlyData).sort();

  if (sortedMonths.length < 3) {
    return { value: 0, score: 60, status: "Insufficient History" };
  }

  // Calculate average MoM growth rate
  let totalGrowth = 0;
  let growthCount = 0;

  for (let i = 1; i < sortedMonths.length; i++) {
    const prevMonth = monthlyData[sortedMonths[i - 1]].total;
    const currMonth = monthlyData[sortedMonths[i]].total;

    if (prevMonth > 0) {
      const growth = ((currMonth - prevMonth) / prevMonth) * 100;
      totalGrowth += growth;
      growthCount++;
    }
  }

  const avgGrowthRate = growthCount > 0 ? totalGrowth / growthCount : 0;

  const { score, status } = getScoreFromBands(avgGrowthRate, INCOME_METRICS.incomeTrend.scoringBands);

  return {
    value: parseFloat(avgGrowthRate.toFixed(2)),
    score,
    status,
    lastUpdated: new Date()
  };
}

/**
 * Calculate active work days
 * Average days per month with income transactions
 */
export function calculateActiveWorkDays(transactions) {
  const creditTransactions = transactions.filter((t) => t.type === "credit");

  if (creditTransactions.length === 0) {
    return { value: 0, score: 0, status: "No Income Transactions" };
  }

  const monthlyData = getMonthlyIncomes(transactions);
  const monthlyWorkDays = Object.values(monthlyData).map((month) => {
    const uniqueDays = new Set(
      month.transactions.map((t) => new Date(t.date).toISOString().slice(0, 10))
    );
    return uniqueDays.size;
  });

  const avgWorkDays =
    monthlyWorkDays.reduce((a, b) => a + b, 0) / monthlyWorkDays.length;

  const { score, status } = getScoreFromBands(
    avgWorkDays,
    INCOME_METRICS.activeWorkDays.scoringBands
  );

  return {
    value: parseFloat(avgWorkDays.toFixed(1)),
    score,
    status,
    lastUpdated: new Date()
  };
}

/**
 * Calculate income diversification
 * Number of unique income sources/categories
 */
export function calculateIncomeDiversification(transactions) {
  const creditTransactions = transactions.filter((t) => t.type === "credit");

  if (creditTransactions.length === 0) {
    return { value: 0, score: 0, status: "No Income Data" };
  }

  // Count unique income categories or sources
  const uniqueSources = new Set();
  creditTransactions.forEach((t) => {
    // Use category if available, otherwise use source
    const identifier = t.category || t.source || "unknown";
    uniqueSources.add(identifier);
  });

  const sourceCount = uniqueSources.size;

  const { score, status } = getScoreFromBands(
    sourceCount,
    INCOME_METRICS.incomeDiversification.scoringBands
  );

  return {
    value: sourceCount,
    score,
    status,
    lastUpdated: new Date()
  };
}

/**
 * Calculate work stability
 * Maximum consecutive days without income transactions
 */
export function calculateWorkStability(transactions) {
  const creditTransactions = transactions
    .filter((t) => t.type === "credit")
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (creditTransactions.length < 2) {
    return { value: 0, score: 20, status: "Insufficient Data" };
  }

  let maxGap = 0;
  for (let i = 1; i < creditTransactions.length; i++) {
    const prevDate = new Date(creditTransactions[i - 1].date);
    const currDate = new Date(creditTransactions[i].date);
    const daysDiff = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));
    maxGap = Math.max(maxGap, daysDiff);
  }

  const { score, status } = getScoreFromBands(maxGap, INCOME_METRICS.workStability.scoringBands);

  return {
    value: maxGap,
    score,
    status,
    lastUpdated: new Date()
  };
}

/**
 * Calculate all income metrics
 */
export function calculateAllIncomeMetrics(transactions) {
  return {
    avgMonthlyIncome: calculateAvgMonthlyIncome(transactions),
    incomeVolatility: calculateIncomeVolatility(transactions),
    incomeConsistency: calculateIncomeConsistency(transactions),
    incomeTrend: calculateIncomeTrend(transactions),
    activeWorkDays: calculateActiveWorkDays(transactions),
    incomeDiversification: calculateIncomeDiversification(transactions),
    workStability: calculateWorkStability(transactions)
  };
}
