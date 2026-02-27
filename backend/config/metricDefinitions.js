/**
 * Metric Definitions & Configuration
 * 
 * Centralizes all scoring rules, thresholds, and weights
 * Makes it easy to tune the credit scoring algorithm
 */

export const SCORE_RANGE = {
  MIN: 0,
  MAX: 1000
};

export const RISK_BANDS = {
  HIGH: { min: 0,   max: 350,  label: "HIGH" },
  MEDIUM: { min: 351, max: 700,  label: "MEDIUM" },
  LOW: { min: 701, max: 1000, label: "LOW" }
};

/**
 * Category Weights (must sum to 100)
 */
export const CATEGORY_WEIGHTS = {
  incomeQuality: 35,      // 35%
  spendingBehavior: 30,   // 30%
  liquidity: 20,          // 20%
  gigStability: 15        // 15%
};

/**
 * Metric Definitions
 * Each metric includes:
 * - weight: contribution to category score
 * - scoringBands: thresholds for scoring (higher band = better score)
 * - statusLabels: human-readable status messages
 */

export const INCOME_METRICS = {
  avgMonthlyIncome: {
    weight: 20,
    scoringBands: [
      { min: 0, max: 10000, score: 20, status: "Very Low Income" },
      { min: 10001, max: 20000, score: 40, status: "Low Income" },
      { min: 20001, max: 35000, score: 60, status: "Moderate Income" },
      { min: 35001, max: 50000, score: 80, status: "Good Income" },
      { min: 50001, max: Infinity, score: 100, status: "Excellent Income" }
    ]
  },
  
  incomeVolatility: {
    weight: 15,
    // Lower volatility is better (coefficient of variation)
    scoringBands: [
      { min: 0, max: 0.15, score: 100, status: "Very Stable" },
      { min: 0.16, max: 0.30, score: 80, status: "Stable" },
      { min: 0.31, max: 0.50, score: 60, status: "Moderate Volatility" },
      { min: 0.51, max: 0.75, score: 40, status: "High Volatility" },
      { min: 0.76, max: Infinity, score: 20, status: "Very High Volatility" }
    ]
  },

  incomeConsistency: {
    weight: 15,
    // Percentage of months with income
    scoringBands: [
      { min: 0, max: 40, score: 20, status: "Very Inconsistent" },
      { min: 41, max: 60, score: 40, status: "Inconsistent" },
      { min: 61, max: 75, score: 60, status: "Moderately Consistent" },
      { min: 76, max: 90, score: 80, status: "Consistent" },
      { min: 91, max: 100, score: 100, status: "Highly Consistent" }
    ]
  },

  incomeTrend: {
    weight: 15,
    // Month-over-month growth rate (%)
    scoringBands: [
      { min: -Infinity, max: -10, score: 20, status: "Declining" },
      { min: -9.99, max: -5, score: 40, status: "Slightly Declining" },
      { min: -4.99, max: 5, score: 60, status: "Stable" },
      { min: 5.01, max: 15, score: 80, status: "Growing" },
      { min: 15.01, max: Infinity, score: 100, status: "Rapidly Growing" }
    ]
  },

  activeWorkDays: {
    weight: 10,
    // Days per month with income transactions
    scoringBands: [
      { min: 0, max: 5, score: 20, status: "Very Low Activity" },
      { min: 6, max: 10, score: 40, status: "Low Activity" },
      { min: 11, max: 15, score: 60, status: "Moderate Activity" },
      { min: 16, max: 22, score: 80, status: "High Activity" },
      { min: 23, max: Infinity, score: 100, status: "Very High Activity" }
    ]
  },

  incomeDiversification: {
    weight: 15,
    // Number of unique income sources
    scoringBands: [
      { min: 0, max: 1, score: 20, status: "Single Source" },
      { min: 2, max: 2, score: 50, status: "Two Sources" },
      { min: 3, max: 3, score: 75, status: "Multiple Sources" },
      { min: 4, max: Infinity, score: 100, status: "Highly Diversified" }
    ]
  },

  workStability: {
    weight: 10,
    // Max consecutive days without income
    scoringBands: [
      { min: 0, max: 3, score: 100, status: "Excellent Stability" },
      { min: 4, max: 7, score: 80, status: "Good Stability" },
      { min: 8, max: 14, score: 60, status: "Moderate Gaps" },
      { min: 15, max: 30, score: 40, status: "Significant Gaps" },
      { min: 31, max: Infinity, score: 20, status: "Extended Gaps" }
    ]
  }
};

export const SPENDING_METRICS = {
  netCashFlowRatio: {
    weight: 30,
    // (Income - Expenses) / Income
    scoringBands: [
      { min: -Infinity, max: 0, score: 0, status: "Negative Cash Flow" },
      { min: 0.01, max: 0.10, score: 30, status: "Minimal Savings" },
      { min: 0.11, max: 0.20, score: 60, status: "Moderate Savings" },
      { min: 0.21, max: 0.35, score: 80, status: "Good Savings" },
      { min: 0.36, max: Infinity, score: 100, status: "Excellent Savings" }
    ]
  },

  savingsBehavior: {
    weight: 30,
    // Percentage of months with positive cash flow
    scoringBands: [
      { min: 0, max: 30, score: 20, status: "Rarely Saves" },
      { min: 31, max: 50, score: 40, status: "Occasionally Saves" },
      { min: 51, max: 70, score: 60, status: "Frequently Saves" },
      { min: 71, max: 85, score: 80, status: "Consistently Saves" },
      { min: 86, max: 100, score: 100, status: "Always Saves" }
    ]
  },

  expenseShocks: {
    weight: 20,
    // Number of months with expenses > 150% of average
    scoringBands: [
      { min: 0, max: 0, score: 100, status: "No Shocks" },
      { min: 1, max: 1, score: 80, status: "Rare Shocks" },
      { min: 2, max: 2, score: 60, status: "Occasional Shocks" },
      { min: 3, max: 3, score: 40, status: "Frequent Shocks" },
      { min: 4, max: Infinity, score: 20, status: "Very Frequent Shocks" }
    ]
  },

  fixedObligationRatio: {
    weight: 20,
    // Fixed recurring expenses / Income
    scoringBands: [
      { min: 0, max: 0.20, score: 100, status: "Very Low Obligations" },
      { min: 0.21, max: 0.35, score: 80, status: "Low Obligations" },
      { min: 0.36, max: 0.50, score: 60, status: "Moderate Obligations" },
      { min: 0.51, max: 0.70, score: 40, status: "High Obligations" },
      { min: 0.71, max: Infinity, score: 20, status: "Very High Obligations" }
    ]
  }
};

export const LIQUIDITY_METRICS = {
  avgDailyBalance: {
    weight: 60,
    // Average daily balance
    scoringBands: [
      { min: 0, max: 1000, score: 20, status: "Very Low Liquidity" },
      { min: 1001, max: 3000, score: 40, status: "Low Liquidity" },
      { min: 3001, max: 7000, score: 60, status: "Moderate Liquidity" },
      { min: 7001, max: 15000, score: 80, status: "Good Liquidity" },
      { min: 15001, max: Infinity, score: 100, status: "Excellent Liquidity" }
    ]
  },

  negativeBalanceRisk: {
    weight: 40,
    // Percentage of days with balance < 10% of avg
    scoringBands: [
      { min: 0, max: 5, score: 100, status: "No Risk" },
      { min: 6, max: 15, score: 80, status: "Low Risk" },
      { min: 16, max: 30, score: 60, status: "Moderate Risk" },
      { min: 31, max: 50, score: 40, status: "High Risk" },
      { min: 51, max: Infinity, score: 20, status: "Very High Risk" }
    ]
  }
};

export const GIG_METRICS = {
  // Placeholder for future gig-specific metrics
  // Can include: platform ratings, completion rate, etc.
  gigStabilityScore: {
    weight: 100,
    default: 50 // Default neutral score
  }
};

/**
 * Helper function to get score based on value and scoring bands
 */
export function getScoreFromBands(value, bands) {
  for (const band of bands) {
    if (value >= band.min && value <= band.max) {
      return {
        score: band.score,
        status: band.status
      };
    }
  }
  // Default fallback
  return {
    score: 0,
    status: "Unknown"
  };
}

/**
 * Standardized Transaction Format
 * All data sources must convert to this format
 */
export const TRANSACTION_SCHEMA = {
  userId: "ObjectId",
  transactions: [
    {
      date: "Date",
      type: "credit | debit",
      amount: "Number",
      category: "String",
      source: "platform | manual | bank",
      description: "String (optional)"
    }
  ]
};
