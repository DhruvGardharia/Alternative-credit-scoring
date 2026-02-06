import mongoose from "mongoose";

const creditScoreSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    financialSummaryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FinancialSummary",
      required: true
    },
    score: { type: Number, required: true, min: 0, max: 100 },
    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      required: true
    },
    eligibleCreditAmount: { type: Number, required: true },
    explanation: [String], // Human-readable decision factors
    // Enhanced metrics (new fields appended)
    advancedMetrics: {
      incomeVolatility: { type: Number, default: 0 },
      incomeVolatilityBand: { type: String, enum: ["Low", "Medium", "High"], default: "Low" },
      netCashFlowRatio: { type: Number, default: 0 },
      cashFlowBand: { type: String, enum: ["Positive", "Neutral", "Negative"], default: "Neutral" },
      expenseShockMonths: { type: Number, default: 0 },
      expenseShockBand: { type: String, enum: ["None", "Occasional", "Frequent"], default: "None" }
    },
    calculatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const CreditScore = mongoose.model("CreditScore", creditScoreSchema);
