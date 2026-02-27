/**
 * aiExpenseService.js
 * Proxies all AI calls through /api/ai/chat (backend) to avoid CORS and keep the key server-side.
 */

import axios from "axios";

/**
 * Build a rich system prompt with the user's real spending data.
 */
export function buildSystemPrompt(ctx) {
  if (!ctx) {
    return `You are FinBot, a friendly AI financial assistant in an expense tracker app.
The user has no expenses yet. Encourage them to start tracking and ask how you can help.`;
  }

  const topCategories = ctx.categoryBreakdown
    .slice(0, 5)
    .map((c) => `  • ${c.category}: ₹${c.amount.toLocaleString("en-IN")} (${c.percentage}%)`)
    .join("\n");

  const trend = ctx.monthlyTrend
    .map((m) => `  ${m.month}: ₹${m.amount.toLocaleString("en-IN")}`)
    .join("\n");

  const recent = ctx.recentTransactions
    .slice(0, 5)
    .map((t) => `  • ₹${t.amount} on ${t.category} — "${t.description || "no note"}" (${t.date})`)
    .join("\n");

  return `You are FinBot, a friendly personal finance AI assistant in a gig-worker expense tracker app.

USER SPENDING DATA (use this to give personalised advice):
Total Spent: ₹${ctx.totalAmount.toLocaleString("en-IN")} across ${ctx.totalTransactions} transactions
Period: ${ctx.dateRange.from} to ${ctx.dateRange.to}
Avg Transaction: ₹${ctx.avgTransactionAmount.toLocaleString("en-IN")}

Top Categories:
${topCategories}

Monthly Trend (last 6 months):
${trend}

Recent Transactions:
${recent}

RULES:
- Give concise, actionable, personalised advice based on the data above
- Always use ₹ (Indian Rupees)
- Keep replies under 150 words
- Be warm, clear and encouraging
- If unrelated to finance, politely redirect`;
}

/**
 * Call our backend proxy which forwards to Grok.
 */
async function callAI(messages) {
  const token = localStorage.getItem("token");
  const { data } = await axios.post(
    "/api/ai/chat",
    { messages },
    { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  );
  if (!data.success || !data.text) throw new Error("No response from AI");
  return data.text;
}

/**
 * Send a multi-turn chat message.
 */
export async function sendMessageToAI(conversationHistory, userMessage, expenseContext) {
  const systemPrompt = buildSystemPrompt(expenseContext);

  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory
      .slice(-8)
      .filter((m) => !m.loading && m.text)
      .map((m) => ({
        role: m.role === "model" ? "assistant" : "user",
        content: m.text,
      })),
    { role: "user", content: userMessage },
  ];

  return callAI(messages);
}

/**
 * Generate 3 smart spending suggestions.
 */
export async function generateSmartSuggestions(expenseContext) {
  if (!expenseContext) return [];

  const messages = [
    { role: "system", content: buildSystemPrompt(expenseContext) },
    {
      role: "user",
      content: `Based on the spending data above, generate exactly 3 short, specific, actionable money-saving suggestions (max 12 words each).
Return ONLY a JSON array of strings, no markdown, no explanation.
Example: ["Reduce food spend by 20%", "Set ₹500 entertainment cap", "Switch to UPI for cashback"]`,
    },
  ];

  const raw = await callAI(messages);
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
  } catch {
    // If not valid JSON, return the raw text as one item
    return [raw.slice(0, 100)];
  }
}
