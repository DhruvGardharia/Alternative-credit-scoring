/**
 * Credit Scoring Engine - Main Entry Point
 * 
 * Source-agnostic credit scoring system
 * Accepts standardized transaction format and outputs comprehensive credit profile
 */

import { calculateAllIncomeMetrics } from "./incomeMetrics.js";
import { calculateAllSpendingMetrics } from "./spendingMetrics.js";
import { calculateAllLiquidityMetrics } from "./liquidityMetrics.js";
import { calculateAllGigMetrics } from "./gigMetrics.js";
import { aggregateAllScores } from "./scoreAggregator.js";
import { analyzeRisk } from "./riskClassifier.js";
import { CreditProfile } from "../../models/CreditProfile.js";

/**
 * Validate transaction data format
 * 
 * @param {Array} transactions - Array of transaction objects
 * @throws {Error} - If validation fails
 */
function validateTransactions(transactions) {
  if (!Array.isArray(transactions)) {
    throw new Error("Transactions must be an array");
  }

  if (transactions.length === 0) {
    throw new Error("Transactions array cannot be empty");
  }

  // Validate each transaction
  transactions.forEach((t, index) => {
    if (!t.date) {
      throw new Error(`Transaction ${index}: Missing date`);
    }
    if (!t.type || !["credit", "debit"].includes(t.type)) {
      throw new Error(`Transaction ${index}: Invalid type (must be 'credit' or 'debit')`);
    }
    if (typeof t.amount !== "number" || t.amount <= 0) {
      throw new Error(`Transaction ${index}: Invalid amount`);
    }
  });
}

/**
 * Calculate Credit Profile
 * Main function that orchestrates the entire credit scoring process
 * 
 * @param {Object} data - Input data
 * @param {String} data.userId - User ID
 * @param {Array} data.transactions - Standardized transaction array
 * @param {Object} data.gigData - Optional gig-specific data
 * @returns {Object} - Complete credit profile
 */
export async function calculateCreditProfile(data) {
  const { userId, transactions, gigData = {} } = data;

  // Validate input
  if (!userId) {
    throw new Error("userId is required");
  }
  validateTransactions(transactions);

  console.log(`\n🔷 Starting credit calculation for user: ${userId}`);
  console.log(`📊 Total transactions: ${transactions.length}`);
  console.log(`   Credits: ${transactions.filter(t => t.type === 'credit').length}`);
  console.log(`   Debits: ${transactions.filter(t => t.type === 'debit').length}`);

  // Step 1: Calculate all metrics
  console.log('\n📈 Calculating metrics...');
  const incomeMetrics = calculateAllIncomeMetrics(transactions);
  const spendingMetrics = calculateAllSpendingMetrics(transactions);
  const liquidityMetrics = calculateAllLiquidityMetrics(transactions);
  const gigMetrics = calculateAllGigMetrics(transactions, gigData);

  console.log('✅ Metrics calculated:');
  console.log(`   Income metrics:`, Object.keys(incomeMetrics).length);
  console.log(`   Spending metrics:`, Object.keys(spendingMetrics).length);
  console.log(`   Liquidity metrics:`, Object.keys(liquidityMetrics).length);

  // Step 2: Aggregate scores
  const allMetrics = {
    incomeMetrics,
    spendingMetrics,
    liquidityMetrics,
    gigMetrics
  };

  const { creditScore, scoreBreakdown } = aggregateAllScores(allMetrics);

  console.log(`\n🎯 Credit Score: ${creditScore}`);
  console.log(`📊 Score Breakdown:`, scoreBreakdown);

  // Step 3: Classify risk
  const riskLevel = analyzeRisk(
    creditScore,
    scoreBreakdown,
    { ...incomeMetrics, ...spendingMetrics, ...liquidityMetrics }
  ).riskLevel;

  console.log(`⚠️  Risk Level: ${riskLevel}\n`);

  // Step 4: Prepare complete metrics object
  const metrics = {
    ...incomeMetrics,
    ...spendingMetrics,
    ...liquidityMetrics
  };

  // Step 5: Save or update CreditProfile in database
  const creditProfile = await CreditProfile.findOneAndUpdate(
    { userId },
    {
      userId,
      creditScore,
      riskLevel,
      scoreBreakdown,
      metrics
    },
    {
      new: true,
      upsert: true,
      runValidators: true
    }
  );

  // Step 6: Return complete profile
  return {
    creditScore,
    riskLevel,
    scoreBreakdown,
    metrics,
    profileId: creditProfile._id
  };
}

/**
 * Get existing credit profile
 * 
 * @param {String} userId - User ID
 * @returns {Object} - Credit profile or null
 */
export async function getCreditProfile(userId) {
  if (!userId) {
    throw new Error("userId is required");
  }

  const profile = await CreditProfile.findOne({ userId });
  
  if (!profile) {
    return null;
  }

  return {
    creditScore: profile.creditScore,
    riskLevel: profile.riskLevel,
    scoreBreakdown: profile.scoreBreakdown,
    metrics: profile.metrics,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt
  };
}

/**
 * Recalculate credit profile for existing user
 * Fetches transactions from database and recalculates
 * 
 * @param {String} userId - User ID
 * @param {Array} transactions - Fresh transaction data
 * @param {Object} gigData - Optional gig data
 * @returns {Object} - Updated credit profile
 */
export async function recalculateCreditProfile(userId, transactions, gigData = {}) {
  return await calculateCreditProfile({ userId, transactions, gigData });
}

/**
 * Get risk analysis for a credit score
 * Useful for what-if scenarios
 * 
 * @param {Number} creditScore - Credit score to analyze
 * @param {Object} scoreBreakdown - Category scores
 * @param {Object} metrics - Detailed metrics
 * @returns {Object} - Risk analysis
 */
export function getRiskAnalysis(creditScore, scoreBreakdown, metrics) {
  return analyzeRisk(creditScore, scoreBreakdown, metrics);
}

export default {
  calculateCreditProfile,
  getCreditProfile,
  recalculateCreditProfile,
  getRiskAnalysis
};
