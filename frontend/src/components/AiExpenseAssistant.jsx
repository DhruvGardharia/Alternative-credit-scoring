import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";
import { sendMessageToAI, generateSmartSuggestions } from "../services/aiExpenseService";

// ── Icons ────────────────────────────────────────────────────────────────────
const SparkleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ── Smart Suggestions Strip ───────────────────────────────────────────────────
export function SmartSuggestionsStrip({ expenseContext }) {
  const { isDark } = useTheme();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stripError, setStripError] = useState(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (!expenseContext || fetched.current) return;
    fetched.current = true;
    setLoading(true);
    generateSmartSuggestions(expenseContext)
      .then((s) => {
        setSuggestions(s);
        if (!s.length) setStripError("Grok returned no suggestions. Check VITE_GROK_API_KEY in .env and restart dev server.");
      })
      .catch((e) => setStripError(e.message || "Failed to load AI suggestions — check your Grok API key."))
      .finally(() => setLoading(false));
  }, [expenseContext]);

  if (!loading && suggestions.length === 0 && !stripError) return null;

  return (
    <div
      className={`rounded-xl border px-5 py-4 mb-6 ${
        isDark ? "bg-indigo-950/40 border-indigo-800" : "bg-indigo-50 border-indigo-200"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <SparkleIcon />
        <span
          className={`text-xs font-bold uppercase tracking-widest ${
            isDark ? "text-indigo-300" : "text-indigo-700"
          }`}
        >
          AI Smart Suggestions
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2">
          <div
            className={`w-4 h-4 rounded-full border-2 border-t-transparent animate-spin ${
              isDark ? "border-indigo-400" : "border-indigo-600"
            }`}
          />
          <span className={`text-xs ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>
            Analysing your spending…
          </span>
        </div>
      ) : stripError ? (
        <p className={`text-xs ${isDark ? "text-red-400" : "text-red-600"}`}>
          ⚠️ {stripError}
        </p>
      ) : (
        <ul className="space-y-2">
          {suggestions.map((s, i) => (
            <li key={i} className="flex items-start gap-2">
              <span
                className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                  isDark
                    ? "bg-indigo-800 text-indigo-200"
                    : "bg-indigo-200 text-indigo-800"
                }`}
              >
                {i + 1}
              </span>
              <span className={`text-sm leading-snug ${isDark ? "text-indigo-100" : "text-indigo-900"}`}>
                {s}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Floating AI Chat Widget ───────────────────────────────────────────────────
export default function AiExpenseAssistant({ expenses }) {
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [expenseContext, setExpenseContext] = useState(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [messages, setMessages] = useState([]);  // {role, text, loading?}
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const contextFetched = useRef(false);

  const hasKey = true; // AI key is server-side, always attempt

  // Fetch AI context from backend once
  const fetchContext = useCallback(async () => {
    if (contextFetched.current) return;
    contextFetched.current = true;
    setContextLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("/api/expenses/ai-context", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setExpenseContext(data?.context || null);
    } catch {
      setExpenseContext(null);
    } finally {
      setContextLoading(false);
    }
  }, []);

  // Auto-greet when opened
  useEffect(() => {
    if (!open || messages.length > 0 || !hasKey) return;
    fetchContext().then(async () => {
      const greeting = contextFetched.current
        ? "Hi! I'm FinBot 🤖 — your personal AI expense analyst. I've reviewed your spending data. Ask me anything like *\"Where am I overspending?\"* or *\"How can I save more?\"*"
        : "Hi! I'm FinBot 🤖 — your personal AI expense analyst. It looks like there are no expenses yet. Add some and I'll give you insights!";
      setMessages([{ role: "model", text: greeting }]);
    });
  }, [open, hasKey, fetchContext, messages.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendDirect = async (userText) => {
    if (!userText.trim() || sending) return;
    setInput("");
    setError(null);

    const newHistory = [...messages, { role: "user", text: userText }];
    setMessages([...newHistory, { role: "model", text: "", loading: true }]);
    setSending(true);

    try {
      const reply = await sendMessageToAI(
        newHistory.filter((m) => !m.loading),
        userText,
        expenseContext,
      );
      setMessages([...newHistory, { role: "model", text: reply }]);
    } catch (err) {
      setError(err.message || "Failed to get AI response");
      setMessages(newHistory);
    } finally {
      setSending(false);
    }
  };

  const sendMessage = () => sendDirect(input);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const QUICK_PROMPTS = [
    "Where am I overspending?",
    "How can I reduce expenses?",
    "What's my spending pattern?",
    "Give me a budget plan",
  ];

  if (!hasKey) return null;

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          open
            ? "bg-red-500 hover:bg-red-600 rotate-45"
            : isDark
            ? "bg-indigo-600 hover:bg-indigo-500"
            : "bg-indigo-700 hover:bg-indigo-600"
        } text-white`}
        title="AI Expense Assistant"
        aria-label="Toggle AI assistant"
      >
        {open ? <CloseIcon /> : <SparkleIcon />}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className={`fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-24px)] rounded-2xl shadow-2xl flex flex-col overflow-hidden border transition-all duration-300 ${
            isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
          }`}
          style={{ height: 500 }}
        >
          {/* Header */}
          <div
            className={`px-4 py-3 flex items-center gap-3 ${
              isDark
                ? "bg-indigo-900/60 border-b border-indigo-800"
                : "bg-indigo-700 border-b border-indigo-600"
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
              <SparkleIcon />
            </div>
            <div>
              <p className="text-sm font-bold text-white">FinBot</p>
              <p className="text-xs text-indigo-200">AI Expense Analyst · Powered by Gemini</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="ml-auto text-indigo-200 hover:text-white transition"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {contextLoading && messages.length === 0 && (
              <div className="flex justify-center">
                <div
                  className={`w-5 h-5 rounded-full border-2 border-t-transparent animate-spin ${
                    isDark ? "border-indigo-400" : "border-indigo-600"
                  }`}
                />
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? isDark
                        ? "bg-indigo-600 text-white rounded-br-none"
                        : "bg-indigo-700 text-white rounded-br-none"
                      : isDark
                      ? "bg-gray-800 text-gray-100 rounded-bl-none"
                      : "bg-gray-100 text-gray-900 rounded-bl-none"
                  }`}
                >
                  {msg.loading ? (
                    <div className="flex items-center gap-1 py-1">
                      {[0, 1, 2].map((j) => (
                        <div
                          key={j}
                          className={`w-2 h-2 rounded-full animate-bounce ${
                            isDark ? "bg-indigo-400" : "bg-gray-400"
                          }`}
                          style={{ animationDelay: `${j * 0.15}s` }}
                        />
                      ))}
                    </div>
                  ) : (
                    // Render markdown-style bold (**text**) and newlines
                    msg.text.split("\n").map((line, li) => (
                      <p key={li} className={li > 0 ? "mt-1" : ""}>
                        {line.split(/(\*\*.*?\*\*)/).map((part, pi) =>
                          part.startsWith("**") && part.endsWith("**") ? (
                            <strong key={pi}>{part.slice(2, -2)}</strong>
                          ) : (
                            part
                          ),
                        )}
                      </p>
                    ))
                  )}
                </div>
              </div>
            ))}

            {error && (
              <div className="text-xs text-red-400 text-center px-2">{error}</div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts (only when no messages yet or just the greeting) */}
          {messages.length <= 1 && !sending && (
            <div className="px-4 pb-2 flex flex-wrap gap-1">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendDirect(q)}
                  className={`text-xs px-2 py-1 rounded-full border transition ${
                    isDark
                      ? "border-indigo-700 text-indigo-300 hover:bg-indigo-900"
                      : "border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input row */}
          <div
            className={`px-3 py-3 flex items-end gap-2 border-t ${
              isDark ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-gray-50"
            }`}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about your spending…"
              rows={1}
              className={`flex-1 resize-none rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                isDark
                  ? "bg-gray-800 text-gray-100 border border-gray-700 placeholder-gray-500"
                  : "bg-white text-gray-900 border border-gray-300 placeholder-gray-400"
              }`}
              style={{ maxHeight: 100 }}
            />
            <button
              onClick={() => {
                // send using current input state via explicit call
                if (!input.trim() || sending) return;
                sendMessage();
              }}
              disabled={!input.trim() || sending}
              className="w-9 h-9 flex-shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
