/**
 * Score Aggregator
 * 
 * Combines individual metric scores into category scores
 * and aggregates category scores into final credit score (300-850)
 */

import {
  CATEGORY_WEIGHTS,
  INCOME_METRICS,
  SPENDING_METRICS,
  LIQUIDITY_METRICS,
  SCORE_RANGE
} from "../../config/metricDefinitions.js";

/**
 * Calculate weighted score for a category
 * @param {Object} metrics - Object containing metric results { metricName: { value, score, status } }
 * @param {Object} metricDefinitions - Metric definitions with weights
 * @returns {Number} - Category score (0-100)
 */
function calculateCategoryScore(metrics, metricDefinitions) {
  let weightedSum = 0;
  let totalWeight = 0;

  Object.entries(metrics).forEach(([metricName, metricResult]) => {
    if (metricDefinitions[metricName]) {
      const weight = metricDefinitions[metricName].weight;
      const score = metricResult.score || 0;
      
      // Ensure score is a valid number
      if (typeof score === 'number' && !isNaN(score) && isFinite(score)) {
        weightedSum += score * weight;
        totalWeight += weight;
      }
    }
  });

  // Return weighted average, default to 50 if no valid scores
  if (totalWeight > 0) {
    const result = weightedSum / totalWeight;
    return isNaN(result) || !isFinite(result) ? 50 : result;
  }
  return 50; // Default middle score if no metrics
}

/**
 * Aggregate income quality score
 */
export function aggregateIncomeScore(incomeMetrics) {
  return calculateCategoryScore(incomeMetrics, INCOME_METRICS);
}

/**
 * Aggregate spending behavior score
 */
export function aggregateSpendingScore(spendingMetrics) {
  return calculateCategoryScore(spendingMetrics, SPENDING_METRICS);
}

/**
 * Aggregate liquidity score
 */
export function aggregateLiquidityScore(liquidityMetrics) {
  return calculateCategoryScore(liquidityMetrics, LIQUIDITY_METRICS);
}

/**
 * Aggregate gig stability score
 */
export function aggregateGigScore(gigMetrics) {
  // For gig metrics, we directly use the gigStabilityScore
  return gigMetrics.gigStabilityScore?.score || 50;
}

/**
 * Calculate final credit score (0-1000)
 * Combines all category scores using CATEGORY_WEIGHTS
 * 
 * @param {Object} scoreBreakdown - Category scores
 * @returns {Number} - Final credit score (0-1000)
 */
export function calculateFinalCreditScore(scoreBreakdown) {
  const {
    incomeQualityScore = 50,
    spendingBehaviorScore = 50,
    liquidityScore = 50,
    gigStabilityScore = 50
  } = scoreBreakdown;

  // Ensure all scores are valid numbers
  const validIncomeScore = isNaN(incomeQualityScore) || !isFinite(incomeQualityScore) ? 50 : incomeQualityScore;
  const validSpendingScore = isNaN(spendingBehaviorScore) || !isFinite(spendingBehaviorScore) ? 50 : spendingBehaviorScore;
  const validLiquidityScore = isNaN(liquidityScore) || !isFinite(liquidityScore) ? 50 : liquidityScore;
  const validGigScore = isNaN(gigStabilityScore) || !isFinite(gigStabilityScore) ? 50 : gigStabilityScore;

  // Calculate weighted average of category scores (0-100)
  const compositeScore =
    (validIncomeScore * CATEGORY_WEIGHTS.incomeQuality +
      validSpendingScore * CATEGORY_WEIGHTS.spendingBehavior +
      validLiquidityScore * CATEGORY_WEIGHTS.liquidity +
      validGigScore * CATEGORY_WEIGHTS.gigStability) /
    100;

  // Convert 0-100 score to 300-850 range
  const creditScore =
    SCORE_RANGE.MIN +
    (compositeScore / 100) * (SCORE_RANGE.MAX - SCORE_RANGE.MIN);

  // Round to nearest integer and ensure it's within range
  const finalScore = Math.round(creditScore);
  
  // Clamp score to valid range (300-850)
  return Math.max(SCORE_RANGE.MIN, Math.min(SCORE_RANGE.MAX, finalScore));
}

/**
 * Aggregate all scores
 * Takes all calculated metrics and produces final credit score and breakdown
 * 
 * @param {Object} allMetrics - All calculated metrics
 * @returns {Object} - { creditScore, scoreBreakdown }
 */
export function aggregateAllScores(allMetrics) {
  const { incomeMetrics, spendingMetrics, liquidityMetrics, gigMetrics } = allMetrics;

  // Calculate category scores (0-100)
  const scoreBreakdown = {
    incomeQualityScore: Math.round(aggregateIncomeScore(incomeMetrics)),
    spendingBehaviorScore: Math.round(aggregateSpendingScore(spendingMetrics)),
    liquidityScore: Math.round(aggregateLiquidityScore(liquidityMetrics)),
    gigStabilityScore: Math.round(aggregateGigScore(gigMetrics))
  };

  // Calculate final credit score (300-850)
  const creditScore = calculateFinalCreditScore(scoreBreakdown);

  return {
    creditScore,
    scoreBreakdown
  };
}
