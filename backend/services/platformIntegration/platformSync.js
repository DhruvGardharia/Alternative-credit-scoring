/**
 * Platform Sync Service
 * Converts platform earnings to standardized Income transactions
 */

import { Income } from "../../models/incomeModel.js";
import { FinancialSummary } from "../../models/financialSummary.js";
import {
  generateUberData,
  generateOlaData,
  generateRapidoData,
  generateSwiggyData,
  generateZomatoData,
  generateQuickCommerceData,
  generateFreelanceData,
  generateServiceData
} from "./mockGenerator.js";

// Platform generator mapping
const platformGenerators = {
  uber: generateUberData,
  ola: generateOlaData,
  rapido: generateRapidoData,
  swiggy: generateSwiggyData,
  zomato: generateZomatoData,
  zepto: (workType) => generateQuickCommerceData("zepto", workType),
  blinkit: (workType) => generateQuickCommerceData("blinkit", workType),
  dunzo: (workType) => generateQuickCommerceData("dunzo", workType),
  fiverr: (workType) => generateFreelanceData("fiverr", workType),
  upwork: (workType) => generateFreelanceData("upwork", workType),
  freelancer: (workType) => generateFreelanceData("freelancer", workType),
  urbanCompany: (workType) => generateServiceData("urbanCompany", workType),
  meesho: (workType) => generateServiceData("meesho", workType)
};

/**
 * Sync platform earnings for a user
 */
export const syncPlatformEarnings = async (userId, platform, workType = "FULL_TIME") => {
  try {
    const generator = platformGenerators[platform.toLowerCase()];
    if (!generator) {
      throw new Error(`Platform ${platform} not supported`);
    }

    // Generate mock earnings data
    const earningsData = generator(workType);

    // Convert to Income transactions
    const incomeTransactions = [];

    for (const earning of earningsData) {
      // Create income record for net earnings
      const incomeRecord = {
        userId,
        platform: earning.platform,
        amount: earning.netEarnings,
        date: earning.date,
        category: "ride" in earning ? "ride" : "delivery" in earning ? "delivery" : "other",
        status: "completed",
        source: "api_sync",
        platformData: earning
      };

      incomeTransactions.push(incomeRecord);

      // If there's a platform fee, create debit transaction
      if (earning.platformFee > 0) {
        const feeRecord = {
          userId,
          platform: earning.platform,
          amount: earning.platformFee,
          date: earning.date,
          category: "other",
          status: "completed",
          source: "api_sync",
          description: "Platform Fee"
        };

        // Platform fee tracked as expense (optional: create Expense record)
      }
    }

    // Bulk insert income records
    if (incomeTransactions.length > 0) {
      await Income.insertMany(incomeTransactions);
    }

    // Trigger financial summary recalculation
    await FinancialSummary.updateSummary(userId);

    return {
      platform,
      transactionsCreated: incomeTransactions.length,
      totalEarnings: incomeTransactions.reduce((sum, t) => sum + t.amount, 0)
    };

  } catch (error) {
    console.error("Platform sync error:", error);
    throw error;
  }
};
