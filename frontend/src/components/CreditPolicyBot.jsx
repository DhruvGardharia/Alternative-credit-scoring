import { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

const NAVBAR_HEIGHT = 52;

const CreditPolicyBot = () => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef(null);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && chatHistory.length === 0) {
      setChatHistory([
        {
          type: "bot",
          message:
            "Hello. I am your Credit Intelligence Assistant. Ask me about credit policies, loan eligibility, risk levels, or tax guidance.",
        },
      ]);
    }
  };

  const toggleMaximize = () => setIsMaximized(!isMaximized);

  const typeMessage = (text, onUpdate, onDone) => {
    let i = 0;
    const interval = setInterval(() => {
      onUpdate(text.slice(0, i));
      i++;
      if (i > text.length) {
        clearInterval(interval);
        onDone(text);
      }
    }, 15);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input;
    setInput("");
    setLoading(true);
    setChatHistory((prev) => [...prev, { type: "user", message: userMessage }]);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "AI Error");

      setChatHistory((prev) => [
        ...prev,
        { type: "bot", message: "", confidence: data.confidence, typing: true },
      ]);

      typeMessage(
        data.reply,
        (partial) => {
          setChatHistory((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { type: "bot", message: partial, confidence: data.confidence, typing: true };
            return updated;
          });
        },
        (full) => {
          setChatHistory((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { type: "bot", message: full, confidence: data.confidence, typing: false };
            return updated;
          });
          setLoading(false);
        }
      );
    } catch (error) {
      setChatHistory((prev) => [
        ...prev,
        { type: "bot", message: error.message || "Unable to process request." },
      ]);
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const windowClasses = isMaximized
    ? `fixed inset-x-0 bottom-0 flex flex-col border-0 z-40 ${isDark ? "bg-gray-900" : "bg-white"}`
    : `fixed bottom-20 right-6 w-96 rounded-2xl shadow-2xl flex flex-col z-50 border ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`;

  const windowStyle = isMaximized
    ? { top: NAVBAR_HEIGHT }
    : { height: `min(600px, calc(100vh - ${NAVBAR_HEIGHT + 88}px))` };

  return (
    <>
      {/* Floating Button */}
      {!isMaximized && (
        <button
          onClick={toggleChat}
          className="fixed bottom-8 right-6 w-14 h-14 rounded-full shadow-xl flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 text-white z-50"
        >
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-blue-900 text-xs font-bold">?</span>
              </span>
            </>
          )}
        </button>
      )}

      {/* Chat Window */}
      {(isOpen || isMaximized) && (
        <div className={windowClasses} style={windowStyle}>

          {/* Header */}
          <div className={`bg-blue-900 text-white p-4 flex items-center justify-between flex-shrink-0 ${isMaximized ? "" : "rounded-t-2xl"}`}>
            <div>
              <h3 className="font-semibold text-sm">Credit Intelligence Assistant</h3>
              <p className="text-xs text-blue-200">Policy-Grounded • Secure • Thread Aware</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleMaximize} className="text-white hover:text-yellow-400 transition p-1" title={isMaximized ? "Minimize" : "Maximize"}>
                {isMaximized ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0h5m-5 0v5M15 9l5-5m0 0h-5m5 0v5M9 15l-5 5m0 0h5m-5 0v-5M15 15l5 5m0 0h-5m5 0v-5" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
              </button>
              <button onClick={() => { setIsOpen(false); setIsMaximized(false); }} className="text-white hover:text-red-400 transition p-1" title="Close">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-3 min-h-0 ${isDark ? "bg-gray-950" : "bg-gray-50"}`}>
            <div className={isMaximized ? "max-w-3xl mx-auto w-full space-y-3" : "space-y-3"}>
              {chatHistory.map((msg, index) => (
                <MessageBubble key={index} msg={msg} isDark={isDark} />
              ))}
              {loading && chatHistory[chatHistory.length - 1]?.type !== "bot" && (
                <LoadingDots isDark={isDark} />
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className={`p-3 border-t flex gap-2 flex-shrink-0 ${isMaximized ? "" : "rounded-b-2xl"} ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className={`flex gap-2 w-full ${isMaximized ? "max-w-3xl mx-auto" : ""}`}>
              <input
                type="text"
                placeholder="Ask about loan eligibility, risk level..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 ${
                  isDark
                    ? "bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                }`}
              />
              <button
                onClick={sendMessage}
                disabled={loading}
                className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 transition"
              >
                Send
              </button>
            </div>
          </div>

        </div>
      )}
    </>
  );
};

const MessageBubble = ({ msg, isDark }) => (
  <div className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
    <div
      className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
        msg.type === "user"
          ? "bg-blue-900 text-white rounded-br-none"
          : isDark
          ? "bg-gray-800 border border-gray-700 text-gray-100 rounded-bl-none shadow-sm"
          : "bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm"
      }`}
    >
      <div className="whitespace-pre-wrap leading-relaxed">
        {msg.message.split('\n').map((line, i) => (
          <p key={i} className={line.trim() === '' ? 'mt-2' : 'mb-1'}>{line}</p>
        ))}
        {msg.typing && (
          <span className={`inline-block w-2 h-4 ml-1 animate-pulse ${isDark ? "bg-gray-500" : "bg-gray-400"}`} />
        )}
      </div>
      {msg.type === "bot" && msg.confidence && !msg.typing && (
        <div className={`mt-2 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          Confidence: {(msg.confidence * 100).toFixed(1)}%
        </div>
      )}
    </div>
  </div>
);

const LoadingDots = ({ isDark }) => (
  <div className="flex justify-start">
    <div className={`rounded-2xl rounded-bl-none shadow-sm px-4 py-3 text-sm flex gap-1 items-center border ${
      isDark ? "bg-gray-800 border-gray-700 text-gray-400" : "bg-white border-gray-200 text-gray-500"
    }`}>
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  </div>
);

export default CreditPolicyBot;
