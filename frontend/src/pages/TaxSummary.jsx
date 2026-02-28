import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import Navbar from "../components/Navbar";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("en-IN", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatCurrency = (value = 0) =>
  currencyFormatter.format(Number(value) || 0);
const formatPercent = (value = 0) =>
  percentFormatter.format((Number(value) || 0) / 100);

const capitalize = (str = "") =>
  str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const TaxAlertCard = ({ type, title, message, isDark }) => {
  const palette = {
    warning: {
      container: isDark
        ? "bg-yellow-900/30 border-yellow-500 text-yellow-100"
        : "bg-yellow-50 border-yellow-400 text-yellow-900",
      icon: isDark ? "text-yellow-200" : "text-yellow-600",
    },
    success: {
      container: isDark
        ? "bg-green-900/30 border-green-500 text-green-100"
        : "bg-green-50 border-green-500 text-green-900",
      icon: isDark ? "text-green-200" : "text-green-600",
    },
    info: {
      container: isDark
        ? "bg-blue-900/30 border-blue-500 text-blue-100"
        : "bg-blue-50 border-blue-400 text-blue-900",
      icon: isDark ? "text-blue-200" : "text-blue-600",
    },
  };

  const styles = palette[type] || palette.info;
  const Icon =
    type === "success"
      ? CheckCircle
      : type === "warning"
        ? AlertTriangle
        : Info;

  return (
    <div
      className={`border border-l-4 rounded-lg px-4 py-3 flex items-start gap-3 ${styles.container}`}
      role="alert"
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.icon}`} />
      <div>
        {title && <p className="text-sm font-semibold">{title}</p>}
        {message && (
          <p className="text-xs mt-1 opacity-80 leading-relaxed">{message}</p>
        )}
      </div>
    </div>
  );
};

export default function TaxSummary() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const [taxSummary, setTaxSummary] = useState(null);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchTaxSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await axios.get("/api/tax/annual-summary");
        if (!isMounted) return;
        setTaxSummary(data?.data?.taxSummary || null);
        setFinancialSummary(data?.data?.financialSummary || null);
      } catch (err) {
        if (!isMounted) return;
        const message =
          err?.response?.data?.error || "Failed to load tax summary";
        setError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTaxSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  const metrics = useMemo(() => {
    if (!taxSummary) return [];
    return [
      {
        label: t("taxLabelGrossIncome"),
        value: formatCurrency(taxSummary.grossIncome),
        accent: "border-blue-600",
      },
      {
        label: t("taxLabelDeductible"),
        value: formatCurrency(taxSummary.deductibleBusinessExpenses),
        accent: "border-green-500",
      },
      {
        label: t("taxLabelNetTaxable"),
        value: formatCurrency(taxSummary.netTaxableIncome),
        accent: "border-yellow-500",
      },
      {
        label: t("taxLabelEstimatedTax"),
        value: formatCurrency(taxSummary.totalTax),
        accent: "border-purple-500",
      },
      {
        label: t("taxLabelEffectiveRate"),
        value: `${Number(taxSummary.effectiveTaxRate || 0).toFixed(2)}%`,
        accent: "border-indigo-500",
      },
    ];
  }, [taxSummary, t]);

  // Income by platform — only non-zero entries
  const incomeByPlatformRows = useMemo(() => {
    const raw = financialSummary?.incomeByPlatform || {};
    return Object.entries(raw)
      .filter(([, amount]) => Number(amount) > 0)
      .sort(([, a], [, b]) => Number(b) - Number(a));
  }, [financialSummary]);

  // Expenses by category — only non-zero entries
  const expensesByCategoryRows = useMemo(() => {
    const raw = financialSummary?.expensesByCategory || {};
    const totalExpenses = financialSummary?.totalExpenses || 0;
    return Object.entries(raw)
      .filter(([, amount]) => Number(amount) > 0)
      .sort(([, a], [, b]) => Number(b) - Number(a))
      .map(([cat, amount]) => ({
        category: cat,
        amount: Number(amount),
        pct: totalExpenses > 0 ? ((Number(amount) / totalExpenses) * 100).toFixed(1) : "0.0",
      }));
  }, [financialSummary]);

  const alerts = taxSummary?.alerts || [];

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      setError(null);
      const response = await axios.get("/api/tax/download-pdf", {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "annual-tax-summary.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const message = err?.response?.data?.error || "Failed to download PDF";
      setError(message);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDark ? "bg-gray-950" : "bg-gray-50"}`}
      >
        <div className="text-center">
          <div
            className={`w-12 h-12 border-4 rounded-full animate-spin mx-auto ${isDark ? "border-blue-800 border-t-blue-400" : "border-blue-200 border-t-blue-600"}`}
          ></div>
          <p
            className={`mt-4 text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            {t("taxPreparingMsg")}
          </p>
        </div>
      </div>
    );
  }

  const cardCls = `rounded-xl shadow-sm p-6 transition-colors duration-300 ${isDark ? "bg-gray-900" : "bg-white"}`;

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-gray-950" : "bg-gray-50"}`}
    >
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Back to Dashboard */}
        <button
          onClick={() => navigate("/dashboard")}
          className={`flex items-center gap-1 text-sm font-medium mb-5 transition ${
            isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-900 hover:text-blue-700"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1
              className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
            >
              {t("taxPageTitle")}
            </h1>
            <p
              className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              {t("taxPageSubtitle")}
            </p>
          </div>
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="px-5 py-3 bg-blue-900 hover:bg-blue-800 disabled:opacity-70 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition"
          >
            {downloading ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0l3-3m-3 3L9 9m3 3v6m5 0H7" />
              </svg>
            )}
            {downloading ? t("taxDownloadPdfPreparing") : t("taxDownloadPdf")}
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div
            className={`mb-6 p-4 border rounded-lg text-sm flex items-center justify-between ${isDark ? "bg-red-900/30 border-red-800 text-red-400" : "bg-red-50 border-red-200 text-red-700"}`}
          >
            <span>{error}</span>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 text-white bg-red-600 rounded-md text-xs font-semibold"
            >
              {t("taxRetry")}
            </button>
          </div>
        )}

        {taxSummary ? (
          <>
            {/* ── Statement Period Banner ───────────────────────────── */}
            {(financialSummary?.dataStartDate || financialSummary?.dataEndDate) && (
              <div
                className={`mb-6 rounded-xl p-4 border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                  isDark
                    ? "bg-blue-950/40 border-blue-800"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <svg className={`w-5 h-5 flex-shrink-0 ${isDark ? "text-blue-400" : "text-blue-700"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-blue-300" : "text-blue-700"}`}>
                      Bank Statement Period
                    </p>
                    <p className={`text-sm font-bold mt-0.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                      {financialSummary.dataStartDate
                        ? new Date(financialSummary.dataStartDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                        : "—"}
                      {" "}→{" "}
                      {financialSummary.dataEndDate
                        ? new Date(financialSummary.dataEndDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {financialSummary.totalTransactions > 0 && (
                    <div className="text-center">
                      <p className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{financialSummary.totalTransactions}</p>
                      <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>Transactions</p>
                    </div>
                  )}
                  {financialSummary.creditTransactions > 0 && (
                    <div className="text-center">
                      <p className={`text-lg font-bold text-green-500`}>{financialSummary.creditTransactions}</p>
                      <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>Credits</p>
                    </div>
                  )}
                  {financialSummary.debitTransactions > 0 && (
                    <div className="text-center">
                      <p className={`text-lg font-bold text-red-400`}>{financialSummary.debitTransactions}</p>
                      <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>Debits</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Tax Metric Cards ──────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className={`rounded-xl shadow-sm border-l-4 ${metric.accent} p-4 transition-colors duration-300 ${isDark ? "bg-gray-900" : "bg-white"}`}
                >
                  <p
                    className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    {metric.label}
                  </p>
                  <p
                    className={`text-2xl font-bold mt-2 ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>

            {/* ── Annual Income Projection ───────────────────────────── */}
            {financialSummary?.annualProjectedIncome > 0 && (
              <div
                className={`mb-6 rounded-xl overflow-hidden shadow-md border ${
                  isDark ? "border-yellow-800" : "border-yellow-200"
                }`}
              >
                {/* Section header */}
                <div className={`px-6 py-4 ${isDark ? "bg-yellow-900/40" : "bg-gradient-to-r from-yellow-50 to-amber-50"}`}>
                  <div className="flex items-center gap-2">
                    <svg className={`w-5 h-5 ${isDark ? "text-yellow-400" : "text-yellow-700"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <div>
                      <h2 className={`text-lg font-bold ${isDark ? "text-yellow-300" : "text-yellow-900"}`}>
                        Annual Income Projection
                      </h2>
                      <p className={`text-xs ${isDark ? "text-yellow-500" : "text-yellow-700"}`}>
                        Extrapolated from {financialSummary.statementMonths || "—"} month(s) of bank statement data
                      </p>
                    </div>
                  </div>
                </div>

                {/* Metrics grid */}
                <div className={`grid grid-cols-2 md:grid-cols-4 gap-0 divide-x ${isDark ? "divide-gray-700 bg-gray-900" : "divide-gray-100 bg-white"}`}>
                  {/* Projected Annual Income */}
                  <div className="px-5 py-4">
                    <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      Projected Annual Income
                    </p>
                    <p className={`text-xl font-bold ${isDark ? "text-yellow-300" : "text-yellow-700"}`}>
                      {formatCurrency(financialSummary.annualProjectedIncome)}
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                      ≈ {formatCurrency(financialSummary.monthlyAvgIncome || 0)}/mo × 12
                    </p>
                  </div>

                  {/* Tax Slab */}
                  <div className="px-5 py-4">
                    <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      Primary Tax Slab
                    </p>
                    <p className={`text-base font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                      {financialSummary.projectedTaxSlab || "—"}
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>New Tax Regime</p>
                  </div>

                  {/* Projected Tax */}
                  <div className="px-5 py-4">
                    <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      Projected Annual Tax
                    </p>
                    <p className={`text-xl font-bold ${isDark ? "text-red-400" : "text-red-600"}`}>
                      {formatCurrency(financialSummary.annualProjectedTax)}
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Estimated payable</p>
                  </div>

                  {/* Effective Rate */}
                  <div className="px-5 py-4">
                    <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      Projected Effective Rate
                    </p>
                    <p className={`text-xl font-bold ${isDark ? "text-indigo-400" : "text-indigo-700"}`}>
                      {Number(financialSummary.projectedEffectiveRate || 0).toFixed(2)}%
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Of projected income</p>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className={`px-6 py-2 text-xs ${isDark ? "bg-gray-800 text-gray-500" : "bg-yellow-50 text-yellow-800"}`}>
                  ⚠️ Projection based on {financialSummary.statementMonths || "?"}-month average. Actual annual income may vary.
                </div>
              </div>
            )}

            {/* ── Income by Source ──────────────────────────────────── */}
            {incomeByPlatformRows.length > 0 && (

              <div className={`${cardCls} mb-6`}>
                <div className="flex items-center gap-2 mb-4">
                  <svg className={`w-5 h-5 ${isDark ? "text-green-400" : "text-green-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                      Income by Source
                    </h2>
                    <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      Credit transactions extracted from uploaded bank statement
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y text-sm">
                    <thead className={`${isDark ? "bg-gray-800 divide-gray-700" : "bg-gray-50 divide-gray-200"}`}>
                      <tr>
                        <th className={`px-4 py-3 text-left font-semibold ${isDark ? "text-gray-300" : "text-gray-600"}`}>Source / Platform</th>
                        <th className={`px-4 py-3 text-right font-semibold ${isDark ? "text-gray-300" : "text-gray-600"}`}>Amount</th>
                        <th className={`px-4 py-3 text-right font-semibold ${isDark ? "text-gray-300" : "text-gray-600"}`}>% of Total Income</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? "divide-gray-800" : "divide-gray-100"}`}>
                      {incomeByPlatformRows.map(([platform, amount]) => {
                        const pct = financialSummary?.totalIncome > 0
                          ? ((Number(amount) / financialSummary.totalIncome) * 100).toFixed(1)
                          : "0.0";
                        return (
                          <tr key={platform} className={`transition ${isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"}`}>
                            <td className={`px-4 py-3 font-medium ${isDark ? "text-gray-200" : "text-gray-900"}`}>
                              {capitalize(platform)}
                            </td>
                            <td className={`px-4 py-3 text-right font-semibold ${isDark ? "text-green-400" : "text-green-700"}`}>
                              {formatCurrency(amount)}
                            </td>
                            <td className={`px-4 py-3 text-right ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${isDark ? "bg-green-900/40 text-green-300" : "bg-green-100 text-green-800"}`}>
                                {pct}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className={`${isDark ? "bg-gray-800 border-t border-gray-700" : "bg-gray-50 border-t border-gray-200"}`}>
                        <td className={`px-4 py-3 font-bold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>Total</td>
                        <td className={`px-4 py-3 text-right font-bold text-sm ${isDark ? "text-green-400" : "text-green-700"}`}>
                          {formatCurrency(financialSummary?.totalIncome || 0)}
                        </td>
                        <td className={`px-4 py-3 text-right font-bold text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* ── Expense Category Breakdown ────────────────────────── */}
            {expensesByCategoryRows.length > 0 && (
              <div className={`${cardCls} mb-6`}>
                <div className="flex items-center gap-2 mb-4">
                  <svg className={`w-5 h-5 ${isDark ? "text-red-400" : "text-red-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                      Expense Category Breakdown
                    </h2>
                    <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      Debit transactions categorized from uploaded bank statement
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y text-sm">
                    <thead className={`${isDark ? "bg-gray-800 divide-gray-700" : "bg-gray-50 divide-gray-200"}`}>
                      <tr>
                        <th className={`px-4 py-3 text-left font-semibold ${isDark ? "text-gray-300" : "text-gray-600"}`}>Category</th>
                        <th className={`px-4 py-3 text-right font-semibold ${isDark ? "text-gray-300" : "text-gray-600"}`}>Amount</th>
                        <th className={`px-4 py-3 text-right font-semibold ${isDark ? "text-gray-300" : "text-gray-600"}`}>% of Total Expenses</th>
                        <th className={`px-4 py-3 text-left font-semibold ${isDark ? "text-gray-300" : "text-gray-600"}`}>Share</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? "divide-gray-800" : "divide-gray-100"}`}>
                      {expensesByCategoryRows.map(({ category, amount, pct }) => (
                        <tr key={category} className={`transition ${isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"}`}>
                          <td className={`px-4 py-3 font-medium ${isDark ? "text-gray-200" : "text-gray-900"}`}>
                            {capitalize(category)}
                          </td>
                          <td className={`px-4 py-3 text-right font-semibold ${isDark ? "text-red-400" : "text-red-600"}`}>
                            {formatCurrency(amount)}
                          </td>
                          <td className={`px-4 py-3 text-right ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${isDark ? "bg-red-900/40 text-red-300" : "bg-red-100 text-red-800"}`}>
                              {pct}%
                            </span>
                          </td>
                          <td className="px-4 py-3 w-32">
                            <div className={`w-full rounded-full h-2 ${isDark ? "bg-gray-700" : "bg-gray-200"}`}>
                              <div
                                className="h-2 rounded-full bg-red-500 transition-all duration-500"
                                style={{ width: `${Math.min(100, parseFloat(pct))}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className={`${isDark ? "bg-gray-800 border-t border-gray-700" : "bg-gray-50 border-t border-gray-200"}`}>
                        <td className={`px-4 py-3 font-bold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>Total</td>
                        <td className={`px-4 py-3 text-right font-bold text-sm ${isDark ? "text-red-400" : "text-red-600"}`}>
                          {formatCurrency(financialSummary?.totalExpenses || 0)}
                        </td>
                        <td colSpan={2} className={`px-4 py-3 text-right font-bold text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* ── Tax Slab Breakdown Table ──────────────────────────── */}
            <div
              className={`rounded-xl shadow-sm p-6 mb-8 transition-colors duration-300 ${isDark ? "bg-gray-900" : "bg-white"}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2
                    className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    {t("taxSlabTitle")}
                  </h2>
                  <p
                    className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    {t("taxSlabSubtitle")}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold ${isDark ? "text-blue-400" : "text-blue-900"}`}
                >
                  {t("taxAssessmentYear")}: {new Date().getFullYear()}-
                  {new Date().getFullYear() + 1}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y text-sm">
                  <thead
                    className={`${isDark ? "bg-gray-800 divide-gray-700" : "bg-gray-50 divide-gray-200"}`}
                  >
                    <tr>
                      {[
                        t("taxColSlabRange"),
                        t("taxColTaxableAmount"),
                        t("taxColTaxRate"),
                        t("taxColTaxAmount"),
                      ].map((heading) => (
                        <th
                          key={heading}
                          className={`px-4 py-3 text-left font-semibold ${isDark ? "text-gray-300" : "text-gray-600"}`}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y ${isDark ? "divide-gray-800" : "divide-gray-100"}`}
                  >
                    {(taxSummary.slabBreakdown || []).map((slab) => (
                      <tr
                        key={slab.slabRange}
                        className={`transition ${isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"}`}
                      >
                        <td
                          className={`px-4 py-3 font-medium ${isDark ? "text-gray-200" : "text-gray-900"}`}
                        >
                          {slab.slabRange.replace("-", " - ")}
                        </td>
                        <td
                          className={`px-4 py-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                        >
                          {formatCurrency(slab.taxableAmount)}
                        </td>
                        <td
                          className={`px-4 py-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                        >
                          {Number(slab.taxRate || 0).toFixed(2)}%
                        </td>
                        <td
                          className={`px-4 py-3 font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                        >
                          {formatCurrency(slab.taxAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {alerts.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h3
                    className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    {t("taxAlertsHeading")}
                  </h3>
                  <span
                    className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    {t("taxAlertsSubtitle")}
                  </span>
                </div>
                <div className="space-y-4">
                  {alerts.map((alert, index) => (
                    <TaxAlertCard
                      key={`${alert.title}-${index}`}
                      {...alert}
                      isDark={isDark}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Financial Overview + Advisory ─────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Financial Overview */}
              <div
                className={`rounded-xl shadow-sm p-6 border transition-colors duration-300 ${isDark ? "bg-gray-900 border-blue-900" : "bg-white border-blue-100"}`}
              >
                <h3
                  className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  {t("taxFinancialOverview")}
                </h3>
                <p
                  className={`text-xs mb-4 mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  {t("taxFinancialOverviewSubtitle")}
                </p>
                <dl className="space-y-3 text-sm">
                  {[
                    { label: t("taxTotalIncome"), value: formatCurrency(financialSummary?.totalIncome || 0) },
                    { label: t("taxTotalExpenses"), value: formatCurrency(financialSummary?.totalExpenses || 0) },
                    { label: "Net Balance", value: formatCurrency(financialSummary?.netBalance || 0) },
                    { label: "Monthly Avg. Income", value: formatCurrency(financialSummary?.monthlyAvgIncome || 0) },
                    { label: "Monthly Avg. Expenses", value: formatCurrency(financialSummary?.monthlyAvgExpenses || 0) },
                    { label: t("taxSavingsRate"), value: formatPercent(financialSummary?.savingsRate || 0) },
                  ].map(({ label, value }, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between">
                        <dt className={isDark ? "text-gray-400" : "text-gray-600"}>{label}</dt>
                        <dd className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{value}</dd>
                      </div>
                      {i < 5 && (
                        <div className={`border-t mt-3 ${isDark ? "border-gray-800" : "border-gray-100"}`} />
                      )}
                    </div>
                  ))}
                  <div className="flex items-center justify-between">
                    <dt className={isDark ? "text-gray-400" : "text-gray-600"}>{t("taxDataRefreshed")}</dt>
                    <dd className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                      {financialSummary?.lastUpdated
                        ? new Date(financialSummary.lastUpdated).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : t("taxNotAvailable")}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Advisory */}
              <div
                className={`rounded-xl shadow-sm p-6 border transition-colors duration-300 ${isDark ? "bg-gray-900 border-yellow-900" : "bg-gradient-to-br from-yellow-50 via-white to-white border-yellow-100"}`}
              >
                <h3
                  className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  {t("taxAdvisory")}
                </h3>
                <p
                  className={`text-sm leading-relaxed mt-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  {t("taxAdvisoryText")}
                </p>
                <div
                  className={`mt-4 text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}
                >
                  {t("taxGeneratedFor")}:{" "}
                  <span
                    className={`font-semibold ${isDark ? "text-gray-200" : "text-gray-900"}`}
                  >
                    {user?.name || "Registered User"}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div
            className={`rounded-xl shadow-sm p-8 text-center transition-colors duration-300 ${isDark ? "bg-gray-900" : "bg-white"}`}
          >
            <p className={isDark ? "text-gray-400" : "text-gray-600"}>
              {t("taxNoData")}
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="mt-4 inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition"
            >
              {t("taxBackToDashboard")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
