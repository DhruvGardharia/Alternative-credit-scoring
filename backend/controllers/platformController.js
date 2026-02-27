/**
 * Platform Controller
 * Handles platform connections and earnings sync
 */

import { User } from "../models/userModel.js";
import { syncPlatformEarnings } from "../services/platformIntegration/platformSync.js";
import { calculateCreditProfile } from "../services/creditEngine/index.js";
import { Income } from "../models/incomeModel.js";
import { Expense } from "../models/expenseModel.js";

/**
 * POST /api/platform/connect
 * Connect user to a gig platform and sync earnings
 */
export const connectPlatform = async (req, res) => {
  try {
    const { userId, platform, workType } = req.body;

    if (!userId || !platform) {
      return res.status(400).json({
        success: false,
        error: "userId and platform are required"
      });
    }

    const validPlatforms = [
      "uber", "ola", "rapido",
      "swiggy", "zomato", "zepto", "blinkit", "dunzo",
      "fiverr", "upwork", "freelancer", "urbanCompany", "meesho"
    ];

    if (!validPlatforms.includes(platform.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid platform. Supported: ${validPlatforms.join(", ")}`
      });
    }

    // Update user's connected platforms
    const updateKey = `connectedPlatforms.${platform.toLowerCase()}`;
    await User.findByIdAndUpdate(userId, {
      [updateKey]: {
        connected: true,
        workType: workType || "FULL_TIME",
        lastSync: new Date()
      }
    });

    // Sync platform earnings (generate mock data)
    const syncResult = await syncPlatformEarnings(
      userId,
      platform.toLowerCase(),
      workType || "FULL_TIME"
    );

    // Trigger credit profile recalculation
    const allIncomes = await Income.find({ userId, status: "completed" }).lean();
    const allExpenses = await Expense.find({ userId }).lean();
    
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

    let creditProfile = null;
    if (normalizedTransactions.length > 0) {
      creditProfile = await calculateCreditProfile({ 
        userId, 
        transactions: normalizedTransactions 
      });
    }

    res.status(200).json({
      success: true,
      message: `Successfully connected to ${platform}`,
      data: {
        platform,
        workType: workType || "FULL_TIME",
        ...syncResult,
        creditScore: creditProfile?.creditScore
      }
    });

  } catch (error) {
    console.error("Connect platform error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET /api/platform/connected/:userId
 * Get list of connected platforms for a user
 */
export const getConnectedPlatforms = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("connectedPlatforms").lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    const connected = [];
    for (const [platform, data] of Object.entries(user.connectedPlatforms || {})) {
      if (data.connected) {
        connected.push({
          platform,
          workType: data.workType,
          lastSync: data.lastSync
        });
      }
    }

    res.status(200).json({
      success: true,
      data: { connected }
    });

  } catch (error) {
    console.error("Get connected platforms error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export default {
  connectPlatform,
  getConnectedPlatforms
};
