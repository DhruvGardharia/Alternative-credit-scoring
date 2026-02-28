import mongoose from "mongoose";

/**
 * CreditProfile Model
 * 
 * Stores comprehensive credit scoring data for users
 * Designed to be source-agnostic (works with any transaction format)
 */

const metricSchema = new mongoose.Schema({
  value: { type: Number, required: true },
  score: { type: Number, required: true, min: 0, max: 100 },
  status: { type: String, required: true },
  lastUpdated: { type: Date, default: Date.now }
}, { _id: false });

const creditProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    // Final aggregated scores
    creditScore: {
      type: Number,
      required: true,
      min: 0,
      max: 850,
      default: 0
    },

    riskLevel: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      required: true,
      default: "HIGH"
    },

    // Score breakdown by category
    scoreBreakdown: {
      incomeQualityScore: { type: Number, default: 0, min: 0, max: 100 },
      spendingBehaviorScore: { type: Number, default: 0, min: 0, max: 100 },
      liquidityScore: { type: Number, default: 0, min: 0, max: 100 },
      gigStabilityScore: { type: Number, default: 0, min: 0, max: 100 }
    },

    // Detailed metrics with scores
    metrics: {
      // INCOME QUALITY METRICS
      avgMonthlyIncome: {
        type: metricSchema,
        default: { value: 0, score: 0, status: "Not Calculated", lastUpdated: Date.now() }
      },
      incomeVolatility: {
        type: metricSchema,
        default: { value: 0, score: 0, status: "Not Calculated", lastUpdated: Date.now() }
      },
      incomeConsistency: {
        type: metricSchema,
        default: { value: 0, score: 0, status: "Not Calculated", lastUpdated: Date.now() }
      },
      incomeTrend: {
        type: metricSchema,
        default: { value: 0, score: 0, status: "Not Calculated", lastUpdated: Date.now() }
      },
      activeWorkDays: {
        type: metricSchema,
        default: { value: 0, score: 0, status: "Not Calculated", lastUpdated: Date.now() }
      },
      incomeDiversification: {
        type: metricSchema,
        default: { value: 0, score: 0, status: "Not Calculated", lastUpdated: Date.now() }
      },
      workStability: {
        type: metricSchema,
        default: { value: 0, score: 0, status: "Not Calculated", lastUpdated: Date.now() }
      },

      // SPENDING BEHAVIOR METRICS
      netCashFlowRatio: {
        type: metricSchema,
        default: { value: 0, score: 0, status: "Not Calculated", lastUpdated: Date.now() }
      },
      savingsBehavior: {
        type: metricSchema,
        default: { value: 0, score: 0, status: "Not Calculated", lastUpdated: Date.now() }
      },
      expenseShocks: {
        type: metricSchema,
        default: { value: 0, score: 0, status: "Not Calculated", lastUpdated: Date.now() }
      },
      fixedObligationRatio: {
        type: metricSchema,
        default: { value: 0, score: 0, status: "Not Calculated", lastUpdated: Date.now() }
      },

      // LIQUIDITY METRICS
      avgDailyBalance: {
        type: metricSchema,
        default: { value: 0, score: 0, status: "Not Calculated", lastUpdated: Date.now() }
      },
      negativeBalanceRisk: {
        type: metricSchema,
        default: { value: 0, score: 0, status: "Not Calculated", lastUpdated: Date.now() }
      }
    },

    // Blockchain anchoring (optional — populated after credit calculation)
    blockchain: {
      snapshotHash:    { type: String, default: null },
      transactionHash: { type: String, default: null },
      anchoredAt:      { type: Date,   default: null }
    }
  },
  {
    timestamps: true
  }
);

// Indexes for query optimization
creditProfileSchema.index({ creditScore: 1 });
creditProfileSchema.index({ riskLevel: 1 });
creditProfileSchema.index({ updatedAt: -1 });

// Instance method to check if profile is stale (older than 30 days)
creditProfileSchema.methods.isStale = function() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return this.updatedAt < thirtyDaysAgo;
};

// Static method to get profile or create new one
creditProfileSchema.statics.getOrCreate = async function(userId) {
  let profile = await this.findOne({ userId });
  
  if (!profile) {
    profile = await this.create({ userId });
  }
  
  return profile;
};

export const CreditProfile = mongoose.model("CreditProfile", creditProfileSchema);
