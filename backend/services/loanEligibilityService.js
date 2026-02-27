/**
 * Loan Eligibility Service
 * 
 * Uses existing CreditProfile and FinancialSummary to determine
 * emergency loan eligibility and maximum amount
 */

import { CreditProfile } from "../models/CreditProfile.js";
import { FinancialSummary } from "../models/financialSummary.js";

/**
 * Check loan eligibility for a gig worker
 * 
 * @param {String} userId - The gig worker's user ID
 * @returns {Object} Eligibility result
 */
export async function checkEligibility(userId) {
    const [creditProfile, financialSummary] = await Promise.all([
        CreditProfile.findOne({ userId }),
        FinancialSummary.findOne({ userId })
    ]);

    const result = {
        eligible: false,
        maxAmount: 0,
        suggestedInterestRate: 0,
        creditScore: 0,
        riskLevel: "HIGH",
        scoreBreakdown: {},
        financialSnapshot: {},
        reasons: []
    };

    // No credit profile → not eligible
    if (!creditProfile) {
        result.reasons.push("No credit profile found. Please complete credit analysis first.");
        return result;
    }

    result.creditScore = creditProfile.creditScore;
    result.riskLevel = creditProfile.riskLevel;
    result.scoreBreakdown = creditProfile.scoreBreakdown || {};

    // Populate financial snapshot
    if (financialSummary) {
        result.financialSnapshot = {
            monthlyAvgIncome: financialSummary.monthlyAvgIncome || 0,
            monthlyAvgExpenses: financialSummary.monthlyAvgExpenses || 0,
            savingsRate: financialSummary.savingsRate || 0,
            netBalance: financialSummary.netBalance || 0
        };
    }

    // Eligibility threshold: credit score ≥ 400
    if (creditProfile.creditScore < 400) {
        result.reasons.push(`Credit score (${creditProfile.creditScore}) is below minimum threshold of 400.`);
        return result;
    }

    result.eligible = true;

    // Calculate max loan amount based on credit score and income
    const monthlyIncome = financialSummary?.monthlyAvgIncome || 0;
    const score = creditProfile.creditScore;

    if (score >= 750) {
        // Excellent: up to 5x monthly income, max ₹5,00,000
        result.maxAmount = Math.min(monthlyIncome * 5, 500000);
        result.suggestedInterestRate = 8;
        result.reasons.push("Excellent credit score — highest loan tier eligible.");
    } else if (score >= 650) {
        // Good: up to 3x monthly income, max ₹3,00,000
        result.maxAmount = Math.min(monthlyIncome * 3, 300000);
        result.suggestedInterestRate = 12;
        result.reasons.push("Good credit score — standard loan tier eligible.");
    } else if (score >= 500) {
        // Fair: up to 2x monthly income, max ₹1,50,000
        result.maxAmount = Math.min(monthlyIncome * 2, 150000);
        result.suggestedInterestRate = 16;
        result.reasons.push("Fair credit score — basic loan tier eligible.");
    } else {
        // Low: up to 1x monthly income, max ₹50,000
        result.maxAmount = Math.min(monthlyIncome * 1, 50000);
        result.suggestedInterestRate = 20;
        result.reasons.push("Low credit score — emergency-only tier eligible.");
    }

    // Ensure minimum amount
    if (result.maxAmount < 1000) {
        result.maxAmount = 1000;
    }

    // Round to nearest 100
    result.maxAmount = Math.round(result.maxAmount / 100) * 100;

    return result;
}
