import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { toast } from "react-toastify"


export default function ExpenseTracker() {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [viewReady, setViewReady] = useState(false);
  const [refetch, setRefetch] = useState(0);

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
  }, [t, refetch]);

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

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const CATEGORIES = [
    "food",
    "transport",
    "utilities",
    "rent",
    "healthcare",
    "entertainment",
    "education",
    "other",
  ];
  const PAYMENT_METHODS = ["cash", "card", "upi", "wallet"];

  const handleDeleteExpense = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const authConfig = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : undefined;
      await axios.delete(`/api/expenses/${id}`, authConfig);
      setRefetch((prev) => prev + 1);
    } catch (err) {
      console.error("ExpenseTracker delete error", err);
    }
  };

  const startEdit = (expense) => {
    setEditingId(expense._id);
    setEditForm({
      category: expense.category || "other",
      amount: expense.amount ?? "",
      description: expense.description || "",
      date: expense.date
        ? new Date(expense.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      paymentMethod: expense.paymentMethod || "cash",
      otherNote: expense.otherNote || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const authConfig = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : undefined;
      const payload = {
        category: editForm.category,
        amount: Number(editForm.amount),
        description:
          editForm.category === "other" && editForm.otherNote
            ? editForm.otherNote
            : editForm.description,
        date: editForm.date,
        paymentMethod: editForm.paymentMethod,
      };
      await axios.put(`/api/expenses/${id}`, payload, authConfig);
      toast.success("Expense updated!")
      setEditingId(null);
      setEditForm({});
      setRefetch((prev) => prev + 1);
    } catch (err) {
      console.error("ExpenseTracker edit error", err);
      toast.error("Error updating expense: " + (err?.response?.data?.message || err.message));
    }
  };

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
          {/* Back to Dashboard */}
          <button
            onClick={() => navigate("/dashboard")}
            className={`flex items-center gap-1 text-sm font-medium mb-2 transition ${
              isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-900 hover:text-blue-700"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>

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

              {/* ── AI Expense Insights ── */}
              {expenseInsights.length > 0 ? (
                <div className={`rounded-xl border shadow-sm p-6 ${panelSurfaceClass} ${interactiveBaseClass} delay-300`}>
                  {/* Header with score badge */}
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-widest ${subtleTextClass}`}>
                        AI Expense Insights
                      </p>
                      <p className={`text-sm font-semibold mt-0.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                        Powered by your financial behavior
                      </p>
                    </div>
                    {/* Health score badge */}
                    <div className={`flex-shrink-0 flex flex-col items-center px-4 py-2 rounded-xl ${
                      expenseInsights.length === 1
                        ? isDark ? "bg-green-900/30 text-green-300" : "bg-green-50 text-green-700"
                        : expenseInsights.length === 2
                        ? isDark ? "bg-yellow-900/30 text-yellow-300" : "bg-yellow-50 text-yellow-700"
                        : isDark ? "bg-red-900/30 text-red-300" : "bg-red-50 text-red-700"
                    }`}>
                      <span className="text-2xl font-black">
                        {expenseInsights.length === 1 ? "A" : expenseInsights.length === 2 ? "B" : "C"}
                      </span>
                      <span className="text-xs font-semibold mt-0.5">Health</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className={`w-full h-1.5 rounded-full mb-5 overflow-hidden ${
                    isDark ? "bg-gray-700" : "bg-gray-200"
                  }`}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: expenseInsights.length === 1 ? "85%" : expenseInsights.length === 2 ? "55%" : "30%",
                        background: expenseInsights.length === 1
                          ? "linear-gradient(90deg,#10b981,#34d399)"
                          : expenseInsights.length === 2
                          ? "linear-gradient(90deg,#f59e0b,#fbbf24)"
                          : "linear-gradient(90deg,#ef4444,#f87171)",
                      }}
                    />
                  </div>

                  {/* Insight cards */}
                  <ul className="space-y-3">
                    {expenseInsights.map((insight, idx) => {
                      const isHighSpend = insight.includes("accounts for");
                      const isTrend = insight.includes("grew by");
                      const isSavings = insight.includes("income");
                      const isDiscretionary = insight.includes("Discretionary");

                      const iconColor = isHighSpend
                        ? "bg-red-500"
                        : isTrend
                        ? "bg-orange-500"
                        : isSavings
                        ? "bg-purple-500"
                        : "bg-blue-500";

                      const icon = isHighSpend ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      ) : isTrend ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                      ) : isSavings ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                      );

                      return (
                        <li
                          key={idx}
                          className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                            isDark ? "bg-gray-800/60 border-gray-700" : "bg-white border-gray-200"
                          }`}
                        >
                          <span className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-full ${iconColor} flex items-center justify-center`}>
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              {icon}
                            </svg>
                          </span>
                          <p className={`leading-relaxed pt-0.5 ${isDark ? "text-gray-200" : "text-gray-700"}`}>{insight}</p>
                        </li>
                      );
                    })}
                  </ul>

                  <p className={`mt-4 text-xs ${subtleTextClass}`}>
                    ✦ Insights are generated from your transaction patterns. Review monthly for best results.
                  </p>
                </div>
              ) : filteredExpenses.length > 0 ? (
                <div className={`rounded-xl border shadow-sm p-6 ${panelSurfaceClass} text-center`}>
                  <div className="text-3xl mb-2">🎉</div>
                  <p className={`font-semibold ${isDark ? "text-green-300" : "text-green-700"}`}>Your spending looks healthy!</p>
                  <p className={`text-xs mt-1 ${subtleTextClass}`}>No anomalies detected. Keep tracking to unlock deeper insights.</p>
                </div>
              ) : null}
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
            <div className="space-y-3">
                {filteredExpenses.map((expense) => {
                  const cat = (expense.category || "general").toLowerCase();
                  let iconPath = (
                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  );
                  if (cat.includes("food") || cat.includes("dining") || cat.includes("restaurant")) {
                    iconPath = (<path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />);
                  } else if (cat.includes("transport") || cat.includes("travel") || cat.includes("fuel") || cat.includes("uber")) {
                    iconPath = (<path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />);
                  } else if (cat.includes("health") || cat.includes("medical") || cat.includes("pharmacy")) {
                    iconPath = (<path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />);
                  } else if (cat.includes("entertainment") || cat.includes("movie") || cat.includes("sport")) {
                    iconPath = (<path d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />);
                  } else if (cat.includes("utility") || cat.includes("bill") || cat.includes("electric") || cat.includes("internet")) {
                    iconPath = <path d="M13 10V3L4 14h7v7l9-11h-7z" />;
                  } else if (cat.includes("education") || cat.includes("school") || cat.includes("college")) {
                    iconPath = (<path d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />);
                  } else if (cat.includes("shopping") || cat.includes("cloth") || cat.includes("apparel")) {
                    iconPath = (<path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />);
                  }

                  const isEditing = editingId === expense._id;

                  return (
                    <div
                      key={expense._id || `${expense.date}-${expense.amount}`}
                      className={`rounded-lg border-l-4 border-blue-900 transition ${isDark ? "bg-gray-800" : "bg-gray-50"}`}
                    >
                      {/* Normal row */}
                      {!isEditing && (
                        <div className="flex items-center justify-between p-3 hover:shadow-md">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? "bg-blue-900/40" : "bg-blue-100"}`}
                            >
                              <svg
                                className={`w-5 h-5 ${isDark ? "text-blue-400" : "text-blue-900"}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                {iconPath}
                              </svg>
                            </div>
                            <div>
                              <div
                                className={`font-semibold capitalize text-sm ${isDark ? "text-blue-400" : "text-blue-900"}`}
                              >
                                {expense.category || t("expenseTrackerUnknownCategory") || "General"}
                              </div>
                              <div
                                className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
                              >
                                {expense.description ? `${expense.description} • ` : ""}
                                {expense.date
                                  ? new Date(expense.date).toLocaleDateString("en-IN", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : t("expenseTrackerNoDate") || "Date unavailable"}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-right">
                              <div className="text-lg font-bold text-red-500">
                                -₹
                                {typeof expense.amount === "number"
                                  ? expense.amount.toLocaleString("en-IN")
                                  : t("expenseTrackerNoAmount") || "N/A"}
                              </div>
                              {expense.paymentMethod && (
                                <div
                                  className={`text-xs uppercase ${isDark ? "text-gray-500" : "text-gray-500"}`}
                                >
                                  {expense.paymentMethod}
                                </div>
                              )}
                            </div>
                            {/* Edit button */}
                            <button
                              onClick={() => startEdit(expense)}
                              className={`p-2 rounded-lg transition ${
                                isDark
                                  ? "bg-blue-900/30 hover:bg-blue-700 text-blue-400"
                                  : "bg-blue-100 hover:bg-blue-600 hover:text-white text-blue-600"
                              }`}
                              title="Edit expense"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            {/* Delete button */}
                            <button
                              onClick={() => handleDeleteExpense(expense._id)}
                              className="p-2 bg-red-100 hover:bg-red-600 hover:text-white text-red-600 rounded-lg transition"
                              title="Delete expense"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Inline edit form */}
                      {isEditing && (
                        <div className={`p-4 border-t-2 border-yellow-400 ${isDark ? "bg-gray-900" : "bg-white"} rounded-b-lg`}>
                          <p className={`text-xs font-bold uppercase mb-3 ${isDark ? "text-yellow-400" : "text-yellow-600"}`}>
                            Editing Expense
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Category */}
                            <div>
                              <label className={`block text-xs font-semibold mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Category</label>
                              <select
                                value={editForm.category}
                                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none text-sm ${isDark ? "bg-gray-800 border-blue-800 text-gray-300 focus:border-blue-500" : "border-blue-200 text-gray-700 focus:border-blue-900"}`}
                              >
                                {CATEGORIES.map((cat) => (
                                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                                ))}
                              </select>
                            </div>
                            {/* Amount */}
                            <div>
                              <label className={`block text-xs font-semibold mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Amount (₹)</label>
                              <input
                                type="number"
                                min="1"
                                value={editForm.amount}
                                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                                className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none text-sm ${isDark ? "bg-gray-800 border-blue-800 text-gray-300 focus:border-blue-500" : "border-blue-200 text-gray-700 focus:border-blue-900"}`}
                              />
                            </div>
                            {/* Date */}
                            <div>
                              <label className={`block text-xs font-semibold mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Date</label>
                              <input
                                type="date"
                                value={editForm.date}
                                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none text-sm ${isDark ? "bg-gray-800 border-blue-800 text-gray-300 focus:border-blue-500" : "border-blue-200 text-gray-700 focus:border-blue-900"}`}
                              />
                            </div>
                            {/* Payment Method */}
                            <div>
                              <label className={`block text-xs font-semibold mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Payment Method</label>
                              <select
                                value={editForm.paymentMethod}
                                onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                                className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none text-sm ${isDark ? "bg-gray-800 border-blue-800 text-gray-300 focus:border-blue-500" : "border-blue-200 text-gray-700 focus:border-blue-900"}`}
                              >
                                {PAYMENT_METHODS.map((m) => (
                                  <option key={m} value={m}>{m.toUpperCase()}</option>
                                ))}
                              </select>
                            </div>
                            {/* Description */}
                            <div className="md:col-span-2">
                              <label className={`block text-xs font-semibold mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Description</label>
                              <input
                                type="text"
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none text-sm ${isDark ? "bg-gray-800 border-blue-800 text-gray-300 focus:border-blue-500" : "border-blue-200 text-gray-700 focus:border-blue-900"}`}
                                placeholder="Optional description"
                              />
                            </div>
                            {/* Other note — only when category is 'other' */}
                            {editForm.category === "other" && (
                              <div className="md:col-span-2">
                                <label className={`block text-xs font-semibold mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                  Note (describe the other expense)
                                </label>
                                <input
                                  type="text"
                                  value={editForm.otherNote}
                                  onChange={(e) => setEditForm({ ...editForm, otherNote: e.target.value })}
                                  className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none text-sm ${isDark ? "bg-gray-800 border-yellow-700 text-gray-300 focus:border-yellow-500" : "border-yellow-300 text-gray-700 focus:border-yellow-500"}`}
                                  placeholder="E.g. Gift, donation, misc…"
                                />
                              </div>
                            )}
                            {/* Actions */}
                            <div className="md:col-span-2 flex gap-3 mt-1">
                              <button
                                onClick={() => handleSaveEdit(expense._id)}
                                className="flex-1 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-medium text-sm transition"
                              >
                                Save Changes
                              </button>
                              <button
                                onClick={cancelEdit}
                                className={`flex-1 py-2 rounded-lg font-medium text-sm transition ${isDark ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
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
