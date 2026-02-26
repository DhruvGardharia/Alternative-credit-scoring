/**
 * Credit Engine Example Usage
 * 
 * This file demonstrates how to use the credit scoring engine
 * with sample transaction data
 */

import { calculateCreditProfile, getRiskAnalysis } from "./index.js";

// ============================================
// EXAMPLE 1: High-Performing Gig Worker
// ============================================

const highPerformerTransactions = [
  // Month 1 - January 2026
  { date: "2026-01-02", type: "credit", amount: 12000, category: "uber", source: "platform" },
  { date: "2026-01-05", type: "credit", amount: 8500, category: "zomato", source: "platform" },
  { date: "2026-01-08", type: "credit", amount: 9200, category: "swiggy", source: "platform" },
  { date: "2026-01-12", type: "credit", amount: 11000, category: "uber", source: "platform" },
  { date: "2026-01-15", type: "credit", amount: 7800, category: "zomato", source: "platform" },
  { date: "2026-01-20", type: "credit", amount: 10500, category: "uber", source: "platform" },
  { date: "2026-01-25", type: "credit", amount: 8900, category: "swiggy", source: "platform" },

  { date: "2026-01-03", type: "debit", amount: 8000, category: "rent", source: "manual" },
  { date: "2026-01-10", type: "debit", amount: 3000, category: "food", source: "manual" },
  { date: "2026-01-15", type: "debit", amount: 2000, category: "transport", source: "manual" },
  { date: "2026-01-20", type: "debit", amount: 1500, category: "utilities", source: "manual" },

  // Month 2 - February 2026
  { date: "2026-02-02", type: "credit", amount: 13500, category: "uber", source: "platform" },
  { date: "2026-02-05", type: "credit", amount: 9000, category: "zomato", source: "platform" },
  { date: "2026-02-08", type: "credit", amount: 10200, category: "swiggy", source: "platform" },
  { date: "2026-02-12", type: "credit", amount: 12000, category: "uber", source: "platform" },
  { date: "2026-02-15", type: "credit", amount: 8500, category: "zomato", source: "platform" },
  { date: "2026-02-20", type: "credit", amount: 11500, category: "uber", source: "platform" },
  { date: "2026-02-25", type: "credit", amount: 9500, category: "swiggy", source: "platform" },

  { date: "2026-02-03", type: "debit", amount: 8000, category: "rent", source: "manual" },
  { date: "2026-02-10", type: "debit", amount: 3200, category: "food", source: "manual" },
  { date: "2026-02-15", type: "debit", amount: 2100, category: "transport", source: "manual" },
  { date: "2026-02-20", type: "debit", amount: 1600, category: "utilities", source: "manual" }
];

// ============================================
// EXAMPLE 2: Struggling Gig Worker
// ============================================

const strugglingWorkerTransactions = [
  // Month 1 - Irregular income, high expenses
  { date: "2026-01-05", type: "credit", amount: 3000, category: "uber", source: "platform" },
  { date: "2026-01-18", type: "credit", amount: 2500, category: "swiggy", source: "platform" },

  { date: "2026-01-03", type: "debit", amount: 8000, category: "rent", source: "manual" },
  { date: "2026-01-10", type: "debit", amount: 4000, category: "food", source: "manual" },
  { date: "2026-01-15", type: "debit", amount: 3000, category: "transport", source: "manual" },
  { date: "2026-01-20", type: "debit", amount: 2000, category: "utilities", source: "manual" },
  { date: "2026-01-25", type: "debit", amount: 5000, category: "healthcare", source: "manual" },

  // Month 2
  { date: "2026-02-08", type: "credit", amount: 4000, category: "uber", source: "platform" },
  { date: "2026-02-22", type: "credit", amount: 3500, category: "zomato", source: "platform" },

  { date: "2026-02-03", type: "debit", amount: 8000, category: "rent", source: "manual" },
  { date: "2026-02-10", type: "debit", amount: 4500, category: "food", source: "manual" },
  { date: "2026-02-15", type: "debit", amount: 3500, category: "transport", source: "manual" }
];

// ============================================
// EXAMPLE 3: Moderate Performer
// ============================================

const moderatePerformerTransactions = [
  // Month 1
  { date: "2026-01-02", type: "credit", amount: 6000, category: "uber", source: "platform" },
  { date: "2026-01-08", type: "credit", amount: 5500, category: "swiggy", source: "platform" },
  { date: "2026-01-15", type: "credit", amount: 7000, category: "uber", source: "platform" },
  { date: "2026-01-22", type: "credit", amount: 6500, category: "zomato", source: "platform" },

  { date: "2026-01-05", type: "debit", amount: 8000, category: "rent", source: "manual" },
  { date: "2026-01-10", type: "debit", amount: 3500, category: "food", source: "manual" },
  { date: "2026-01-15", type: "debit", amount: 2500, category: "transport", source: "manual" },
  { date: "2026-01-20", type: "debit", amount: 1800, category: "utilities", source: "manual" },

  // Month 2
  { date: "2026-02-03", type: "credit", amount: 6200, category: "uber", source: "platform" },
  { date: "2026-02-09", type: "credit", amount: 5800, category: "swiggy", source: "platform" },
  { date: "2026-02-16", type: "credit", amount: 7200, category: "uber", source: "platform" },
  { date: "2026-02-23", type: "credit", amount: 6800, category: "zomato", source: "platform" },

  { date: "2026-02-05", type: "debit", amount: 8000, category: "rent", source: "manual" },
  { date: "2026-02-12", type: "debit", amount: 3600, category: "food", source: "manual" },
  { date: "2026-02-18", type: "debit", amount: 2600, category: "transport", source: "manual" },
  { date: "2026-02-22", type: "debit", amount: 1900, category: "utilities", source: "manual" }
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function printCreditProfile(profile, label) {
  console.log("\n" + "=".repeat(60));
  console.log(`  ${label}`);
  console.log("=".repeat(60));
  
  console.log(`\n📊 CREDIT SCORE: ${profile.creditScore}`);
  console.log(`🎯 RISK LEVEL: ${profile.riskLevel}`);
  
  console.log("\n📈 SCORE BREAKDOWN:");
  console.log(`  - Income Quality: ${profile.scoreBreakdown.incomeQualityScore}/100`);
  console.log(`  - Spending Behavior: ${profile.scoreBreakdown.spendingBehaviorScore}/100`);
  console.log(`  - Liquidity: ${profile.scoreBreakdown.liquidityScore}/100`);
  console.log(`  - Gig Stability: ${profile.scoreBreakdown.gigStabilityScore}/100`);
  
  console.log("\n💰 KEY METRICS:");
  console.log(`  - Avg Monthly Income: ₹${profile.metrics.avgMonthlyIncome.value} (${profile.metrics.avgMonthlyIncome.status})`);
  console.log(`  - Income Volatility: ${profile.metrics.incomeVolatility.value} (${profile.metrics.incomeVolatility.status})`);
  console.log(`  - Net Cash Flow: ${(profile.metrics.netCashFlowRatio.value * 100).toFixed(1)}% (${profile.metrics.netCashFlowRatio.status})`);
  console.log(`  - Avg Daily Balance: ₹${profile.metrics.avgDailyBalance.value} (${profile.metrics.avgDailyBalance.status})`);
  console.log(`  - Active Work Days: ${profile.metrics.activeWorkDays.value} days/month (${profile.metrics.activeWorkDays.status})`);
}

function printRiskAnalysis(riskAnalysis, label) {
  console.log("\n" + "=".repeat(60));
  console.log(`  ${label} - RISK ANALYSIS`);
  console.log("=".repeat(60));
  
  console.log(`\n🎯 Risk Level: ${riskAnalysis.riskLevel}`);
  console.log(`💳 Eligible Loan: ₹${riskAnalysis.eligibleLoanAmount}`);
  console.log(`📈 Interest Rate: ${riskAnalysis.interestRate}% per annum`);
  console.log(`📅 Loan Term: ${riskAnalysis.loanTerm} months`);
  console.log(`💼 Wallet Limit: ₹${riskAnalysis.walletLimit}`);
  console.log(`🛡️  Insurance Multiplier: ${riskAnalysis.insurancePremiumMultiplier}x`);
  
  if (riskAnalysis.strengths.length > 0) {
    console.log("\n✅ STRENGTHS:");
    riskAnalysis.strengths.forEach(s => console.log(`  • ${s}`));
  }
  
  if (riskAnalysis.weaknesses.length > 0) {
    console.log("\n⚠️  WEAKNESSES:");
    riskAnalysis.weaknesses.forEach(w => console.log(`  • ${w}`));
  }
  
  if (riskAnalysis.recommendedActions.length > 0) {
    console.log("\n💡 RECOMMENDED ACTIONS:");
    riskAnalysis.recommendedActions.forEach(a => console.log(`  • ${a}`));
  }
}

// ============================================
// RUN EXAMPLES
// ============================================

async function runExamples() {
  try {
    // Example 1: High Performer
    console.log("\n\n🚀 CALCULATING CREDIT PROFILE FOR HIGH PERFORMER...\n");
    const highProfile = await calculateCreditProfile({
      userId: "user_high_performer",
      transactions: highPerformerTransactions,
      gigData: { platformRating: 4.8 }
    });
    printCreditProfile(highProfile, "HIGH PERFORMER");
    
    const highRiskAnalysis = getRiskAnalysis(
      highProfile.creditScore,
      highProfile.scoreBreakdown,
      highProfile.metrics
    );
    printRiskAnalysis(highRiskAnalysis, "HIGH PERFORMER");

    // Example 2: Struggling Worker
    console.log("\n\n😰 CALCULATING CREDIT PROFILE FOR STRUGGLING WORKER...\n");
    const lowProfile = await calculateCreditProfile({
      userId: "user_struggling",
      transactions: strugglingWorkerTransactions,
      gigData: { platformRating: 3.2 }
    });
    printCreditProfile(lowProfile, "STRUGGLING WORKER");
    
    const lowRiskAnalysis = getRiskAnalysis(
      lowProfile.creditScore,
      lowProfile.scoreBreakdown,
      lowProfile.metrics
    );
    printRiskAnalysis(lowRiskAnalysis, "STRUGGLING WORKER");

    // Example 3: Moderate Performer
    console.log("\n\n📊 CALCULATING CREDIT PROFILE FOR MODERATE PERFORMER...\n");
    const moderateProfile = await calculateCreditProfile({
      userId: "user_moderate",
      transactions: moderatePerformerTransactions,
      gigData: { platformRating: 4.3 }
    });
    printCreditProfile(moderateProfile, "MODERATE PERFORMER");
    
    const moderateRiskAnalysis = getRiskAnalysis(
      moderateProfile.creditScore,
      moderateProfile.scoreBreakdown,
      moderateProfile.metrics
    );
    printRiskAnalysis(moderateRiskAnalysis, "MODERATE PERFORMER");

    console.log("\n\n" + "=".repeat(60));
    console.log("  ✅ ALL EXAMPLES COMPLETED SUCCESSFULLY");
    console.log("=".repeat(60) + "\n\n");

  } catch (error) {
    console.error("❌ Error running examples:", error);
  }
}

// Run examples if this file is executed directly
// Uncomment the line below to run:
// runExamples();

export {
  highPerformerTransactions,
  strugglingWorkerTransactions,
  moderatePerformerTransactions,
  runExamples
};
