import { CreditProfile } from "../models/CreditProfile.js";
import { InsuranceClaim } from "../models/InsuranceClaim.js";

/**
 * Insurance Risk Engine
 * Calculates a risk score (0–100) and premium multiplier using:
 * - CreditProfile data (income stability, work consistency, savings)
 * - Historical claims data
 * - Location risk zone
 * - Policy type (shift vs daily)
 */

// Location risk factors by zone
const LOCATION_RISK = {
    urban: 1.0,
    suburban: 0.85,
    rural: 0.7,
    high_density: 1.3,
    industrial: 1.2,
};

// Work-hours risk (longer = more exposure)
const WORK_HOURS_RISK = {
    shift: 0.9, // ~4h shift
    daily: 1.1, // ~8h day
};

/**
 * Main risk assessment function
 */
export async function assessRisk(userId, policyType = "shift", locationZone = "urban") {
    let creditProfile = null;

    try {
        creditProfile = await CreditProfile.findOne({ userId });
    } catch (err) {
        // If no credit profile, use default risk
    }

    // --- Component 1: Income Stability (35%) ---
    let incomeStabilityScore = 50; // default
    if (creditProfile) {
        const { incomeVolatility, incomeConsistency, workStability, avgMonthlyIncome } =
            creditProfile.metrics;
        // Lower volatility = better score
        const volScore = Math.max(0, 100 - (incomeVolatility?.value || 0.5) * 100);
        const consScore = incomeConsistency?.score || 50;
        const stabScore = workStability?.score || 50;
        incomeStabilityScore = volScore * 0.4 + consScore * 0.35 + stabScore * 0.25;
    }

    // --- Component 2: Claims History (20%) ---
    let claimsHistoryScore = 80; // start positive, deduct per claim
    try {
        const pastClaims = await InsuranceClaim.find({ userId }).lean();
        const fraudClaims = pastClaims.filter(
            (c) => c.llmAnalysis?.fraudRisk === "HIGH"
        ).length;
        const totalClaims = pastClaims.length;

        // Deduct: 5 points per claim, 15 per fraud flag
        claimsHistoryScore = Math.max(0, 80 - totalClaims * 5 - fraudClaims * 15);
    } catch (err) {
        claimsHistoryScore = 80;
    }

    // --- Component 3: Earnings Trend (25%) ---
    let earningsTrendScore = 50;
    if (creditProfile) {
        earningsTrendScore = creditProfile.metrics?.incomeTrend?.score || 50;
    }

    // --- Component 4: Savings & Liquidity (20%) ---
    let liquidityScore = 50;
    if (creditProfile) {
        const savings = creditProfile.metrics?.savingsBehavior?.score || 50;
        const avgBalance = creditProfile.metrics?.avgDailyBalance?.score || 50;
        liquidityScore = savings * 0.6 + avgBalance * 0.4;
    }

    // --- Weighted Composite Score (higher = safer / lower risk) ---
    const compositeScore =
        incomeStabilityScore * 0.35 +
        claimsHistoryScore * 0.20 +
        earningsTrendScore * 0.25 +
        liquidityScore * 0.20;

    // --- Risk Classification ---
    let riskClassification;
    let premiumMultiplier;
    if (compositeScore >= 70) {
        riskClassification = "LOW";
        premiumMultiplier = 1.0;
    } else if (compositeScore >= 45) {
        riskClassification = "MEDIUM";
        premiumMultiplier = 1.5;
    } else {
        riskClassification = "HIGH";
        premiumMultiplier = 2.0;
    }

    // Apply location and work-hours adjustments
    const locationFactor = LOCATION_RISK[locationZone] || 1.0;
    const hoursFactor = WORK_HOURS_RISK[policyType] || 1.0;
    const finalMultiplier = premiumMultiplier * locationFactor * hoursFactor;

    // --- Coverage Suggestions based on risk ---
    const coverageSuggestions = generateCoverageSuggestions(riskClassification, policyType);

    return {
        riskScore: Math.round(compositeScore),
        riskClassification,
        premiumMultiplier: parseFloat(finalMultiplier.toFixed(2)),
        scoreBreakdown: {
            incomeStability: Math.round(incomeStabilityScore),
            claimsHistory: Math.round(claimsHistoryScore),
            earningsTrend: Math.round(earningsTrendScore),
            liquidity: Math.round(liquidityScore),
        },
        locationRiskFactor: locationFactor,
        workHoursFactor: hoursFactor,
        coverageSuggestions,
    };
}

function generateCoverageSuggestions(riskClassification, policyType) {
    const base = [
        "Personal Accident Cover",
        "Medical Emergency Cover",
    ];
    const medium = [...base, "Equipment Damage Cover"];
    const high = [...medium, "Third Party Liability", "Income Protection"];

    if (riskClassification === "LOW") return base;
    if (riskClassification === "MEDIUM") return medium;
    return high;
}
