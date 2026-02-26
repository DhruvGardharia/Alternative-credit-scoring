/**
 * Risk Classifier
 * 
 * Classifies credit score into risk bands
 * Provides risk-based recommendations and limits
 */

import { RISK_BANDS } from "../../config/metricDefinitions.js";

/**
 * Classify credit score into risk level
 * 
 * @param {Number} creditScore - Credit score (300-850)
 * @returns {String} - Risk level: "LOW", "MEDIUM", or "HIGH"
 */
export function classifyRiskLevel(creditScore) {
  if (creditScore >= RISK_BANDS.LOW.min && creditScore <= RISK_BANDS.LOW.max) {
    return RISK_BANDS.LOW.label;
  } else if (creditScore >= RISK_BANDS.MEDIUM.min && creditScore <= RISK_BANDS.MEDIUM.max) {
    return RISK_BANDS.MEDIUM.label;
  } else {
    return RISK_BANDS.HIGH.label;
  }
}

/**
 * Get risk-based recommendations
 * 
 * @param {String} riskLevel - Risk level
 * @param {Object} scoreBreakdown - Category scores
 * @param {Object} metrics - Detailed metrics
 * @returns {Object} - Recommendations and insights
 */
export function getRiskRecommendations(riskLevel, scoreBreakdown, metrics) {
  const recommendations = {
    riskLevel,
    eligibleLoanAmount: 0,
    interestRate: 0,
    loanTerm: 0,
    insurancePremiumMultiplier: 1.0,
    walletLimit: 0,
    recommendedActions: [],
    strengths: [],
    weaknesses: []
  };

  // Risk-based loan eligibility
  switch (riskLevel) {
    case "LOW":
      recommendations.eligibleLoanAmount = 50000;
      recommendations.interestRate = 12; // 12% annual
      recommendations.loanTerm = 12; // 12 months
      recommendations.insurancePremiumMultiplier = 1.0;
      recommendations.walletLimit = 100000;
      break;
    case "MEDIUM":
      recommendations.eligibleLoanAmount = 25000;
      recommendations.interestRate = 18; // 18% annual
      recommendations.loanTerm = 6; // 6 months
      recommendations.insurancePremiumMultiplier = 1.5;
      recommendations.walletLimit = 50000;
      break;
    case "HIGH":
      recommendations.eligibleLoanAmount = 10000;
      recommendations.interestRate = 24; // 24% annual
      recommendations.loanTerm = 3; // 3 months
      recommendations.insurancePremiumMultiplier = 2.0;
      recommendations.walletLimit = 20000;
      break;
  }

  // Analyze strengths and weaknesses
  const { incomeQualityScore, spendingBehaviorScore, liquidityScore, gigStabilityScore } = scoreBreakdown;

  // Identify strengths (scores >= 70)
  if (incomeQualityScore >= 70) recommendations.strengths.push("Strong income profile");
  if (spendingBehaviorScore >= 70) recommendations.strengths.push("Excellent spending discipline");
  if (liquidityScore >= 70) recommendations.strengths.push("Good liquidity cushion");
  if (gigStabilityScore >= 70) recommendations.strengths.push("Stable work pattern");

  // Identify weaknesses (scores < 50)
  if (incomeQualityScore < 50) {
    recommendations.weaknesses.push("Income instability detected");
    recommendations.recommendedActions.push("Diversify income sources");
    recommendations.recommendedActions.push("Increase active working days");
  }

  if (spendingBehaviorScore < 50) {
    recommendations.weaknesses.push("High spending relative to income");
    recommendations.recommendedActions.push("Reduce unnecessary expenses");
    recommendations.recommendedActions.push("Build consistent savings habit");
  }

  if (liquidityScore < 50) {
    recommendations.weaknesses.push("Low liquidity reserves");
    recommendations.recommendedActions.push("Maintain higher account balance");
    recommendations.recommendedActions.push("Avoid overdrafts");
  }

  if (gigStabilityScore < 50) {
    recommendations.weaknesses.push("Limited work history");
    recommendations.recommendedActions.push("Build longer earning track record");
  }

  // Metric-specific recommendations
  if (metrics.incomeVolatility?.score < 50) {
    recommendations.recommendedActions.push("Stabilize monthly income");
  }

  if (metrics.netCashFlowRatio?.value < 0.1) {
    recommendations.recommendedActions.push("Increase savings rate to 10%+");
  }

  if (metrics.expenseShocks?.value > 2) {
    recommendations.recommendedActions.push("Plan for irregular expenses");
  }

  // Default strengths if none identified
  if (recommendations.strengths.length === 0) {
    recommendations.strengths.push("Building credit profile");
  }

  return recommendations;
}

/**
 * Get detailed risk analysis
 * Combines risk classification with recommendations
 * 
 * @param {Number} creditScore - Credit score (300-850)
 * @param {Object} scoreBreakdown - Category scores
 * @param {Object} metrics - Detailed metrics
 * @returns {Object} - Complete risk analysis
 */
export function analyzeRisk(creditScore, scoreBreakdown, metrics) {
  const riskLevel = classifyRiskLevel(creditScore);
  const recommendations = getRiskRecommendations(riskLevel, scoreBreakdown, metrics);

  return {
    riskLevel,
    ...recommendations
  };
}
