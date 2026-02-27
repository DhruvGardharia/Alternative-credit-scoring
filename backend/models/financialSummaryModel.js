import mongoose from "mongoose";

const financialSummarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    bankStatementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankStatement",
      required: true
    },
    averageMonthlyIncome: { type: Number, default: 0 },
    incomeConsistencyScore: { type: Number, default: 0 }, // 0-100
    activeWorkDays: { type: Number, default: 0 },
    expenseToIncomeRatio: { type: Number, default: 0 }, // 0-1
    averageDailyBalance: { type: Number, default: 0 },
    // Enhanced metrics for advanced credit scoring
    monthlyIncomes: { type: [Number], default: [] }, // Array of monthly income values
    monthlyDebits: { type: [Number], default: [] }, // Array of monthly debit values
    totalCredits: { type: Number, default: 0 }, // Total credits over analysis period
    totalDebits: { type: Number, default: 0 }, // Total debits over analysis period
    analysisDate: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const FinancialSummary =
  mongoose.models.FinancialSummary ||
  mongoose.model("FinancialSummary", financialSummarySchema);
