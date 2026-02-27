import { UserFinancialSummary } from "../models/financialSummary.js";
import { Income } from "../models/incomeModel.js";
import { Expense } from "../models/expenseModel.js";
import { calculateAnnualTaxSummary } from "../services/tax/taxCalculator.js";
import { generateTaxSummaryPdf } from "../services/tax/taxPdfGenerator.js";

const getUserIdFromRequest = (req = {}) => req.user?._id?.toString();

const fetchFinancialSummary = async (userId) => {
  if (!userId) return null;
  let summary = await UserFinancialSummary.findOne({ userId });
  if (!summary) {
    summary = await UserFinancialSummary.updateSummary(userId);
  }
  return summary;
};

const buildTaxSummaryInput = (financialSummary = {}) => ({
  totalIncome: financialSummary.totalIncome ?? 0,
  totalExpenses: financialSummary.totalExpenses ?? 0,
  categorizedExpenses: financialSummary.expensesByCategory ?? {},
});

const getTransactionCounts = async (userId) => {
  try {
    const [incomeCount, expenseCount] = await Promise.all([
      Income.countDocuments({ userId, status: "completed" }),
      Expense.countDocuments({ userId }),
    ]);
    return { incomeCount, expenseCount, total: incomeCount + expenseCount };
  } catch {
    return { incomeCount: 0, expenseCount: 0, total: 0 };
  }
};

const TAX_SLABS = [
  { label: "₹0 – ₹3 L", start: 0, end: 300000, rate: 0 },
  { label: "₹3 L – ₹6 L", start: 300000, end: 600000, rate: 0.05 },
  { label: "₹6 L – ₹9 L", start: 600000, end: 900000, rate: 0.1 },
  { label: "₹9 L – ₹12 L", start: 900000, end: 1200000, rate: 0.15 },
  { label: "₹12 L – ₹15 L", start: 1200000, end: 1500000, rate: 0.2 },
  { label: "Above ₹15 L", start: 1500000, end: Infinity, rate: 0.3 },
];

/**
 * Given an annualised income, compute the tax payable under the New Regime
 * and return the primary slab label, total tax, and effective rate.
 */
const computeAnnualProjection = (monthlyAvgIncome, dataStartDate, dataEndDate) => {
  // Determine how many months of data we have
  let statementMonths = 0;
  if (dataStartDate && dataEndDate) {
    const start = new Date(dataStartDate);
    const end = new Date(dataEndDate);
    const diffMs = end - start;
    statementMonths = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24 * 30.44)));
  } else {
    statementMonths = 1; // safe fallback
  }

  const avg = Number(monthlyAvgIncome) || 0;
  const annualProjectedIncome = Math.round(avg * 12);

  // Calculate tax on projected annual income (New Regime)
  let annualProjectedTax = 0;
  let primarySlab = "₹0 – ₹3 L (0%)";
  for (const slab of TAX_SLABS) {
    const taxable = Math.max(0, Math.min(slab.end === Infinity ? annualProjectedIncome : slab.end, annualProjectedIncome) - slab.start);
    const tax = taxable * slab.rate;
    annualProjectedTax += tax;
    if (taxable > 0 && slab.rate > 0) {
      primarySlab = `${slab.label} (${(slab.rate * 100).toFixed(0)}%)`;
    }
  }
  annualProjectedTax = Math.round(annualProjectedTax);
  const projectedEffectiveRate = annualProjectedIncome > 0
    ? parseFloat(((annualProjectedTax / annualProjectedIncome) * 100).toFixed(2))
    : 0;

  return {
    statementMonths,
    annualProjectedIncome,
    annualProjectedTax,
    projectedTaxSlab: primarySlab,
    projectedEffectiveRate,
  };
};

export const getAnnualTaxSummary = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const summaryDoc = await fetchFinancialSummary(userId);
    if (!summaryDoc) {
      return res.status(404).json({ success: false, error: "Financial summary not found" });
    }

    const summary = summaryDoc.toObject ? summaryDoc.toObject() : summaryDoc;
    const taxSummary = calculateAnnualTaxSummary(buildTaxSummaryInput(summary));
    const transactionCounts = await getTransactionCounts(userId);
    const projection = computeAnnualProjection(
      summary.monthlyAvgIncome,
      summary.dataStartDate,
      summary.dataEndDate,
    );

    return res.status(200).json({
      success: true,
      data: {
        taxSummary,
        financialSummary: {
          ...summary,
          totalTransactions: transactionCounts.total,
          creditTransactions: transactionCounts.incomeCount,
          debitTransactions: transactionCounts.expenseCount,
          ...projection,
        },
      },
    });
  } catch (error) {
    console.error("Get annual tax summary error:", error);
    return res.status(500).json({ success: false, error: "Failed to compute tax summary" });
  }
};

export const downloadTaxSummaryPdf = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const summaryDoc = await fetchFinancialSummary(userId);
    if (!summaryDoc) {
      return res.status(404).json({ success: false, error: "Financial summary not found" });
    }

    const summary = summaryDoc.toObject ? summaryDoc.toObject() : summaryDoc;
    const taxSummary = calculateAnnualTaxSummary(buildTaxSummaryInput(summary));
    const transactionCounts = await getTransactionCounts(userId);
    const projection = computeAnnualProjection(
      summary.monthlyAvgIncome,
      summary.dataStartDate,
      summary.dataEndDate,
    );

    const enrichedSummary = {
      ...summary,
      totalTransactions: transactionCounts.total,
      creditTransactions: transactionCounts.incomeCount,
      debitTransactions: transactionCounts.expenseCount,
      ...projection,
    };

    const pdfStream = generateTaxSummaryPdf(taxSummary, enrichedSummary, req.user);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=annual-tax-summary.pdf");

    pdfStream.on("error", (streamErr) => {
      console.error("Tax summary PDF stream error:", streamErr);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: "Failed to generate PDF" });
      } else {
        res.end();
      }
    });

    pdfStream.pipe(res);
  } catch (error) {
    console.error("Download tax summary PDF error:", error);
    return res.status(500).json({ success: false, error: "Failed to download tax summary PDF" });
  }
};

export default { getAnnualTaxSummary, downloadTaxSummaryPdf };
