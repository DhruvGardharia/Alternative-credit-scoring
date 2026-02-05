import { Expense } from "../models/expenseModel.js";
import TryCatch from "../utils/TryCatch.js";

// Add new expense
export const addExpense = TryCatch(async (req, res) => {
  const { category, amount, description, date, paymentMethod } = req.body;
  const userId = req.user.id;

  if (!category || !amount) {
    return res.status(400).json({
      message: "Category and amount are required",
    });
  }

  const expense = await Expense.create({
    userId,
    category,
    amount,
    description,
    date: date || Date.now(),
    paymentMethod,
  });

  res.status(201).json({
    success: true,
    message: "Expense added successfully",
    expense,
  });
});

// Get all expenses for user
export const getExpenses = TryCatch(async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate, category } = req.query;

  let query = { userId };

  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  if (category) {
    query.category = category;
  }

  const expenses = await Expense.find(query).sort({ date: -1 });

  // Calculate summary
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const categoryBreakdown = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  res.json({
    success: true,
    expenses,
    summary: {
      totalExpenses,
      count: expenses.length,
      categoryBreakdown,
    },
  });
});

// Update expense
export const updateExpense = TryCatch(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { category, amount, description, date, paymentMethod } = req.body;

  const expense = await Expense.findOne({ _id: id, userId });

  if (!expense) {
    return res.status(404).json({
      message: "Expense not found",
    });
  }

  if (category) expense.category = category;
  if (amount) expense.amount = amount;
  if (description !== undefined) expense.description = description;
  if (date) expense.date = date;
  if (paymentMethod) expense.paymentMethod = paymentMethod;

  await expense.save();

  res.json({
    success: true,
    message: "Expense updated successfully",
    expense,
  });
});

// Delete expense
export const deleteExpense = TryCatch(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const expense = await Expense.findOneAndDelete({ _id: id, userId });

  if (!expense) {
    return res.status(404).json({
      message: "Expense not found",
    });
  }

  res.json({
    success: true,
    message: "Expense deleted successfully",
  });
});

// Get expense statistics
export const getExpenseStats = TryCatch(async (req, res) => {
  const userId = req.user.id;
  const { period = "month" } = req.query;

  const now = new Date();
  let startDate;

  switch (period) {
    case "week":
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case "month":
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case "year":
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      startDate = new Date(now.setMonth(now.getMonth() - 1));
  }

  const expenses = await Expense.find({
    userId,
    date: { $gte: startDate },
  });

  const stats = {
    totalAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
    count: expenses.length,
    averagePerTransaction: expenses.length > 0 
      ? expenses.reduce((sum, exp) => sum + exp.amount, 0) / expenses.length 
      : 0,
    byCategory: {},
    byPaymentMethod: {},
    dailyAverage: 0,
  };

  // Category breakdown
  expenses.forEach(exp => {
    stats.byCategory[exp.category] = (stats.byCategory[exp.category] || 0) + exp.amount;
    stats.byPaymentMethod[exp.paymentMethod] = (stats.byPaymentMethod[exp.paymentMethod] || 0) + exp.amount;
  });

  // Daily average
  const days = Math.ceil((Date.now() - startDate) / (1000 * 60 * 60 * 24));
  stats.dailyAverage = stats.totalAmount / days;

  res.json({
    success: true,
    period,
    stats,
  });
});
