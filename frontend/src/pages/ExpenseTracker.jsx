import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

export default function ExpenseTracker() {
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [viewReady, setViewReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const fetchExpenses = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const authConfig = token
          ? { headers: { Authorization: `Bearer ${token}` } }
          : undefined;
        const response = await axios.get("/api/expenses", authConfig);
        if (ignore) return;
        console.log("ExpenseTracker fetch response.data", response.data);
        console.log(
          "ExpenseTracker typeof response.data",
          typeof response.data,
        );
        console.log(
          "ExpenseTracker Array.isArray(response.data)",
          Array.isArray(response.data),
        );
        const candidateCollections = [
          response?.data?.expenses,
          response?.data?.data?.expenses,
          response?.data?.data,
          response?.data,
        ];
        const normalizedExpenses =
          candidateCollections.find((entry) => Array.isArray(entry)) || [];
        setExpenses(normalizedExpenses);
        console.log(
          "ExpenseTracker records fetched",
          normalizedExpenses.length,
        );
        setError(null);
      } catch (err) {
        if (ignore) return;
        setError(err?.response?.data?.error || t("expenseTrackerFetchError"));
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchExpenses();

    return () => {
      ignore = true;
    };
  }, [t]);

  useEffect(() => {
    const timer = setTimeout(() => setViewReady(true), 80);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleWindowError = (event) => {
      console.error(
        "ExpenseTracker window error",
        event?.error || event?.message,
        event,
      );
    };
    window.addEventListener("error", handleWindowError);
    return () => window.removeEventListener("error", handleWindowError);
  }, []);

  const panelSurfaceClass = useMemo(
    () => (isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"),
    [isDark],
  );
  const subtleTextClass = useMemo(
    () => (isDark ? "text-gray-400" : "text-gray-600"),
    [isDark],
  );
  const transitionBaseClass = "transition-all duration-700 ease-out";
  const revealBaseClass = useMemo(
    () => (viewReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"),
    [viewReady],
  );
  const interactiveBaseClass = useMemo(
    () =>
      `${transitionBaseClass} ${revealBaseClass} transform hover:scale-[1.01] hover:shadow-lg`,
    [revealBaseClass],
  );
  const summaryCardDelays = ["delay-0", "delay-100", "delay-200"];
  const chartDelays = ["delay-0", "delay-150"];

  const monthOptions = useMemo(() => {
    const labels = new Set();
    expenses.forEach((expense) => {
      const sourceDate = expense?.date || expense?.createdAt;
      if (sourceDate) {
        const label = new Date(sourceDate).toLocaleString("en-IN", {
          month: "long",
          year: "numeric",
        });
        labels.add(label);
      }
    });
    return ["all", ...Array.from(labels)];
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    if (selectedMonth === "all") return expenses;
    return expenses.filter((expense) => {
      const sourceDate = expense?.date || expense?.createdAt;
      if (!sourceDate) return false;
      const label = new Date(sourceDate).toLocaleString("en-IN", {
        month: "long",
        year: "numeric",
      });
      return label === selectedMonth;
    });
  }, [expenses, selectedMonth]);

  const summaryStats = useMemo(() => {
    if (filteredExpenses.length === 0) {
      return {
        total: 0,
        averageDaily: 0,
        topCategory: {
          name: t("expenseTrackerUnknownCategory") || "General",
          amount: 0,
        },
        dominantShare: 0,
      };
    }

    const total = filteredExpenses.reduce(
      (sum, expense) => sum + (Number(expense.amount) || 0),
      0,
    );

    const dayKeys = new Set(
      filteredExpenses
        .map((expense) => expense?.date || expense?.createdAt)
        .filter(Boolean)
        .map((value) => new Date(value).toDateString()),
    );

    const averageDaily = dayKeys.size > 0 ? total / dayKeys.size : total;

    const categoryMap = filteredExpenses.reduce((acc, expense) => {
      const key =
        expense?.category || t("expenseTrackerUnknownCategory") || "General";
      acc[key] = (acc[key] || 0) + (Number(expense.amount) || 0);
      return acc;
    }, {});

    const topCategoryEntry = Object.entries(categoryMap).sort(
      (a, b) => b[1] - a[1],
    )[0];

    return {
      total,
      averageDaily,
      topCategory: {
        name:
          topCategoryEntry?.[0] ||
          t("expenseTrackerUnknownCategory") ||
          "General",
        amount: topCategoryEntry?.[1] || 0,
      },
      dominantShare: total > 0 ? (topCategoryEntry?.[1] || 0) / total : 0,
    };
  }, [filteredExpenses, t]);

  const executiveSummary = useMemo(() => {
    const amount = summaryStats.total.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    });
    const sharePercent = `${Math.round(summaryStats.dominantShare * 100)}%`;
    const daily = summaryStats.averageDaily.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
    return (
      t("expenseTrackerExecutiveSummary") ||
      `This month you spent ${amount}, primarily on ${summaryStats.topCategory.name}, accounting for ${sharePercent} of total expenses. Your daily average is ${daily}.`
    );
  }, [summaryStats, t]);

  const generateExpenseInsights = (expensesList) => {
    const insights = [];
    if (!expensesList.length || summaryStats.total === 0) {
      return insights;
    }

    const total = summaryStats.total;

    const categoryTotals = expensesList.reduce((acc, expense) => {
      const key =
        expense?.category || t("expenseTrackerUnknownCategory") || "General";
      acc[key] = (acc[key] || 0) + (Number(expense.amount) || 0);
      return acc;
    }, {});

    const [topCategory, topValue] =
      Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || [];
    if (topValue / total > 0.4) {
      insights.push(
        t("expenseInsightHighCategory") ||
          `${topCategory} accounts for ${Math.round((topValue / total) * 100)}% of your spend. Consider rebalancing to avoid overexposure.`,
      );
    }

    const monthBuckets = expensesList.reduce((acc, expense) => {
      const sourceDate = expense?.date || expense?.createdAt;
      if (!sourceDate) return acc;
      const dt = new Date(sourceDate);
      const key = dt.getFullYear() * 100 + dt.getMonth();
      acc[key] = (acc[key] || 0) + (Number(expense.amount) || 0);
      return acc;
    }, {});
    const sortedMonths = Object.keys(monthBuckets)
      .map(Number)
      .sort((a, b) => a - b);
    if (sortedMonths.length >= 2) {
      const last = monthBuckets[sortedMonths[sortedMonths.length - 1]];
      const prev = monthBuckets[sortedMonths[sortedMonths.length - 2]];
      if (prev > 0 && last > prev * 1.15) {
        insights.push(
          t("expenseInsightMoM") ||
            `Spending grew by ${Math.round(((last - prev) / prev) * 100)}% month over month. Investigate recent outflows.`,
        );
      }
    }

    const discretionaryCategories = [
      "entertainment",
      "lifestyle",
      "shopping",
      "travel",
    ];
    const discretionaryTotal = expensesList
      .filter((expense) =>
        discretionaryCategories.includes(
          (expense.category || "").toLowerCase(),
        ),
      )
      .reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
    if (discretionaryTotal / total > 0.3) {
      insights.push(
        t("expenseInsightDiscretionary") ||
          `Discretionary categories form ${Math.round((discretionaryTotal / total) * 100)}% of spending. Consider capping non-essential purchases.`,
      );
    }

    const incomeSum = expensesList.reduce(
      (sum, expense) => sum + (Number(expense.income) || 0),
      0,
    );
    if (incomeSum > 0) {
      const ratio = total / incomeSum;
      if (ratio > 0.6) {
        insights.push(
          t("expenseInsightSavings") ||
            `Expenses consume ${Math.round(ratio * 100)}% of income. Target a lower burn rate to improve savings.`,
        );
      }
    }

    return insights;
  };

  const expenseInsights = generateExpenseInsights(filteredExpenses);

  const categoryChartData = useMemo(() => {
    const categories = filteredExpenses.reduce((acc, expense) => {
      const label =
        expense?.category || t("expenseTrackerUnknownCategory") || "General";
      const value = Number(expense?.amount) || 0;
      acc[label] = (acc[label] || 0) + value;
      return acc;
    }, {});
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [filteredExpenses, t]);

  const monthlyTrendData = useMemo(() => {
    const monthMap = new Map();

    filteredExpenses.forEach((expense) => {
      const sourceDate = expense?.date || expense?.createdAt;
      if (!sourceDate) return;
      const dt = new Date(sourceDate);
      const sortKey = dt.getFullYear() * 100 + dt.getMonth();
      const label = dt.toLocaleString("en-IN", {
        month: "short",
        year: "numeric",
      });
      if (!monthMap.has(sortKey)) {
        monthMap.set(sortKey, {
          key: sortKey,
          month: label,
          expenses: 0,
          income: 0,
        });
      }
      const bucket = monthMap.get(sortKey);
      bucket.expenses += Number(expense.amount) || 0;
      const incomeValue = Number(
        expense.income || expense.monthlyIncome || expense.estimatedIncome,
      );
      if (!Number.isNaN(incomeValue) && incomeValue > 0) {
        bucket.income += incomeValue;
      }
    });

    return Array.from(monthMap.values())
      .sort((a, b) => a.key - b.key)
      .map((entry) => ({
        ...entry,
        savings:
          entry.income > 0
            ? Math.max(entry.income - entry.expenses, 0)
            : undefined,
      }));
  }, [filteredExpenses]);

  const hasIncomeContext = monthlyTrendData.some((entry) => entry.income > 0);
  const lineDataKey = hasIncomeContext ? "savings" : "expenses";
  const lineLabel = hasIncomeContext
    ? t("expenseTrackerSavingsTrend") || "Savings"
    : t("expenseTrackerExpenseTrend") || "Expense Trend";

  const chartColors = [
    "#2563eb",
    "#0ea5e9",
    "#10b981",
    "#f97316",
    "#a855f7",
    "#ec4899",
    "#f59e0b",
  ];

  console.log("ExpenseTracker render expenses length", expenses.length);
  console.log(
    "ExpenseTracker render filteredExpenses length",
    filteredExpenses.length,
  );
  console.log("ExpenseTracker render categoryChartData", categoryChartData);
  console.log("ExpenseTracker render monthlyTrendData", monthlyTrendData);

  try {
    if (loading) {
      return (
        <div
          className={`min-h-screen flex items-center justify-center ${isDark ? "bg-gray-950" : "bg-gray-50"}`}
        >
          <div className="text-center">
            <div
              className={`w-12 h-12 border-4 rounded-full animate-spin mx-auto ${isDark ? "border-blue-900 border-t-blue-400" : "border-blue-200 border-t-blue-600"}`}
            />
            <p
              className={`mt-4 text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              {t("expenseTrackerLoading")}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className={`min-h-screen ${isDark ? "bg-gray-950" : "bg-gray-50"}`}>
        <Navbar />
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
          <header
            className={`rounded-xl shadow-sm px-6 py-6 mb-8 ${panelSurfaceClass} flex flex-col gap-6 md:flex-row md:items-center md:justify-between`}
          >
            <div>
              <h1
                className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                {t("expenseTrackerTitle") || "Expense Tracker"}
              </h1>
              <p className={`text-sm mt-1 ${subtleTextClass}`}>
                {t("expenseTrackerSubtitle") ||
                  "Visual breakdown of your spending"}
              </p>
              <p className={`text-xs mt-3 ${subtleTextClass}`}>
                {executiveSummary}
              </p>
            </div>
            <div className="w-full md:w-80">
              <label
                className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-500"}`}
              >
                {t("expenseTrackerFilterLabel") || "Filter by month"}
              </label>
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  isDark
                    ? "bg-gray-950 border-gray-800 text-gray-100 focus:ring-blue-400"
                    : "bg-white border-gray-200 text-gray-900 focus:ring-blue-500"
                }`}
              >
                {monthOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "all"
                      ? t("expenseTrackerFilterAll") || "All"
                      : option}
                  </option>
                ))}
              </select>
            </div>
          </header>

          {error && (
            <div
              className={`rounded-xl shadow-sm border px-4 py-3 mb-8 text-sm ${isDark ? "bg-red-900/30 border-red-800 text-red-200" : "bg-red-50 border-red-200 text-red-800"}`}
            >
              {error}
            </div>
          )}

          <div
            className={`rounded-xl border shadow-sm px-6 py-6 mb-8 ${panelSurfaceClass}`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  label: t("expenseTrackerTotal") || "Total Expenses",
                  value: summaryStats.total.toLocaleString("en-IN", {
                    style: "currency",
                    currency: "INR",
                  }),
                  detail:
                    t("expenseTrackerTotalDetail") ||
                    "Combined amount for the selected range",
                },
                {
                  label: t("expenseTrackerAvgDaily") || "Average Daily Spend",
                  value: summaryStats.averageDaily.toLocaleString("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0,
                  }),
                  detail:
                    t("expenseTrackerAvgDailyDetail") ||
                    "Calculated from active spend days",
                },
                {
                  label: t("expenseTrackerTopCategory") || "Top Category",
                  value: summaryStats.topCategory.name,
                  detail: `${summaryStats.topCategory.amount.toLocaleString(
                    "en-IN",
                    {
                      style: "currency",
                      currency: "INR",
                    },
                  )}`,
                  isCategory: true,
                },
              ].map((card, index) => (
                <div
                  key={card.label}
                  className={`rounded-xl border shadow-sm p-5 ${panelSurfaceClass} ${interactiveBaseClass} ${summaryCardDelays[index]}`}
                >
                  <p
                    className={`text-xs font-semibold uppercase tracking-wide ${subtleTextClass}`}
                  >
                    {card.label}
                  </p>
                  <p
                    className={`text-2xl font-bold mt-2 ${isDark ? "text-blue-300" : "text-blue-900"}`}
                  >
                    {card.value}
                  </p>
                  <p
                    className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}
                  >
                    {card.isCategory ? (
                      <span
                        className={`inline-flex items-center gap-2 text-sm font-semibold ${
                          isDark ? "text-blue-200" : "text-blue-900"
                        }`}
                      >
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            isDark
                              ? "bg-blue-900/30 text-blue-100"
                              : "bg-blue-100 text-blue-900"
                          }`}
                        >
                          {card.value}
                        </span>
                        {card.detail}
                      </span>
                    ) : (
                      card.detail
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {filteredExpenses.length > 0 && (
            <div className="space-y-8 mb-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div
                  className={`rounded-xl border shadow-sm p-6 ${panelSurfaceClass} ${interactiveBaseClass} ${chartDelays[0]}`}
                  style={{ minHeight: 320 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p
                        className={`text-xs font-semibold uppercase tracking-wide ${subtleTextClass}`}
                      >
                        {t("expenseTrackerCategorySplit") ||
                          "Category Distribution"}
                      </p>
                      <p
                        className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        {t("expenseTrackerCategorySplitSub") ||
                          "Share of spending"}
                      </p>
                    </div>
                  </div>
                  {categoryChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? "#1f2937" : "#ffffff",
                            borderColor: isDark ? "#374151" : "#e5e7eb",
                            borderRadius: 12,
                          }}
                        />
                        <Pie
                          data={categoryChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                        >
                          {categoryChartData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={chartColors[index % chartColors.length]}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div
                      className={`h-40 flex items-center justify-center text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}
                    >
                      No category data available
                    </div>
                  )}
                </div>

                <div
                  className={`rounded-xl border shadow-sm p-6 ${panelSurfaceClass} ${interactiveBaseClass} ${chartDelays[1]}`}
                  style={{ minHeight: 320 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p
                        className={`text-xs font-semibold uppercase tracking-wide ${subtleTextClass}`}
                      >
                        {t("expenseTrackerCategoryComparison") ||
                          "Category Comparison"}
                      </p>
                      <p
                        className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        {t("expenseTrackerCategoryComparisonSub") ||
                          "Track top spend areas"}
                      </p>
                    </div>
                  </div>
                  {categoryChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={categoryChartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={isDark ? "#374151" : "#e5e7eb"}
                        />
                        <XAxis
                          dataKey="name"
                          tick={{
                            fill: isDark ? "#9ca3af" : "#4b5563",
                            fontSize: 12,
                          }}
                          angle={-15}
                          textAnchor="end"
                          height={50}
                        />
                        <YAxis
                          tick={{
                            fill: isDark ? "#9ca3af" : "#4b5563",
                            fontSize: 12,
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? "#1f2937" : "#ffffff",
                            borderColor: isDark ? "#374151" : "#e5e7eb",
                            borderRadius: 12,
                          }}
                        />
                        <Bar
                          dataKey="value"
                          radius={[8, 8, 0, 0]}
                          animationDuration={800}
                        >
                          {categoryChartData.map((_, index) => (
                            <Cell
                              key={`bar-${index}`}
                              fill={chartColors[index % chartColors.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div
                      className={`h-40 flex items-center justify-center text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}
                    >
                      No category comparison data
                    </div>
                  )}
                </div>
              </div>

              <div
                className={`rounded-xl border shadow-sm p-6 ${panelSurfaceClass} ${interactiveBaseClass} delay-200`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p
                      className={`text-xs font-semibold uppercase tracking-wide ${subtleTextClass}`}
                    >
                      {hasIncomeContext
                        ? t("expenseTrackerSavingsPrediction") ||
                          "Savings Prediction"
                        : t("expenseTrackerExpenseTrend") || "Expense Trend"}
                    </p>
                    <p
                      className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      {t("expenseTrackerTrendSubtitle") || "Monthly outlook"}
                    </p>
                  </div>
                </div>
                <div style={{ width: "100%", height: 300 }}>
                  {monthlyTrendData.length > 0 ? (
                    <ResponsiveContainer>
                      <LineChart data={monthlyTrendData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={isDark ? "#374151" : "#e5e7eb"}
                        />
                        <XAxis
                          dataKey="month"
                          tick={{
                            fill: isDark ? "#9ca3af" : "#4b5563",
                            fontSize: 12,
                          }}
                        />
                        <YAxis
                          tick={{
                            fill: isDark ? "#9ca3af" : "#4b5563",
                            fontSize: 12,
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? "#1f2937" : "#ffffff",
                            borderColor: isDark ? "#374151" : "#e5e7eb",
                            borderRadius: 12,
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey={lineDataKey}
                          name={lineLabel}
                          stroke="#2563eb"
                          strokeWidth={3}
                          dot={false}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div
                      className={`h-full flex items-center justify-center text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}
                    >
                      No trend data available
                    </div>
                  )}
                </div>
              </div>

              {expenseInsights.length > 0 && (
                <div
                  className={`rounded-xl border shadow-sm p-6 ${panelSurfaceClass} ${interactiveBaseClass} delay-300`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p
                        className={`text-xs font-semibold uppercase tracking-wide ${subtleTextClass}`}
                      >
                        {t("expenseTrackerInsightsTitle") ||
                          "AI Expense Insights"}
                      </p>
                      <p
                        className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        {t("expenseTrackerInsightsSubtitle") ||
                          "Recommendations tailored to your current spend"}
                      </p>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-3">
                    {expenseInsights.map((insight, index) => (
                      <li
                        key={`${insight}-${index}`}
                        className={`${transitionBaseClass} flex items-start gap-3 rounded-lg border px-4 py-3 text-sm transform ${
                          isDark
                            ? "bg-gray-800/60 border-gray-700 text-gray-100"
                            : "bg-gray-50 border-gray-200 text-gray-700"
                        } hover:-translate-y-0.5`}
                      >
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
                        <p className="leading-relaxed">{insight}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {filteredExpenses.length === 0 ? (
            <div
              className={`rounded-xl border shadow-sm p-8 mb-8 text-center ${
                isDark
                  ? "bg-gray-900 border-gray-800 text-gray-300"
                  : "bg-white border-gray-100 text-gray-600"
              }`}
            >
              {t("expenseTrackerEmpty") ||
                "No expenses recorded for this period."}
            </div>
          ) : (
            <div
              className={`rounded-xl border shadow-sm p-6 mb-8 ${panelSurfaceClass}`}
            >
              <div className="space-y-6">
                {filteredExpenses.map((expense) => (
                  <div
                    key={expense._id || `${expense.date}-${expense.amount}`}
                    className={`rounded-xl border p-4 flex items-center justify-between ${
                      isDark
                        ? "bg-gray-900 border-gray-800"
                        : "bg-white border-gray-100"
                    }`}
                  >
                    <div>
                      <p
                        className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        {expense.category ||
                          t("expenseTrackerUnknownCategory") ||
                          "General"}
                      </p>
                      <p
                        className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                      >
                        {expense.date
                          ? new Date(expense.date).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : t("expenseTrackerNoDate") || "Date unavailable"}
                      </p>
                    </div>
                    <p
                      className={`text-lg font-bold ${isDark ? "text-blue-300" : "text-blue-900"}`}
                    >
                      {typeof expense.amount === "number"
                        ? expense.amount.toLocaleString("en-IN", {
                            style: "currency",
                            currency: "INR",
                          })
                        : t("expenseTrackerNoAmount") || "N/A"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } catch (renderError) {
    console.error("ExpenseTracker render error", renderError);
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isDark ? "bg-gray-950" : "bg-gray-50"}`}
      >
        <div
          className={`text-sm font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}
        >
          Render Error Occurred
        </div>
      </div>
    );
  }
}
