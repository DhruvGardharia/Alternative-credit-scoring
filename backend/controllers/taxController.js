import { UserFinancialSummary } from "../models/financialSummary.js";
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

export const getAnnualTaxSummary = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const summaryDoc = await fetchFinancialSummary(userId);

    if (!summaryDoc) {
      return res.status(404).json({
        success: false,
        error: "Financial summary not found",
      });
    }

    const summary = summaryDoc.toObject ? summaryDoc.toObject() : summaryDoc;
    const taxSummary = calculateAnnualTaxSummary(buildTaxSummaryInput(summary));

    return res.status(200).json({
      success: true,
      data: {
        taxSummary,
        financialSummary: summary,
      },
    });
  } catch (error) {
    console.error("Get annual tax summary error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to compute tax summary",
    });
  }
};

export const downloadTaxSummaryPdf = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const summaryDoc = await fetchFinancialSummary(userId);

    if (!summaryDoc) {
      return res.status(404).json({
        success: false,
        error: "Financial summary not found",
      });
    }

    const summary = summaryDoc.toObject ? summaryDoc.toObject() : summaryDoc;
    const taxSummary = calculateAnnualTaxSummary(buildTaxSummaryInput(summary));

    const pdfStream = generateTaxSummaryPdf(taxSummary, summary, req.user);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=annual-tax-summary.pdf",
    );

    pdfStream.on("error", (streamErr) => {
      console.error("Tax summary PDF stream error:", streamErr);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: "Failed to generate tax summary PDF",
        });
      } else {
        res.end();
      }
    });

    pdfStream.pipe(res);
  } catch (error) {
    console.error("Download tax summary PDF error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to download tax summary PDF",
    });
  }
};

export default {
  getAnnualTaxSummary,
  downloadTaxSummaryPdf,
};
