/**
 * Credit Controller
 * 
 * Handles credit scoring requests
 * Fetches data from multiple sources and converts to standardized format
 */

import {
  calculateCreditProfile,
  getCreditProfile,
  recalculateCreditProfile,
  getRiskAnalysis
} from "../services/creditEngine/index.js";
import { Expense } from "../models/expenseModel.js";
import { Income } from "../models/incomeModel.js";
import { BankStatement } from "../models/bankStatementModel.js";

/**
 * Helper: Convert expenses to standardized transaction format
 */
async function getExpenseTransactions(userId) {
  const expenses = await Expense.find({ userId }).lean();
  
  return expenses.map((expense) => ({
    date: expense.date,
    type: "debit",
    amount: expense.amount,
    category: expense.category,
    source: "manual",
    description: expense.description
  }));
}

/**
 * Helper: Get bank statement transactions
 * This is a placeholder - actual implementation depends on how bank data is parsed
 */
async function getBankTransactions(userId) {
  // TODO: Implement bank statement transaction extraction
  // For now, return empty array
  // In production, this would parse the CSV files and extract transactions
  return [];
}

/**
 * Helper: Get platform earnings (gig income)
 * Fetches from Income model (populated by platform integration team)
 */
async function getPlatformEarnings(userId) {
  const earnings = await Income.find({ 
    userId, 
    status: "completed" 
  }).lean();
  
  return earnings.map((earning) => ({
    date: earning.date,
    type: "credit",
    amount: earning.amount,
    category: earning.platform,
    source: "platform",
    description: earning.description
  }));
}

/**
 * Helper: Aggregate all transactions from different sources
 */
async function aggregateTransactions(userId) {
  const [expenses, bankTransactions, platformEarnings] = await Promise.all([
    getExpenseTransactions(userId),
    getBankTransactions(userId),
    getPlatformEarnings(userId)
  ]);

  // Combine all transactions
  const allTransactions = [
    ...expenses,
    ...bankTransactions,
    ...platformEarnings
  ];

  // Sort by date
  allTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));

  return allTransactions;
}

/**
 * POST /api/credit/calculate
 * Calculate or recalculate credit score for a user
 */
export const calculateCredit = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required"
      });
    }

    // Aggregate transactions from all sources
    const transactions = await aggregateTransactions(userId);

    if (transactions.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No transaction data found for this user"
      });
    }

    // Calculate credit profile
    const creditProfile = await calculateCreditProfile({
      userId,
      transactions,
      gigData: {} // TODO: Add gig-specific data when available
    });

    // Get risk analysis
    const riskAnalysis = getRiskAnalysis(
      creditProfile.creditScore,
      creditProfile.scoreBreakdown,
      creditProfile.metrics
    );

    res.status(200).json({
      success: true,
      data: {
        ...creditProfile,
        riskAnalysis
      }
    });

  } catch (error) {
    console.error("Credit calculation error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to calculate credit score"
    });
  }
};

/**
 * POST /api/credit/calculate-manual
 * Calculate credit from manually provided transactions
 * Useful for testing or external integrations
 */
export const calculateCreditManual = async (req, res) => {
  try {
    const { userId, transactions, gigData } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required"
      });
    }

    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({
        success: false,
        error: "transactions array is required"
      });
    }

    // Calculate credit profile
    const creditProfile = await calculateCreditProfile({
      userId,
      transactions,
      gigData: gigData || {}
    });

    // Get risk analysis
    const riskAnalysis = getRiskAnalysis(
      creditProfile.creditScore,
      creditProfile.scoreBreakdown,
      creditProfile.metrics
    );

    res.status(200).json({
      success: true,
      data: {
        ...creditProfile,
        riskAnalysis
      }
    });

  } catch (error) {
    console.error("Manual credit calculation error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to calculate credit score"
    });
  }
};

/**
 * GET /api/credit/:userId
 * Get existing credit profile for a user
 */
export const getCreditScore = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required"
      });
    }

    const creditProfile = await getCreditProfile(userId);

    if (!creditProfile) {
      return res.status(404).json({
        success: false,
        error: "Credit profile not found. Please calculate credit score first."
      });
    }

    // Get risk analysis
    const riskAnalysis = getRiskAnalysis(
      creditProfile.creditScore,
      creditProfile.scoreBreakdown,
      creditProfile.metrics
    );

    res.status(200).json({
      success: true,
      data: {
        ...creditProfile,
        riskAnalysis
      }
    });

  } catch (error) {
    console.error("Get credit score error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to retrieve credit score"
    });
  }
};

/**
 * GET /api/credit/metrics/:userId
 * Get detailed metrics breakdown for a user
 */
export const getCreditMetrics = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required"
      });
    }

    const creditProfile = await getCreditProfile(userId);

    if (!creditProfile) {
      return res.status(404).json({
        success: false,
        error: "Credit profile not found"
      });
    }

    res.status(200).json({
      success: true,
      data: {
        metrics: creditProfile.metrics,
        scoreBreakdown: creditProfile.scoreBreakdown,
        creditScore: creditProfile.creditScore,
        riskLevel: creditProfile.riskLevel
      }
    });

  } catch (error) {
    console.error("Get credit metrics error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to retrieve credit metrics"
    });
  }
};

/**
 * POST /api/credit/refresh/:userId
 * Refresh credit score by recalculating from latest data
 */
export const refreshCreditScore = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required"
      });
    }

    // Aggregate latest transactions
    const transactions = await aggregateTransactions(userId);

    if (transactions.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No transaction data found for this user"
      });
    }

    // Recalculate credit profile
    const creditProfile = await recalculateCreditProfile(
      userId,
      transactions,
      {} // TODO: Add gig data
    );

    // Get risk analysis
    const riskAnalysis = getRiskAnalysis(
      creditProfile.creditScore,
      creditProfile.scoreBreakdown,
      creditProfile.metrics
    );

    res.status(200).json({
      success: true,
      message: "Credit score refreshed successfully",
      data: {
        ...creditProfile,
        riskAnalysis
      }
    });

  } catch (error) {
    console.error("Refresh credit score error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to refresh credit score"
    });
  }
};

export default {
  calculateCredit,
  calculateCreditManual,
  getCreditScore,
  getCreditMetrics,
  refreshCreditScore
};
