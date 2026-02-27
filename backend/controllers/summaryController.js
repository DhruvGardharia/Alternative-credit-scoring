/**
 * Financial Summary Controller
 * 
 * Get aggregated financial data - used by ALL teams
 */

import { FinancialSummary } from "../models/financialSummary.js";

/**
 * GET /api/summary/:userId
 * Get financial summary for a user
 */
export const getFinancialSummary = async (req, res) => {
  try {
    const { userId } = req.params;

    let summary = await FinancialSummary.findOne({ userId });

    // If no summary exists, create one
    if (!summary) {
      summary = await FinancialSummary.updateSummary(userId);
    }

    if (!summary) {
      return res.status(404).json({
        success: false,
        error: "No financial data found for this user"
      });
    }

    res.status(200).json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error("Get financial summary error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * POST /api/summary/refresh/:userId
 * Manually refresh financial summary
 */
export const refreshFinancialSummary = async (req, res) => {
  try {
    const { userId } = req.params;

    const summary = await FinancialSummary.updateSummary(userId);

    if (!summary) {
      return res.status(404).json({
        success: false,
        error: "No financial data found for this user"
      });
    }

    res.status(200).json({
      success: true,
      message: "Financial summary refreshed successfully",
      data: summary
    });

  } catch (error) {
    console.error("Refresh financial summary error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export default {
  getFinancialSummary,
  refreshFinancialSummary
};
