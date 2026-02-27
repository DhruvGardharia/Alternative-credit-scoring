import mongoose from "mongoose";
import "./incomeModel.js";
import "./expenseModel.js";

/**
 * Financial Summary Model
 *
 * Central snapshot of user's financial state
 * Auto-updates when Income or Expense changes
 * Used by ALL teams: Credit, Insurance, Expense Tracking, Lender Dashboard
 */

const financialSummarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // Income Summary
    totalIncome: { type: Number, default: 0 },
    monthlyAvgIncome: { type: Number, default: 0 },
    lastIncomeDate: Date,
    incomeByPlatform: {
      uber: { type: Number, default: 0 },
      ola: { type: Number, default: 0 },
      rapido: { type: Number, default: 0 },
      swiggy: { type: Number, default: 0 },
      zomato: { type: Number, default: 0 },
      zepto: { type: Number, default: 0 },
      blinkit: { type: Number, default: 0 },
      dunzo: { type: Number, default: 0 },
      fiverr: { type: Number, default: 0 },
      upwork: { type: Number, default: 0 },
      freelancer: { type: Number, default: 0 },
      urbanCompany: { type: Number, default: 0 },
      meesho: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },

    // Expense Summary
    totalExpenses: { type: Number, default: 0 },
    monthlyAvgExpenses: { type: Number, default: 0 },
    lastExpenseDate: Date,
    expensesByCategory: {
      food: { type: Number, default: 0 },
      transport: { type: Number, default: 0 },
      utilities: { type: Number, default: 0 },
      rent: { type: Number, default: 0 },
      healthcare: { type: Number, default: 0 },
      entertainment: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },

    // Net Position
    netBalance: { type: Number, default: 0 }, // totalIncome - totalExpenses
    savingsRate: { type: Number, default: 0 }, // (netBalance / totalIncome) * 100

    // Period Covered
    dataStartDate: Date,
    dataEndDate: Date,

    // Last Update Tracking
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

// Calculate and update summary
financialSummarySchema.statics.updateSummary = async function (userId) {
  const Income = mongoose.model("Income");
  const Expense = mongoose.model("Expense");

  // Get all income
  const incomes = await Income.find({ userId, status: "completed" }).lean();
  const expenses = await Expense.find({ userId }).lean();

  if (incomes.length === 0 && expenses.length === 0) {
    return null;
  }

  // Calculate income metrics
  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
  const incomeByPlatform = {
    uber: 0,
    ola: 0,
    rapido: 0,
    swiggy: 0,
    zomato: 0,
    zepto: 0,
    blinkit: 0,
    dunzo: 0,
    fiverr: 0,
    upwork: 0,
    freelancer: 0,
    urbanCompany: 0,
    meesho: 0,
    other: 0,
  };

  incomes.forEach((inc) => {
    const platform = inc.platform?.toLowerCase();
    if (incomeByPlatform.hasOwnProperty(platform)) {
      incomeByPlatform[platform] += inc.amount;
    } else {
      incomeByPlatform.other += inc.amount;
    }
  });

  // Calculate expense metrics
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const expensesByCategory = {
    food: 0,
    transport: 0,
    utilities: 0,
    rent: 0,
    healthcare: 0,
    entertainment: 0,
    other: 0,
  };

  expenses.forEach((exp) => {
    if (expensesByCategory.hasOwnProperty(exp.category)) {
      expensesByCategory[exp.category] += exp.amount;
    } else {
      expensesByCategory.other += exp.amount;
    }
  });

  // Calculate monthly averages
  const allDates = [
    ...incomes.map((i) => new Date(i.date)),
    ...expenses.map((e) => new Date(e.date)),
  ];

  const dataStartDate =
    allDates.length > 0 ? new Date(Math.min(...allDates)) : new Date();
  const dataEndDate =
    allDates.length > 0 ? new Date(Math.max(...allDates)) : new Date();

  const monthsDiff = Math.max(
    1,
    (dataEndDate.getFullYear() - dataStartDate.getFullYear()) * 12 +
      (dataEndDate.getMonth() - dataStartDate.getMonth()) +
      1,
  );

  const monthlyAvgIncome = totalIncome / monthsDiff;
  const monthlyAvgExpenses = totalExpenses / monthsDiff;

  // Net position
  const netBalance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;

  // Last transaction dates
  const lastIncomeDate =
    incomes.length > 0
      ? new Date(Math.max(...incomes.map((i) => new Date(i.date))))
      : null;
  const lastExpenseDate =
    expenses.length > 0
      ? new Date(Math.max(...expenses.map((e) => new Date(e.date))))
      : null;

  // Update or create summary
  const summary = await this.findOneAndUpdate(
    { userId },
    {
      userId,
      totalIncome,
      monthlyAvgIncome,
      lastIncomeDate,
      incomeByPlatform,
      totalExpenses,
      monthlyAvgExpenses,
      lastExpenseDate,
      expensesByCategory,
      netBalance,
      savingsRate: parseFloat(savingsRate.toFixed(2)),
      dataStartDate,
      dataEndDate,
      lastUpdated: new Date(),
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  return summary;
};

export const UserFinancialSummary =
  mongoose.models.UserFinancialSummary ||
  mongoose.model("UserFinancialSummary", financialSummarySchema);

export const FinancialSummary = UserFinancialSummary;
