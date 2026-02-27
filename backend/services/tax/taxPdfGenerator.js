import PDFDocument from "pdfkit";
import { PassThrough } from "stream";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const percentageFormatter = new Intl.NumberFormat("en-IN", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatCurrency = (value) => {
  const numericValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  return currencyFormatter.format(numericValue);
};

const formatPercentage = (value) => {
  const numericValue = Number.isFinite(Number(value)) ? Number(value) / 100 : 0;
  return percentageFormatter.format(numericValue);
};

const formatDate = (date) => {
  const parsedDate = date ? new Date(date) : new Date();
  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const addSectionTitle = (doc, title) => {
  doc
    .moveDown(1.2)
    .fontSize(14)
    .font("Helvetica-Bold")
    .text(title, { underline: true })
    .moveDown(0.3)
    .font("Helvetica")
    .fontSize(12);
};

const drawKeyValue = (doc, key, value) => {
  doc
    .font("Helvetica-Bold")
    .text(`${key}: `, { continued: true })
    .font("Helvetica")
    .text(value)
    .moveDown(0.1);
};

const drawTaxTable = (doc, slabBreakdown = []) => {
  const startY = doc.y + 5;
  const columnWidths = [120, 120, 120, 120];
  const headers = ["Slab Range", "Taxable Amount", "Tax Rate", "Tax Amount"];
  const xPositions = columnWidths.map(
    (width, index) =>
      50 + columnWidths.slice(0, index).reduce((sum, w) => sum + w, 0),
  );

  doc
    .lineWidth(1)
    .moveTo(50, startY - 5)
    .lineTo(
      50 + columnWidths.reduce((sum, width) => sum + width, 0),
      startY - 5,
    )
    .stroke();

  doc.font("Helvetica-Bold");
  headers.forEach((header, index) => {
    doc.text(header, xPositions[index], startY, {
      width: columnWidths[index],
      align: "left",
    });
  });

  doc.moveDown(0.5).font("Helvetica");

  const rowHeight = 20;
  let currentY = startY + rowHeight;

  slabBreakdown.forEach((slab) => {
    const values = [
      slab.slabRange || "-",
      formatCurrency(slab.taxableAmount),
      `${Number(slab.taxRate || 0).toFixed(2)}%`,
      formatCurrency(slab.taxAmount),
    ];

    values.forEach((value, index) => {
      doc.text(value, xPositions[index], currentY, {
        width: columnWidths[index],
        align: "left",
      });
    });

    currentY += rowHeight;
  });

  doc
    .moveTo(50, currentY - 5)
    .lineTo(
      50 + columnWidths.reduce((sum, width) => sum + width, 0),
      currentY - 5,
    )
    .stroke();

  doc
    .moveTo(50, startY - 5)
    .lineTo(50, currentY - 5)
    .stroke();
  doc
    .moveTo(
      50 + columnWidths.reduce((sum, width) => sum + width, 0),
      startY - 5,
    )
    .lineTo(
      50 + columnWidths.reduce((sum, width) => sum + width, 0),
      currentY - 5,
    )
    .stroke();

  doc.y = currentY + 5;
};

const drawTwoColumnTable = (doc, headers, rows, colWidths = [220, 220]) => {
  const startY = doc.y + 5;
  const xPositions = colWidths.map(
    (_, index) => 50 + colWidths.slice(0, index).reduce((sum, w) => sum + w, 0),
  );
  const totalWidth = colWidths.reduce((sum, w) => sum + w, 0);

  doc
    .lineWidth(1)
    .moveTo(50, startY - 5)
    .lineTo(50 + totalWidth, startY - 5)
    .stroke();

  doc.font("Helvetica-Bold");
  headers.forEach((h, i) =>
    doc.text(h, xPositions[i], startY, { width: colWidths[i], align: "left" }),
  );
  doc.moveDown(0.5).font("Helvetica");

  const rowHeight = 20;
  let currentY = startY + rowHeight;

  rows.forEach((row) => {
    row.forEach((cell, i) => {
      doc.text(cell, xPositions[i], currentY, {
        width: colWidths[i],
        align: i === 0 ? "left" : "right",
      });
    });
    currentY += rowHeight;
  });

  doc
    .moveTo(50, currentY - 5)
    .lineTo(50 + totalWidth, currentY - 5)
    .stroke();
  doc.y = currentY + 5;
};

const capitalize = (str = "") =>
  str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function generateTaxSummaryPdf(
  taxSummary = {},
  financialSummary = {},
  user = {},
) {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const stream = new PassThrough();
  doc.pipe(stream);

  const {
    grossIncome = 0,
    deductibleBusinessExpenses = 0,
    netTaxableIncome = 0,
    slabBreakdown = [],
    totalTax = 0,
    effectiveTaxRate = 0,
  } = taxSummary;

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
  } = financialSummary;

  // ── Header ──────────────────────────────────────────────
  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .text("Annual Financial & Tax Summary Report", { align: "center" })
    .moveDown(1.5)
    .fontSize(12)
    .font("Helvetica");

  // ── User Information ─────────────────────────────────────
  addSectionTitle(doc, "User Information");
  drawKeyValue(doc, "Name", user?.name || "Not Provided");
  drawKeyValue(doc, "Generated Date", formatDate(new Date()));

  // ── Statement Period ─────────────────────────────────────
  if (dataStartDate || dataEndDate) {
    addSectionTitle(doc, "Bank Statement Coverage");
    drawKeyValue(
      doc,
      "Statement Period",
      `${formatDate(dataStartDate)} – ${formatDate(dataEndDate)}`,
    );
    drawKeyValue(doc, "Total Transactions", `${totalTransactions} (${creditTransactions} credits, ${debitTransactions} debits)`);
  }

  // ── Income Summary ────────────────────────────────────────
  addSectionTitle(doc, "Income Summary");
  drawKeyValue(doc, "Gross Income (Total Credits)", formatCurrency(grossIncome));
  drawKeyValue(doc, "Monthly Average Income", formatCurrency(monthlyAvgIncome));
  drawKeyValue(doc, "Deductible Business Expenses", formatCurrency(deductibleBusinessExpenses));
  drawKeyValue(doc, "Net Taxable Income", formatCurrency(netTaxableIncome));

  // Income by Source table
  const incomeRows = Object.entries(incomeByPlatform)
    .filter(([, amount]) => Number(amount) > 0)
    .map(([platform, amount]) => [capitalize(platform), formatCurrency(amount)]);

  if (incomeRows.length > 0) {
    doc.moveDown(0.5).font("Helvetica-Bold").text("Income by Source:").font("Helvetica");
    drawTwoColumnTable(doc, ["Source / Platform", "Amount"], incomeRows);
  }

  // ── Expense Summary ───────────────────────────────────────
  addSectionTitle(doc, "Expense Summary");
  drawKeyValue(doc, "Total Expenses (Total Debits)", formatCurrency(totalExpenses));
  drawKeyValue(doc, "Monthly Average Expenses", formatCurrency(monthlyAvgExpenses));

  const expenseRows = Object.entries(expensesByCategory)
    .filter(([, amount]) => Number(amount) > 0)
    .map(([cat, amount]) => {
      const pct = grossIncome > 0 ? ((Number(amount) / grossIncome) * 100).toFixed(1) : "0.0";
      return [capitalize(cat), `${formatCurrency(amount)} (${pct}% of income)`];
    });

  if (expenseRows.length > 0) {
    doc.moveDown(0.5).font("Helvetica-Bold").text("Expenses by Category:").font("Helvetica");
    drawTwoColumnTable(doc, ["Category", "Amount (% of Income)"], expenseRows, [180, 260]);
  }

  // ── Financial Overview ────────────────────────────────────
  addSectionTitle(doc, "Financial Overview");
  drawKeyValue(doc, "Net Balance (Income − Expenses)", formatCurrency(netBalance));
  drawKeyValue(doc, "Savings Rate", `${Number(savingsRate || 0).toFixed(2)}%`);

  // ── Tax Breakdown ─────────────────────────────────────────
  addSectionTitle(doc, "Tax Breakdown (New Regime)");
  drawTaxTable(doc, Array.isArray(slabBreakdown) ? slabBreakdown : []);

  // ── Tax Summary ───────────────────────────────────────────
  addSectionTitle(doc, "Tax Summary");
  drawKeyValue(doc, "Total Tax", formatCurrency(totalTax));
  drawKeyValue(doc, "Effective Tax Rate", `${Number(effectiveTaxRate || 0).toFixed(2)}%`);

  // ── Advisory ─────────────────────────────────────────────
  addSectionTitle(doc, "Advisory");
  doc
    .font("Helvetica")
    .text(
      "This is an estimated tax calculation under the New Tax Regime. Please consult a certified tax professional before filing.",
      { align: "justify" },
    );

  doc.end();

  return stream;
}
