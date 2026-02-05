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
    calculatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const CreditScore = mongoose.model("CreditScore", creditScoreSchema);
