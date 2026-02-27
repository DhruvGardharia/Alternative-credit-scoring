/**
 * Income Controller
 * 
 * For platform integration team to add earnings
 * For other teams to fetch income data
 */

import { Income } from "../models/incomeModel.js";
import { FinancialSummary } from "../models/financialSummary.js";

/**
 * POST /api/income/add
 * Add income record (manual or platform sync)
 */
export const addIncome = async (req, res) => {
  try {
    const { userId, platform, amount, date, category, platformData, description } = req.body;

    if (!userId || !platform || !amount) {
      return res.status(400).json({
        success: false,
        error: "userId, platform, and amount are required"
      });
    }

    const income = await Income.create({
      userId,
      platform,
      amount,
      date: date || Date.now(),
      category: category || "other",
      platformData: platformData || {},
      description,
      status: "completed",
      source: req.body.source || "manual"
    });

    // Auto-update financial summary
    await FinancialSummary.updateSummary(userId);

    res.status(201).json({
      success: true,
      data: income
    });

  } catch (error) {
    console.error("Add income error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * POST /api/income/bulk
 * Bulk add income records (for platform sync)
 */
export const bulkAddIncome = async (req, res) => {
  try {
    const { userId, incomes } = req.body;

    if (!userId || !Array.isArray(incomes) || incomes.length === 0) {
      return res.status(400).json({
        success: false,
        error: "userId and incomes array are required"
      });
    }

    const incomeRecords = incomes.map(income => ({
      userId,
      platform: income.platform,
      amount: income.amount,
      date: income.date || Date.now(),
      category: income.category || "other",
      platformData: income.platformData || {},
      description: income.description,
      status: "completed",
      source: "api_sync"
    }));
// Auto-update financial summary
    await FinancialSummary.updateSummary(userId);

    
    const result = await Income.insertMany(incomeRecords);

    res.status(201).json({
      success: true,
      data: {
        count: result.length,
        records: result
      }
    });

  } catch (error) {
    console.error("Bulk add income error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET /api/income/:userId
 * Get all income for a user
 */
export const getIncome = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, platform } = req.query;

    const query = { userId, status: "completed" };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (platform) {
      query.platform = platform;
    }

    const incomes = await Income.find(query).sort({ date: -1 });

    const total = incomes.reduce((sum, inc) => sum + inc.amount, 0);

    res.status(200).json({
      success: true,
      data: {
        total,
        count: incomes.length,
        incomes
      }
    });

  } catch (error) {
    console.error("Get income error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET /api/income/summary/:userId
 * Get income summary by platform
 */
export const getIncomeSummary = async (req, res) => {
  try {
    const { userId } = req.params;

    const byPlatform = await Income.getIncomeByPlatform(userId);
    const total = await Income.getTotalIncome(userId);

    res.status(200).json({
      success: true,
      data: {
        total,
        byPlatform
      }
    });

  } catch (error) {
    console.error("Get income summary error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export default {
  addIncome,
  bulkAddIncome,
  getIncome,
  getIncomeSummary
};
