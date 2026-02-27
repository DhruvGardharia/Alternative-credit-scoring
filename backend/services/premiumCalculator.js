/**
 * Premium Calculator
 * Calculates the final insurance premium based on policy type and risk assessment.
 */

// Base premiums in INR
const BASE_PREMIUMS = {
    shift: 15, // per ~4-hour shift
    daily: 40, // per full day
};

// Coverage amounts in INR
const COVERAGE_AMOUNTS = {
    shift: {
        LOW: 50000,
        MEDIUM: 40000,
        HIGH: 30000,
    },
    daily: {
        LOW: 100000,
        MEDIUM: 75000,
        HIGH: 50000,
    },
};

/**
 * Calculate dynamic premium
 * @param {string} policyType - "shift" or "daily"
 * @param {object} riskAssessment - result from insuranceRiskEngine.assessRisk()
 * @returns {object} premium details
 */
export function calculatePremium(policyType, riskAssessment) {
    const basePremium = BASE_PREMIUMS[policyType] || 15;
    const { premiumMultiplier, riskClassification, locationRiskFactor } = riskAssessment;

    const finalPremium = Math.round(basePremium * premiumMultiplier);
    const coverageAmount = COVERAGE_AMOUNTS[policyType]?.[riskClassification] || 50000;

    return {
        policyType,
        basePremium,
        premiumMultiplier,
        locationRiskFactor,
        finalPremium,
        coverageAmount,
        breakdown: {
            basePremium,
            riskAdjustment: parseFloat((basePremium * (premiumMultiplier - 1)).toFixed(2)),
            finalPremium,
        },
        coverageItems: [
            { item: "Personal Accident", limit: Math.round(coverageAmount * 0.5) },
            { item: "Medical Expenses", limit: Math.round(coverageAmount * 0.3) },
            { item: "Equipment Damage", limit: Math.round(coverageAmount * 0.15) },
            { item: "Third Party Liability", limit: Math.round(coverageAmount * 0.05) },
        ],
    };
}

/**
 * Calculate duration for policy type
 */
export function getPolicyDuration(policyType) {
    const now = new Date();
    const end = new Date(now);

    if (policyType === "shift") {
        end.setHours(end.getHours() + 8); // 8-hour shift
    } else {
        end.setHours(23, 59, 59, 999); // end of day
    }

    return { startTime: now, endTime: end };
}
