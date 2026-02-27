<<<<<<< HEAD
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  AlertTriangle,
  CheckCircle,
  Download,
  Info,
  ArrowLeft,
  FileText,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

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

const formatCurrency = (value = 0) =>
  currencyFormatter.format(Number(value) || 0);
const formatPercent = (value = 0) =>
  percentageFormatter.format((Number(value) || 0) / 100);

const TaxAlertCard = ({ type = "info", title, message, isDark }) => {
  const styleMap = {
    warning: {
      container: `${isDark ? "bg-yellow-900/30 border-yellow-500 text-yellow-200" : "bg-yellow-50 border-yellow-400 text-yellow-900"}`,
      icon: isDark ? "text-yellow-300" : "text-yellow-600",
    },
    success: {
      container: `${isDark ? "bg-green-900/30 border-green-500 text-green-200" : "bg-green-50 border-green-400 text-green-900"}`,
      icon: isDark ? "text-green-300" : "text-green-600",
    },
    info: {
      container: `${isDark ? "bg-blue-900/30 border-blue-500 text-blue-200" : "bg-blue-50 border-blue-400 text-blue-900"}`,
      icon: isDark ? "text-blue-300" : "text-blue-600",
    },
  };

  const styles = styleMap[type] || styleMap.info;
  const Icon =
    type === "success"
      ? CheckCircle
      : type === "warning"
        ? AlertTriangle
        : Info;

  return (
    <div
      role="alert"
      className={`border border-l-4 rounded-lg px-4 py-3 flex items-start gap-3 ${styles.container} transition-all duration-300 hover:scale-[1.01]`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.icon}`} />
      <div>
        {title && <p className="font-semibold text-sm">{title}</p>}
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

  const [taxData, setTaxData] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    const fetchSummary = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("/api/tax/annual-summary");
        if (ignore) return;
        const taxSummaryPayload = data?.data?.taxSummary || null;
        setTaxData(taxSummaryPayload);
        setFinancialData(data?.data?.financialSummary || null);
        setError(null);
      } catch (err) {
        if (ignore) return;
        setError(err?.response?.data?.error || t("taxSummaryError"));
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchSummary();

    return () => {
      ignore = true;
    };
  }, [reloadKey, t]);

  const metrics = useMemo(() => {
    if (!taxData) return [];
    return [
      {
        label: t("taxMetricsGrossIncome"),
        value: formatCurrency(taxData.grossIncome),
        accent: "border-blue-600",
      },
      {
        label: t("taxMetricsDeductibleExpenses"),
        value: formatCurrency(taxData.deductibleBusinessExpenses),
        accent: "border-green-500",
      },
      {
        label: t("taxMetricsNetTaxableIncome"),
        value: formatCurrency(taxData.netTaxableIncome),
        accent: "border-yellow-500",
      },
      {
        label: t("taxMetricsEstimatedTax"),
        value: formatCurrency(taxData.totalTax),
        accent: "border-purple-500",
      },
      {
        label: t("taxMetricsEffectiveRate"),
        value: formatPercent(taxData.effectiveTaxRate),
        accent: "border-indigo-500",
      },
    ];
  }, [taxData, t]);

  const slabBreakdown = taxData?.slabBreakdown || [];
  const alerts = taxData?.alerts || [];
  const currentYear = new Date().getFullYear();
  const assessmentYear = `${currentYear}-${currentYear + 1}`;

  const handleRetry = () => setReloadKey((prev) => prev + 1);

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
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
      setError(err?.response?.data?.error || t("taxPdfError"));
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isDark ? "bg-gray-950" : "bg-gray-50"}`}
      >
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p
            className={`mt-4 text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}
          >
            {t("preparingTaxSummary")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-gray-950" : "bg-gray-50"}`}
    >
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <button
              onClick={() => navigate("/dashboard")}
              className={`inline-flex items-center gap-2 text-sm font-medium ${isDark ? "text-blue-300 hover:text-blue-200" : "text-blue-900 hover:text-blue-700"}`}
            >
              <ArrowLeft className="w-4 h-4" />
              {t("backToDashboard")}
            </button>
            <div className="mt-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-600/10 text-blue-700 dark:text-blue-300">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h1
                  className={`text-2xl font-bold ${isDark ? "text-gray-100" : "text-gray-900"}`}
                >
                  {t("taxSummaryTitle")}
                </h1>
                <p
                  className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  {t("taxSummarySubtitle")}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold shadow ${downloading ? "opacity-70 cursor-not-allowed" : ""} ${isDark ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-blue-900 text-white hover:bg-blue-800"}`}
          >
            {downloading ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {downloading ? t("downloadPreparing") : t("downloadPdf")}
          </button>
        </div>

        {error && (
          <div
            className={`mb-6 rounded-lg border px-4 py-3 text-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${isDark ? "bg-red-950/50 border-red-700 text-red-200" : "bg-red-50 border-red-200 text-red-800"}`}
          >
            <span>{error}</span>
            <button
              onClick={handleRetry}
              className={`px-4 py-2 rounded-md font-semibold text-xs ${isDark ? "bg-red-700 text-white hover:bg-red-600" : "bg-red-600 text-white hover:bg-red-700"}`}
            >
              {t("retry")}
            </button>
          </div>
        )}

        {taxData ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className={`rounded-xl border shadow-sm p-4 border-l-4 ${metric.accent} ${isDark ? "bg-gray-900 border-gray-800 text-gray-100" : "bg-white border-gray-100 text-gray-900"}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                    {metric.label}
                  </p>
                  <p className="text-2xl font-bold mt-2">{metric.value}</p>
                </div>
              ))}
            </div>

            <div
              className={`rounded-xl shadow-sm p-6 mb-8 ${isDark ? "bg-gray-900 border border-gray-800" : "bg-white border border-gray-100"}`}
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h2
                    className={`text-lg font-bold ${isDark ? "text-gray-100" : "text-gray-900"}`}
                  >
                    {t("taxSlabHeading")}
                  </h2>
                  <p
                    className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    {t("taxSlabSubtitle")}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold ${isDark ? "text-blue-300" : "text-blue-900"}`}
                >
                  {t("assessmentYearLabel")}: {assessmentYear}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className={isDark ? "bg-gray-800" : "bg-gray-50"}>
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">
                        {t("taxTableSlabRange")}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        {t("taxTableTaxableAmount")}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        {t("taxTableTaxRate")}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        {t("taxTableTaxAmount")}
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    className={
                      isDark
                        ? "divide-y divide-gray-800"
                        : "divide-y divide-gray-100"
                    }
                  >
                    {slabBreakdown.map((slab) => (
                      <tr
                        key={slab.slabRange}
                        className={
                          isDark ? "hover:bg-gray-800/60" : "hover:bg-gray-50"
                        }
                      >
                        <td className="px-4 py-3 font-medium">
                          {slab.slabRange}
                        </td>
                        <td className="px-4 py-3">
                          {formatCurrency(slab.taxableAmount)}
                        </td>
                        <td className="px-4 py-3">
                          {Number(slab.taxRate || 0).toFixed(2)}%
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {formatCurrency(slab.taxAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {alerts.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3
                    className={`text-lg font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div
                className={`rounded-xl border shadow-sm p-6 ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"}`}
              >
                <h3
                  className={`text-lg font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}
                >
                  {t("financialOverviewHeading")}
                </h3>
                <p
                  className={`text-xs mb-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  {t("financialOverviewSubtitle")}
                </p>
                <dl className="space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className={isDark ? "text-gray-400" : "text-gray-600"}>
                      {t("financialTotalIncome")}
                    </dt>
                    <dd
                      className={`font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}
                    >
                      {formatCurrency(financialData?.totalIncome || 0)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className={isDark ? "text-gray-400" : "text-gray-600"}>
                      {t("financialTotalExpenses")}
                    </dt>
                    <dd
                      className={`font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}
                    >
                      {formatCurrency(financialData?.totalExpenses || 0)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className={isDark ? "text-gray-400" : "text-gray-600"}>
                      {t("financialSavingsRate")}
                    </dt>
                    <dd
                      className={`font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}
                    >
                      {formatPercent(financialData?.savingsRate || 0)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className={isDark ? "text-gray-400" : "text-gray-600"}>
                      {t("financialLastUpdated")}
                    </dt>
                    <dd
                      className={`font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}
                    >
                      {financialData?.lastUpdated
                        ? new Date(
                            financialData.lastUpdated,
                          ).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : t("notAvailable")}
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="rounded-xl border shadow-sm p-6 bg-gradient-to-br from-yellow-50 via-white to-white dark:from-yellow-900/20 dark:via-gray-900 dark:to-gray-900 border-yellow-100 dark:border-yellow-500/40">
                <h3
                  className={`text-lg font-semibold ${isDark ? "text-yellow-200" : "text-yellow-900"}`}
                >
                  {t("advisoryHeading")}
                </h3>
                <p
                  className={`text-sm leading-relaxed mt-3 ${isDark ? "text-gray-100/90" : "text-gray-700"}`}
                >
                  {t("advisoryBody")}
                </p>
                <div
                  className={`mt-4 text-xs font-semibold ${isDark ? "text-gray-300" : "text-gray-600"}`}
                >
                  {t("generatedFor")}:{" "}
                  <span className="font-bold">
                    {user?.name || t("notAvailable")}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div
            className={`rounded-xl border p-8 text-center ${isDark ? "bg-gray-900 border-gray-800 text-gray-200" : "bg-white border-gray-100 text-gray-700"}`}
          >
            <p>{t("noTaxData")}</p>
            <button
              onClick={() => navigate("/dashboard")}
              className={`inline-flex items-center gap-2 px-4 py-2 mt-4 rounded-lg text-sm font-semibold ${isDark ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-blue-900 text-white hover:bg-blue-800"}`}
            >
              <ArrowLeft className="w-4 h-4" />
              {t("backToDashboard")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
=======
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDark ? "bg-gray-950" : "bg-gray-50"}`}>
        <div className="text-center">
          <div className={`w-12 h-12 border-4 rounded-full animate-spin mx-auto ${isDark ? "border-blue-800 border-t-blue-400" : "border-blue-200 border-t-blue-600"}`}></div>
          <p className={`mt-4 text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            {t("taxPreparingMsg")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-gray-950" : "bg-gray-50"}`}>
      {/* Shared Navbar (includes theme toggle + language switcher) */}
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
              {t("taxPageTitle")}
            </h1>
            <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
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
          <div className={`mb-6 p-4 border rounded-lg text-sm flex items-center justify-between ${isDark ? "bg-red-900/30 border-red-800 text-red-400" : "bg-red-50 border-red-200 text-red-700"}`}>
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
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className={`rounded-xl shadow-sm border-l-4 ${metric.accent} p-4 transition-colors duration-300 ${isDark ? "bg-gray-900" : "bg-white"}`}
                >
                  <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    {metric.label}
                  </p>
                  <p className={`text-2xl font-bold mt-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Tax Slab Breakdown Table */}
            <div className={`rounded-xl shadow-sm p-6 mb-8 transition-colors duration-300 ${isDark ? "bg-gray-900" : "bg-white"}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                    {t("taxSlabTitle")}
                  </h2>
                  <p className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    {t("taxSlabSubtitle")}
                  </p>
                </div>
                <span className={`text-sm font-semibold ${isDark ? "text-blue-400" : "text-blue-900"}`}>
                  {t("taxAssessmentYear")}: {new Date().getFullYear()}-{new Date().getFullYear() + 1}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y text-sm">
                  <thead className={`${isDark ? "bg-gray-800 divide-gray-700" : "bg-gray-50 divide-gray-200"}`}>
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
                  <tbody className={`divide-y ${isDark ? "divide-gray-800" : "divide-gray-100"}`}>
                    {(taxSummary.slabBreakdown || []).map((slab) => (
                      <tr
                        key={slab.slabRange}
                        className={`transition ${isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"}`}
                      >
                        <td className={`px-4 py-3 font-medium ${isDark ? "text-gray-200" : "text-gray-900"}`}>
                          {slab.slabRange.replace("-", " - ")}
                        </td>
                        <td className={`px-4 py-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                          {formatCurrency(slab.taxableAmount)}
                        </td>
                        <td className={`px-4 py-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                          {Number(slab.taxRate || 0).toFixed(2)}%
                        </td>
                        <td className={`px-4 py-3 font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                          {formatCurrency(slab.taxAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Overview + Advisory */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Financial Overview */}
              <div className={`rounded-xl shadow-sm p-6 border transition-colors duration-300 ${isDark ? "bg-gray-900 border-blue-900" : "bg-white border-blue-100"}`}>
                <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                  {t("taxFinancialOverview")}
                </h3>
                <p className={`text-xs mb-4 mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  {t("taxFinancialOverviewSubtitle")}
                </p>
                <dl className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className={isDark ? "text-gray-400" : "text-gray-600"}>{t("taxTotalIncome")}</dt>
                    <dd className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                      {formatCurrency(financialSummary?.totalIncome || 0)}
                    </dd>
                  </div>
                  <div className={`border-t ${isDark ? "border-gray-800" : "border-gray-100"}`}></div>
                  <div className="flex items-center justify-between">
                    <dt className={isDark ? "text-gray-400" : "text-gray-600"}>{t("taxTotalExpenses")}</dt>
                    <dd className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                      {formatCurrency(financialSummary?.totalExpenses || 0)}
                    </dd>
                  </div>
                  <div className={`border-t ${isDark ? "border-gray-800" : "border-gray-100"}`}></div>
                  <div className="flex items-center justify-between">
                    <dt className={isDark ? "text-gray-400" : "text-gray-600"}>{t("taxSavingsRate")}</dt>
                    <dd className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                      {formatPercent(financialSummary?.savingsRate || 0)}
                    </dd>
                  </div>
                  <div className={`border-t ${isDark ? "border-gray-800" : "border-gray-100"}`}></div>
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
              <div className={`rounded-xl shadow-sm p-6 border transition-colors duration-300 ${isDark ? "bg-gray-900 border-yellow-900" : "bg-gradient-to-br from-yellow-50 via-white to-white border-yellow-100"}`}>
                <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                  {t("taxAdvisory")}
                </h3>
                <p className={`text-sm leading-relaxed mt-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  {t("taxAdvisoryText")}
                </p>
                <div className={`mt-4 text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                  {t("taxGeneratedFor")}:{" "}
                  <span className={`font-semibold ${isDark ? "text-gray-200" : "text-gray-900"}`}>
                    {user?.name || "Registered User"}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className={`rounded-xl shadow-sm p-8 text-center transition-colors duration-300 ${isDark ? "bg-gray-900" : "bg-white"}`}>
            <p className={isDark ? "text-gray-400" : "text-gray-600"}>{t("taxNoData")}</p>
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
>>>>>>> f583c72d80290b5baa389a3b9e8f0f04b577baca
