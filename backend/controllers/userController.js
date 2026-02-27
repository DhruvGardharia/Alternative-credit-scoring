import { User } from "../models/userModel.js";
import { BankStatement } from "../models/bankStatementModel.js";
import { FinancialSummary } from "../models/financialSummary.js";
import { CreditScore } from "../models/creditScoreModel.js";
import { Income } from "../models/incomeModel.js";
import { Expense } from "../models/expenseModel.js";
import TryCatch from "../utils/TryCatch.js";
import { calculateCreditProfile } from "../services/creditEngine/index.js";
import dotenv from "dotenv";

dotenv.config();

// Create a new gig worker
export const createUser = TryCatch(async (req, res) => {
  const { name, email, employmentType } = req.body;

  if (!name || !email || !employmentType) {
    return res.status(400).json({
      message: "Name, email, and employment type are required",
    });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      message: "User with this email already exists",
    });
  }

  const user = await User.create({
    name,
    email,
    employmentType,
  });

  res.status(201).json({
    success: true,
    message: "User created successfully",
    user,
  });
});

// Get user by ID
export const getUserById = TryCatch(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  res.json({
    success: true,
    user,
  });
});

// Get all users
export const getAllUsers = TryCatch(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  
  res.json({
    success: true,
    users,
  });
});

// Upload bank statement (Deprecated - Use statementController instead)
// This function is kept for backward compatibility but should use /api/statement/upload endpoint
export const uploadBankStatement = TryCatch(async (req, res) => {
  return res.status(410).json({
    success: false,
    message: "This endpoint is deprecated. Please use POST /api/statement/upload for PDF bank statements",
  });
});

// Get financial summary for a user
export const getFinancialSummary = TryCatch(async (req, res) => {
  const { userId } = req.params;

  const financialSummary = await FinancialSummary.findOne({ userId })
    .populate("userId", "name email employmentType")
    .populate("bankStatementId", "fileName uploadDate")
    .sort({ createdAt: -1 });

  if (!financialSummary) {
    return res.status(404).json({
      message: "No financial summary found for this user",
    });
  }

  res.json({
    success: true,
    financialSummary,
  });
});

// Generate credit score
export const generateCreditScore = TryCatch(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      message: "User ID is required",
    });
  }

  // Get all incomes and expenses for this user
  const allIncomes = await Income.find({ userId, status: "completed" }).lean();
  const allExpenses = await Expense.find({ userId }).lean();

  if (allIncomes.length === 0 && allExpenses.length === 0) {
    return res.status(404).json({
      message: "No financial data found. Please connect platforms or upload bank statement first.",
    });
  }

  // Convert to normalized transaction format
  const normalizedTransactions = [
    ...allIncomes.map(inc => ({
      date: inc.date,
      type: "credit",
      amount: inc.amount,
      category: inc.platform,
      source: "platform"
    })),
    ...allExpenses.map(exp => ({
      date: exp.date,
      type: "debit",
      amount: exp.amount,
      category: exp.category,
      source: "manual"
    }))
  ];

  // Calculate credit profile using new credit engine
  const creditProfile = await calculateCreditProfile({ 
    userId, 
    transactions: normalizedTransactions 
  });

  res.status(201).json({
    success: true,
    message: "Credit score generated successfully",
    creditProfile,
  });
});

// Get credit score for a user
export const getCreditScore = TryCatch(async (req, res) => {
  const { userId } = req.params;

  const creditScore = await CreditScore.findOne({ userId })
    .populate("userId", "name email employmentType")
    .populate("financialSummaryId")
    .sort({ createdAt: -1 });

  if (!creditScore) {
    return res.status(404).json({
      message: "No credit score found for this user",
    });
  }

  res.json({
    success: true,
    creditScore,
  });
});

// Get complete user profile with all data
export const getUserProfile = TryCatch(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  const bankStatement = await BankStatement.findOne({ userId }).sort({
    createdAt: -1,
  });
  const financialSummary = await FinancialSummary.findOne({ userId }).sort({
    createdAt: -1,
  });
  const creditScore = await CreditScore.findOne({ userId }).sort({
    createdAt: -1,
  });

  res.json({
    success: true,
    profile: {
      user,
      bankStatement,
      financialSummary,
      creditScore,
    },
  });
});
