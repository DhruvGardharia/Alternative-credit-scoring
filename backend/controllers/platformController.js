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

    console.log(`\n✅ [Platform Connect] ${platform.toUpperCase()}`);
    console.log(`   Transactions synced : ${syncResult.transactionCount}`);
    console.log(`   Total earnings      : ₹${syncResult.totalEarnings.toLocaleString("en-IN")}`);
    console.log(`   Today's activity    : ${syncResult.today ? `${syncResult.today.tripsOrDeliveries} trips · ₹${syncResult.today.earnings}` : 'off day'}`);
    console.log(`   Credit score        : ${creditProfile?.creditScore ?? 'not calculated'}\n`);

    res.status(200).json({
      success: true,
      message: `Successfully connected to ${platform}`,
      data: {
        platform,
        workType: workType || "FULL_TIME",
        transactionCount: syncResult.transactionCount,
        totalEarnings: syncResult.totalEarnings,
        today: syncResult.today,
        creditScore: creditProfile?.creditScore ?? null
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
 * Get connected platforms with aggregated earnings + today's activity
 */
export const getConnectedPlatforms = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("connectedPlatforms").lean();
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // All-time earnings per platform
    const earningsAgg = await Income.aggregate([
      { $match: { userId: user._id, status: "completed" } },
      { $group: {
          _id: "$platform",
          totalEarnings: { $sum: "$amount" },
          transactionCount: { $sum: 1 }
      }}
    ]);
    const earningsMap = {};
    for (const row of earningsAgg) {
      earningsMap[row._id] = {
        totalEarnings: Math.round(row.totalEarnings),
        transactionCount: row.transactionCount
      };
    }

    // Today's activity per platform
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const todayAgg = await Income.aggregate([
      { $match: {
          userId: user._id,
          status: "completed",
          date: { $gte: todayStart, $lte: todayEnd }
      }},
      { $group: {
          _id: "$platform",
          todayEarnings: { $sum: "$amount" },
          todayActivity: { $sum: "$tripsOrDeliveries" }
      }}
    ]);
    const todayMap = {};
    for (const row of todayAgg) {
      todayMap[row._id] = {
        todayEarnings: Math.round(row.todayEarnings),
        todayActivity: row.todayActivity
      };
    }

    const connected = [];
    for (const [platform, data] of Object.entries(user.connectedPlatforms || {})) {
      if (data.connected) {
        connected.push({
          platform,
          workType: data.workType,
          lastSync: data.lastSync,
          totalEarnings: earningsMap[platform]?.totalEarnings || 0,
          transactionCount: earningsMap[platform]?.transactionCount || 0,
          todayEarnings: todayMap[platform]?.todayEarnings || 0,
          todayActivity: todayMap[platform]?.todayActivity || 0,
        });
      }
    }

    res.status(200).json({ success: true, data: { connected } });

  } catch (error) {
    console.error("Get connected platforms error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/platform/disconnect
 * Disconnect user from a platform
 */
export const disconnectPlatform = async (req, res) => {
  try {
    const { userId, platform } = req.body;

    if (!userId || !platform) {
      return res.status(400).json({
        success: false,
        error: "userId and platform are required"
      });
    }

    // Update user's connected platforms
    const updateKey = `connectedPlatforms.${platform.toLowerCase()}`;
    await User.findByIdAndUpdate(userId, {
      [updateKey]: {
        connected: false,
        workType: null,
        lastSync: null
      }
    });

    res.status(200).json({
      success: true,
      message: `Disconnected from ${platform}`
    });

  } catch (error) {
    console.error("Disconnect platform error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export default {
  connectPlatform,
  getConnectedPlatforms,
  disconnectPlatform
};
