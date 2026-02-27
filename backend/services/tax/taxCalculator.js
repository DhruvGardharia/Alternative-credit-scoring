const BUSINESS_EXPENSE_CATEGORIES = new Set([
  "fuel",
  "travel",
  "internet",
  "equipment",
  "rent",
  "platform fees",
  "platform-fees",
  "platform_fees",
  "repairs",
]);

const TAX_SLABS = [
  { label: "0-300000", start: 0, end: 300000, rate: 0 },
  { label: "300001-600000", start: 300000, end: 600000, rate: 0.05 },
  { label: "600001-900000", start: 600000, end: 900000, rate: 0.1 },
  { label: "900001-1200000", start: 900000, end: 1200000, rate: 0.15 },
  { label: "1200001-1500000", start: 1200000, end: 1500000, rate: 0.2 },
  { label: "1500001+", start: 1500000, end: Infinity, rate: 0.3 },
];

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const roundToTwo = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const normalizeCategory = (category = "") =>
  category.toString().trim().toLowerCase();

const sumDeductibleExpenses = (categorizedExpenses = {}) => {
  if (!categorizedExpenses) return 0;

  const entries = Array.isArray(categorizedExpenses)
    ? categorizedExpenses.map((item) => [item.category, item.amount])
    : Object.entries(categorizedExpenses);

  return entries.reduce((total, [category, amount]) => {
    if (!category) return total;
    const normalizedCategory = normalizeCategory(category);
    if (!BUSINESS_EXPENSE_CATEGORIES.has(normalizedCategory)) return total;

    const sanitizedAmount = Math.max(0, toNumber(amount));
    return total + sanitizedAmount;
  }, 0);
};

const buildSlabBreakdown = (netTaxableIncome) => {
  return TAX_SLABS.map((slab) => {
    const taxableAmount = Math.max(
      0,
      Math.min(slab.end, netTaxableIncome) - slab.start,
    );
    const taxAmount = taxableAmount * slab.rate;

    return {
      slabRange: slab.label,
      taxableAmount: roundToTwo(taxableAmount),
      taxRate: roundToTwo(slab.rate * 100),
      taxAmount: roundToTwo(taxAmount),
    };
  });
};

const calculateTotalTax = (slabBreakdown) =>
  slabBreakdown.reduce((sum, slab) => sum + slab.taxAmount, 0);

export function calculateAnnualTaxSummary(financialSummary = {}) {
  const grossIncome = Math.max(0, toNumber(financialSummary.totalIncome));
  const deductibleBusinessExpenses = Math.min(
    grossIncome,
    Math.max(0, sumDeductibleExpenses(financialSummary.categorizedExpenses)),
  );

  const netTaxableIncome = Math.max(
    0,
    grossIncome - deductibleBusinessExpenses,
  );

  const slabBreakdown = buildSlabBreakdown(netTaxableIncome);
  const totalTax = roundToTwo(calculateTotalTax(slabBreakdown));
  const effectiveTaxRate = grossIncome
    ? roundToTwo((totalTax / grossIncome) * 100)
    : 0;

  return {
    grossIncome: roundToTwo(grossIncome),
    deductibleBusinessExpenses: roundToTwo(deductibleBusinessExpenses),
    netTaxableIncome: roundToTwo(netTaxableIncome),
    slabBreakdown,
    totalTax,
    effectiveTaxRate,
  };
}
