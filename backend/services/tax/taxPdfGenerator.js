import PDFDocument from "pdfkit";
import { PassThrough } from "stream";

// ── Formatters ────────────────────────────────────────────────────────────────
const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const formatCurrency = (v) => currencyFormatter.format(Number.isFinite(Number(v)) ? Number(v) : 0);
const formatDate = (date) =>
  (date ? new Date(date) : new Date()).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
const capitalize = (str = "") =>
  str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// ── Constants ─────────────────────────────────────────────────────────────────
const LEFT_MARGIN = 50;
const RIGHT_MARGIN = 545; // A4 width 595 − 50
const PAGE_BOTTOM = 780;  // A4 height 842 − 62 (bottom margin)
const LINE_H = 18;        // standard line height
const HEADER_H = 28;      // header row height (taller so first data row doesn't overlap)

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Move doc cursor down by `lines` LINE_H units and return new Y */
function gap(doc, lines = 1) {
  doc.y += lines * LINE_H;
  return doc.y;
}

/** Guard: add a new page if remaining space < needed */
function ensureSpace(doc, needed = 60) {
  if (doc.y + needed > PAGE_BOTTOM) {
    doc.addPage();
    doc.y = 50;
  }
}

/** Render a section heading */
function sectionTitle(doc, title) {
  ensureSpace(doc, 60);
  gap(doc, 0.8);
  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor("#1a1a2e")
    .text(title, LEFT_MARGIN, doc.y, { underline: true, width: RIGHT_MARGIN - LEFT_MARGIN });
  doc.y += LINE_H;
  doc.font("Helvetica").fontSize(10.5).fillColor("#222");
}

/**
 * Render one key-value row using FLOW text (safe — no alignment tricks).
 * Bold key, then normal value on the **same line** via `continued: true`.
 */
function kv(doc, key, value) {
  ensureSpace(doc, LINE_H + 4);
  doc
    .font("Helvetica-Bold")
    .text(`${key}: `, LEFT_MARGIN, doc.y, { continued: true, width: RIGHT_MARGIN - LEFT_MARGIN })
    .font("Helvetica")
    .text(String(value));
  doc.y += 3;
}

/**
 * Draw a table using PURELY ABSOLUTE coordinates.
 * `cols` = array of { header, width, align } objects.
 * `rows` = array of arrays matching cols length.
 */
function drawTable(doc, cols, rows) {
  ensureSpace(doc, 40);

  const startY = doc.y;
  const totalW = cols.reduce((s, c) => s + c.width, 0);
  let colX = LEFT_MARGIN;
  const xPositions = cols.map((c) => {
    const x = colX;
    colX += c.width;
    return x;
  });

  // Header background
  doc.rect(LEFT_MARGIN, startY - 2, totalW, HEADER_H).fill("#1a1a2e");

  // Header text (vertically centered in header)
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10);
  cols.forEach((col, i) => {
    doc.text(col.header, xPositions[i] + 4, startY + 7, {
      width: col.width - 8,
      align: col.align || "left",
      lineBreak: false,
    });
  });

  // Rows — start below the full header height
  doc.font("Helvetica").fontSize(10).fillColor("#222");
  let rowY = startY + HEADER_H + 4;

  rows.forEach((row, ri) => {
    ensureSpace(doc, LINE_H + 4);
    if (doc.y !== rowY) rowY = doc.y; // page break happened

    // Alternating row background
    if (ri % 2 === 1) {
      doc.rect(LEFT_MARGIN, rowY - 1, totalW, LINE_H + 2).fill("#f0f4f8");
    }

    doc.fillColor("#222");
    cols.forEach((col, i) => {
      doc.text(String(row[i] ?? ""), xPositions[i] + 4, rowY + 3, {
        width: col.width - 8,
        align: col.align || "left",
        lineBreak: false,
      });
    });

    rowY += LINE_H + 6;
  });

  // Bottom border
  doc.moveTo(LEFT_MARGIN, rowY).lineTo(LEFT_MARGIN + totalW, rowY).lineWidth(0.5).stroke("#aaa");

  doc.y = rowY + 6;
}

// ── Main export ───────────────────────────────────────────────────────────────
export function generateTaxSummaryPdf(taxSummary = {}, financialSummary = {}, user = {}) {
  const doc = new PDFDocument({ size: "A4", margin: 50, autoFirstPage: true });
  const stream = new PassThrough();
  doc.pipe(stream);

  // Destructure tax fields
  const {
    grossIncome = 0,
    deductibleBusinessExpenses = 0,
    netTaxableIncome = 0,
    slabBreakdown = [],
    totalTax = 0,
    effectiveTaxRate = 0,
  } = taxSummary;

  // Destructure financial summary
  const {
    totalExpenses = 0,
    netBalance = 0,
    savingsRate = 0,
    monthlyAvgIncome = 0,
    monthlyAvgExpenses = 0,
    dataStartDate,
    dataEndDate,
    totalTransactions = 0,
    creditTransactions = 0,
    debitTransactions = 0,
    incomeByPlatform = {},
    expensesByCategory = {},
    // Annual projection fields
    annualProjectedIncome = 0,
    annualProjectedTax = 0,
    projectedTaxSlab = "",
    projectedEffectiveRate = 0,
    statementMonths = 0,
  } = financialSummary;

  // ── PAGE HEADER ─────────────────────────────────────────────────────────────
  doc
    .rect(0, 0, 595, 70)
    .fill("#1a1a2e");

  doc
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .fontSize(18)
    .text("Annual Financial & Tax Summary Report", LEFT_MARGIN, 18, {
      width: RIGHT_MARGIN - LEFT_MARGIN,
      align: "center",
    });

  doc.y = 90;
  doc.font("Helvetica").fontSize(10.5).fillColor("#222");

  // ── USER INFORMATION ────────────────────────────────────────────────────────
  sectionTitle(doc, "User Information");
  kv(doc, "Name", user?.name || "Not Provided");
  kv(doc, "Generated On", formatDate(new Date()));

  // ── STATEMENT PERIOD ────────────────────────────────────────────────────────
  if (dataStartDate || dataEndDate) {
    sectionTitle(doc, "Bank Statement Coverage");
    kv(doc, "Period", `${formatDate(dataStartDate)} – ${formatDate(dataEndDate)}`);
    kv(doc, "Duration", `${statementMonths > 0 ? statementMonths : "—"} month(s)`);
    kv(
      doc,
      "Total Transactions",
      `${totalTransactions} (${creditTransactions} credits, ${debitTransactions} debits)`,
    );
  }

  // ── INCOME SUMMARY ──────────────────────────────────────────────────────────
  sectionTitle(doc, "Income Summary (Actual)");
  kv(doc, "Gross Income (Total Credits)", formatCurrency(grossIncome));
  kv(doc, "Monthly Average Income", formatCurrency(monthlyAvgIncome));
  kv(doc, "Deductible Business Expenses", formatCurrency(deductibleBusinessExpenses));
  kv(doc, "Net Taxable Income", formatCurrency(netTaxableIncome));

  // Income by Source table
  const incomeRows = Object.entries(incomeByPlatform)
    .filter(([, amt]) => Number(amt) > 0)
    .sort(([, a], [, b]) => Number(b) - Number(a))
    .map(([platform, amt]) => [
      capitalize(platform),
      formatCurrency(amt),
      grossIncome > 0 ? `${((Number(amt) / grossIncome) * 100).toFixed(1)}%` : "0.0%",
    ]);

  if (incomeRows.length > 0) {
    gap(doc, 0.5);
    doc.font("Helvetica-Bold").text("Income by Source:", LEFT_MARGIN, doc.y).font("Helvetica");
    doc.y += 4;
    drawTable(
      doc,
      [
        { header: "Source / Platform", width: 210, align: "left" },
        { header: "Amount", width: 165, align: "right" },
        { header: "% of Total", width: 120, align: "right" },
      ],
      incomeRows,
    );
  }

  // ── ANNUAL INCOME PROJECTION ─────────────────────────────────────────────
  if (annualProjectedIncome > 0) {
    sectionTitle(doc, "Annual Income Projection");
    kv(doc, "Based On", `${statementMonths} month(s) of statement data`);
    kv(doc, "Monthly Average", formatCurrency(monthlyAvgIncome));
    kv(doc, "Projected Annual Income", formatCurrency(annualProjectedIncome));
    kv(doc, "Primary Tax Slab", projectedTaxSlab || "—");
    kv(doc, "Projected Annual Tax", formatCurrency(annualProjectedTax));
    kv(doc, "Projected Effective Rate", `${Number(projectedEffectiveRate || 0).toFixed(2)}%`);
  }

  // ── EXPENSE SUMMARY ─────────────────────────────────────────────────────────
  sectionTitle(doc, "Expense Summary");
  kv(doc, "Total Expenses (Total Debits)", formatCurrency(totalExpenses));
  kv(doc, "Monthly Average Expenses", formatCurrency(monthlyAvgExpenses));

  const expenseRows = Object.entries(expensesByCategory)
    .filter(([, amt]) => Number(amt) > 0)
    .sort(([, a], [, b]) => Number(b) - Number(a))
    .map(([cat, amt]) => [
      capitalize(cat),
      formatCurrency(amt),
      grossIncome > 0 ? `${((Number(amt) / grossIncome) * 100).toFixed(1)}%` : "0.0%",
    ]);

  if (expenseRows.length > 0) {
    gap(doc, 0.5);
    doc.font("Helvetica-Bold").text("Expenses by Category:", LEFT_MARGIN, doc.y).font("Helvetica");
    doc.y += 4;
    drawTable(
      doc,
      [
        { header: "Category", width: 210, align: "left" },
        { header: "Amount", width: 165, align: "right" },
        { header: "% of Income", width: 120, align: "right" },
      ],
      expenseRows,
    );
  }

  // ── FINANCIAL OVERVIEW ──────────────────────────────────────────────────────
  sectionTitle(doc, "Financial Overview");
  kv(doc, "Net Balance (Income − Expenses)", formatCurrency(netBalance));
  kv(doc, "Savings Rate", `${Number(savingsRate || 0).toFixed(2)}%`);
  kv(doc, "Monthly Avg. Expenses", formatCurrency(monthlyAvgExpenses));

  // ── TAX BREAKDOWN TABLE ──────────────────────────────────────────────────────
  sectionTitle(doc, "Tax Breakdown — New Regime (Actual Income)");

  const activeSlabs = Array.isArray(slabBreakdown)
    ? slabBreakdown.filter((s) => Number(s.taxableAmount) > 0)
    : [];

  if (activeSlabs.length > 0) {
    drawTable(
      doc,
      [
        { header: "Slab Range", width: 145, align: "left" },
        { header: "Taxable Amount", width: 140, align: "right" },
        { header: "Rate", width: 75, align: "right" },
        { header: "Tax Amount", width: 135, align: "right" },
      ],
      activeSlabs.map((s) => [
        s.slabRange || "—",
        formatCurrency(s.taxableAmount),
        `${Number(s.taxRate || 0).toFixed(0)}%`,
        formatCurrency(s.taxAmount),
      ]),
    );
  } else {
    doc.text("No tax applicable on current income.", LEFT_MARGIN, doc.y);
    doc.y += LINE_H;
  }

  // ── TAX SUMMARY ─────────────────────────────────────────────────────────────
  sectionTitle(doc, "Tax Summary");
  kv(doc, "Total Tax Payable", formatCurrency(totalTax));
  kv(doc, "Effective Tax Rate", `${Number(effectiveTaxRate || 0).toFixed(2)}%`);

  // ── ADVISORY ─────────────────────────────────────────────────────────────────
  sectionTitle(doc, "Advisory");
  ensureSpace(doc, 50);
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#555")
    .text(
      "This report is an estimated calculation under the New Tax Regime based on your uploaded bank statement data. " +
        "Projections are based on your recorded statement period extrapolated to a full financial year. " +
        "Please consult a certified tax professional or Chartered Accountant before filing your income tax return.",
      LEFT_MARGIN,
      doc.y,
      { width: RIGHT_MARGIN - LEFT_MARGIN, align: "justify" },
    );

  doc.end();
  return stream;
}
