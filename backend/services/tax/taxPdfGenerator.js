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
};

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

  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .text("Annual Financial & Tax Summary Report", {
      align: "center",
    })
    .moveDown(1.5)
    .fontSize(12)
    .font("Helvetica");

  addSectionTitle(doc, "User Information");
  drawKeyValue(doc, "Name", user?.name || "Not Provided");
  drawKeyValue(doc, "Generated Date", formatDate(new Date()));

  addSectionTitle(doc, "Income Summary");
  drawKeyValue(doc, "Gross Income", formatCurrency(grossIncome));
  drawKeyValue(
    doc,
    "Deductible Business Expenses",
    formatCurrency(deductibleBusinessExpenses),
  );
  drawKeyValue(doc, "Net Taxable Income", formatCurrency(netTaxableIncome));

  addSectionTitle(doc, "Tax Breakdown");
  drawTaxTable(doc, Array.isArray(slabBreakdown) ? slabBreakdown : []);

  addSectionTitle(doc, "Tax Summary");
  drawKeyValue(doc, "Total Tax", formatCurrency(totalTax));
  drawKeyValue(doc, "Effective Tax Rate", `${effectiveTaxRate.toFixed(2)}%`);

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
