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
  uber:         generateUberData,
  ola:          generateOlaData,
  rapido:       generateRapidoData,
  swiggy:       generateSwiggyData,
  zomato:       generateZomatoData,
  zepto:        (wt) => generateQuickCommerceData("zepto", wt),
  blinkit:      (wt) => generateQuickCommerceData("blinkit", wt),
  dunzo:        (wt) => generateQuickCommerceData("dunzo", wt),
  fiverr:       (wt) => generateFreelanceData("fiverr", wt),
  upwork:       (wt) => generateFreelanceData("upwork", wt),
  freelancer:   (wt) => generateFreelanceData("freelancer", wt),
  urbanCompany: (wt) => generateServiceData("urbanCompany", wt),
  meesho:       (wt) => generateServiceData("meesho", wt)
};

/** Extract trips/deliveries/jobs count from a mock earning entry */
function getActivityCount(earning) {
  return (
    earning.tripsCompleted       ||
    earning.deliveriesCompleted  ||
    earning.jobsCompleted        ||
    earning.projectsCompleted    ||
    0
  );
}

/** Determine income category from earning shape */
function getCategory(earning) {
  if ("tripsCompleted" in earning)      return "ride";
  if ("deliveriesCompleted" in earning) return "delivery";
  return "other";
}

/**
 * Sync platform earnings for a user.
 * Clears previous api_sync records for this platform before inserting fresh data.
 */
export const syncPlatformEarnings = async (userId, platform, workType = "FULL_TIME") => {
  try {
    const generator = platformGenerators[platform.toLowerCase()];
    if (!generator) throw new Error(`Platform ${platform} not supported`);

    // ── 1. Generate mock data ─────────────────────────────────────────────────
    const earningsData = generator(workType);

    // ── 2. Remove stale api_sync records for this platform (prevent duplicates)
    const deleted = await Income.deleteMany({ userId, platform: platform.toLowerCase(), source: "api_sync" });
    console.log(`\n🔄 [PlatformSync] ${platform.toUpperCase()} — cleared ${deleted.deletedCount} old records`);

    // ── 3. Map to Income documents ────────────────────────────────────────────
    const todayStr = new Date().toISOString().slice(0, 10);
    let todayEntry = null;

    const incomeTransactions = earningsData.map((earning) => {
      const dateStr = new Date(earning.date).toISOString().slice(0, 10);
      const activityCount = getActivityCount(earning);
      const doc = {
        userId,
        platform: earning.platform,
        amount: earning.netEarnings,
        date: earning.date,
        category: getCategory(earning),
        status: "completed",
        source: "api_sync",
        platformData: earning,          // full mock object — stored as Mixed
        tripsOrDeliveries: activityCount,
        baseFare: earning.baseFare || 0,
        platformFee: earning.platformFee || 0,
        incentives: earning.incentives || earning.peakHourBonus || 0,
      };
      if (dateStr === todayStr) todayEntry = doc;
      return doc;
    });

    // ── 4. Console summary table ──────────────────────────────────────────────
    const totalEarnings = incomeTransactions.reduce((s, t) => s + t.amount, 0);
    const totalActivity = incomeTransactions.reduce((s, t) => s + t.tripsOrDeliveries, 0);

    console.log(`\n📊 [PlatformSync] Mock data generated for: ${platform.toUpperCase()}`);
    console.log(`   Work type    : ${workType}`);
    console.log(`   Days covered : ${earningsData.length}`);
    console.log(`   Total activity : ${totalActivity} trips/deliveries`);
    console.log(`   Total earnings : ₹${Math.round(totalEarnings).toLocaleString("en-IN")}`);

    if (todayEntry) {
      console.log(`\n   📅 TODAY's activity:`);
      console.log(`      Activity count : ${todayEntry.tripsOrDeliveries}`);
      console.log(`      Net earnings   : ₹${Math.round(todayEntry.amount)}`);
      console.log(`      Base fare      : ₹${Math.round(todayEntry.baseFare)}`);
      console.log(`      Platform fee   : ₹${Math.round(todayEntry.platformFee)}`);
      console.log(`      Incentives     : ₹${Math.round(todayEntry.incentives)}`);
    } else {
      console.log(`\n   📅 TODAY: no activity generated (off day)`);
    }

    // Sample of first 3 records
    console.log(`\n   First 3 records:`);
    incomeTransactions.slice(0, 3).forEach((t, i) => {
      console.log(`   [${i + 1}] ${new Date(t.date).toDateString()} | ${t.tripsOrDeliveries} trips | ₹${Math.round(t.amount)}`);
    });
    console.log(`   ... and ${incomeTransactions.length - 3} more\n`);

    // ── 5. Bulk insert ────────────────────────────────────────────────────────
    if (incomeTransactions.length > 0) {
      await Income.insertMany(incomeTransactions);
    }

    // ── 6. Refresh financial summary ──────────────────────────────────────────
    await FinancialSummary.updateSummary(userId);

    return {
      platform,
      transactionCount: incomeTransactions.length,
      totalEarnings: Math.round(totalEarnings),
      today: todayEntry
        ? {
            tripsOrDeliveries: todayEntry.tripsOrDeliveries,
            earnings: Math.round(todayEntry.amount),
            baseFare: Math.round(todayEntry.baseFare),
            platformFee: Math.round(todayEntry.platformFee),
            incentives: Math.round(todayEntry.incentives),
          }
        : null,
    };

  } catch (error) {
    console.error("Platform sync error:", error);
    throw error;
  }
};

