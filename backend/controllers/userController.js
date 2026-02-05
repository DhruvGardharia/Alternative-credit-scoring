import { User } from "../models/userModel.js";
import { BankStatement } from "../models/bankStatementModel.js";
import { FinancialSummary } from "../models/financialSummaryModel.js";
import { CreditScore } from "../models/creditScoreModel.js";
import TryCatch from "../utils/TryCatch.js";
import { parseCSVBankStatement, validateCSV } from "../services/csvParser.js";
import { calculateCreditScore } from "../services/creditScoring.js";
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

// Upload bank statement (CSV)
export const uploadBankStatement = TryCatch(async (req, res) => {
  const userId = req.user.id;

  if (!req.file) {
    return res.status(400).json({
      message: "No file uploaded",
    });
  }

  // Validate file
  try {
    validateCSV(req.file);
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  // Create bank statement record
  const bankStatement = await BankStatement.create({
    userId,
    fileName: req.file.originalname,
    fileUrl: req.file.path,
    status: "processing",
  });

  try {
    // Parse the CSV bank statement
    const financialMetrics = await parseCSVBankStatement(req.file.path);

    // Create financial summary
    const financialSummary = await FinancialSummary.create({
      userId,
      bankStatementId: bankStatement._id,
      ...financialMetrics,
    });

    // Calculate credit score
    const creditScoreData = calculateCreditScore(financialSummary);

    // Save credit score
    const creditScore = await CreditScore.create({
      userId,
      financialSummaryId: financialSummary._id,
      ...creditScoreData,
    });

    // Update bank statement status
    bankStatement.status = "processed";
    await bankStatement.save();

    res.status(201).json({
      success: true,
      message: "Bank statement uploaded and processed successfully",
      bankStatement,
      financialSummary,
      creditScore,
    });
  } catch (error) {
    // Update bank statement status to failed
    bankStatement.status = "failed";
    await bankStatement.save();

    return res.status(400).json({
      message: error.message,
    });
  }
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

  // Get latest financial summary
  const financialSummary = await FinancialSummary.findOne({ userId }).sort({
    createdAt: -1,
  });

  if (!financialSummary) {
    return res.status(404).json({
      message: "No financial summary found. Please upload a bank statement first.",
    });
  }

  // Calculate credit score
  const creditScoreData = calculateCreditScore(financialSummary);

  // Save credit score
  const creditScore = await CreditScore.create({
    userId,
    financialSummaryId: financialSummary._id,
    ...creditScoreData,
  });

  res.status(201).json({
    success: true,
    message: "Credit score generated successfully",
    creditScore,
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
