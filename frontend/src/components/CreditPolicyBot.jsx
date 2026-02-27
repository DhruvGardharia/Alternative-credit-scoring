import { useState } from "react";

/**
 * Floating Chatbot Assistant Component
 * NO AI, NO BACKEND, NO API - Pure frontend educational assistant
 * Appears as floating icon in bottom-right corner
 */

const CreditPolicyBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState("sections"); // "sections" | "questions" | "answer"
  const [activeSection, setActiveSection] = useState(null);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);

  const qaData = {
    norms: {
      title: "Credit Norms",
      icon: "📊",
      color: "blue",
      questions: [
        {
          id: "norm1",
          question: "What is an alternative credit score?",
          answer: "An alternative credit score evaluates financial behavior such as income consistency, cash flow, and expense patterns instead of traditional credit history. This is especially useful for gig workers and freelancers who may not have established credit with banks or credit cards."
        },
        {
          id: "norm2",
          question: "Why is bank behavior used?",
          answer: "Gig workers often lack salary slips or credit history, so bank transaction patterns provide a reliable behavioral signal. By analyzing deposits, withdrawals, and account balance trends, we can assess financial discipline and income stability."
        },
        {
          id: "norm3",
          question: "How is my score calculated?",
          answer: "Your score (0-100) is calculated using multiple factors: Income Volatility (20%), Net Cash Flow (15%), Expense Shocks (10%), Income Level (25%), Income Consistency (15%), Work Activity (10%), and Account Balance (5%). Each factor uses risk-band scoring for fairness."
        },
        {
          id: "norm4",
          question: "What is Income Volatility?",
          answer: "Income Volatility measures how much your monthly income fluctuates. Low volatility (±15%) means stable earnings, while high volatility (>30%) indicates unpredictable income. Lower volatility improves your credit score as it signals reliability."
        },
        {
          id: "norm5",
          question: "What is Net Cash Flow Ratio?",
          answer: "Net Cash Flow Ratio = (Total Income - Total Expenses) / Total Income. A positive ratio (>20%) shows you save money each month. Neutral (5-20%) means you break even. Negative (<5%) indicates overspending and reduces creditworthiness."
        },
        {
          id: "norm6",
          question: "What are Expense Shocks?",
          answer: "Expense Shocks are months where your spending exceeds 1.5× your average monthly expenses. Frequent shocks (3+ months) suggest poor financial planning. None or occasional shocks (0-2 months) indicate good expense management."
        }
      ]
    },
    policies: {
      title: "Lending Policies",
      icon: "🏦",
      color: "green",
      questions: [
        {
          id: "policy1",
          question: "What loan amount am I eligible for?",
          answer: "Eligibility depends on your score: Score 75-100 (Low Risk) = 3× monthly income; Score 50-74 (Medium Risk) = 2× monthly income; Score 35-49 = 1× monthly income; Score 0-34 = 0.5× monthly income. Higher scores unlock larger amounts."
        },
        {
          id: "policy2",
          question: "What are the interest rates?",
          answer: "Interest rates are risk-based: Low Risk (score 75+) = 12-15% annually; Medium Risk (score 50-74) = 15-18% annually; High Risk (score below 50) = 18-22% annually. Improve your score to get better rates."
        },
        {
          id: "policy3",
          question: "How long does approval take?",
          answer: "Credit assessment is instant once you upload your bank statement. The scoring algorithm processes your data in real-time. Loan disbursement (if you apply) typically takes 24-48 hours pending final verification by lending partners."
        },
        {
          id: "policy4",
          question: "Do I need collateral?",
          answer: "No collateral is required for loans up to ₹50,000. For amounts above ₹50,000, policies vary by lending partner. Your alternative credit score serves as the primary qualification instead of property or assets."
        },
        {
          id: "policy5",
          question: "What documents are required?",
          answer: "Primary requirement: Bank statement (PDF format, minimum 3 months). Optional: Aadhaar card for identity verification, PAN card for tax purposes, and employment proof (if available). No salary slips needed for gig workers."
        },
        {
          id: "policy6",
          question: "Can I improve my loan terms?",
          answer: "Yes! Upload updated bank statements every 3 months to recalculate your score. Improving your income consistency, reducing expense ratio, and maintaining positive cash flow will increase your score and unlock better loan terms."
        }
      ]
    },
    risks: {
      title: "Risk Levels",
      icon: "⚠️",
      color: "yellow",
      questions: [
        {
          id: "risk1",
          question: "What does 'Low Risk' mean?",
          answer: "Low Risk (score 75-100) indicates excellent creditworthiness. You have stable income, good savings habits, and minimal expense shocks. You qualify for the highest loan amounts (3× income) at the best interest rates (12-15%)."
        },
        {
          id: "risk2",
          question: "What does 'Medium Risk' mean?",
          answer: "Medium Risk (score 50-74) indicates good financial profile with room for improvement. You have moderate income consistency and some expense volatility. You qualify for 2× monthly income loans at standard rates (15-18%)."
        },
        {
          id: "risk3",
          question: "What does 'High Risk' mean?",
          answer: "High Risk (score below 50) indicates areas needing improvement: irregular income, high expense ratio, or frequent expense shocks. You can still access credit but at smaller amounts (0.5-1× income) and higher rates (18-22%). Focus on building consistent financial habits."
        },
        {
          id: "risk4",
          question: "Why is my risk level important?",
          answer: "Your risk level determines: (1) Maximum loan amount available, (2) Interest rate charged, (3) Repayment terms flexibility, and (4) Processing speed. Lower risk = better terms. It's based on statistical default probability prediction."
        },
        {
          id: "risk5",
          question: "How can I move from High to Low Risk?",
          answer: "Key improvements: (1) Work more consistently (25+ days/month), (2) Reduce expense ratio below 60%, (3) Avoid expense shocks by budgeting, (4) Maintain account balance above ₹7,000, (5) Build stable income patterns over 3-6 months."
        },
        {
          id: "risk6",
          question: "Will my risk level be shared?",
          answer: "No. Your credit score and risk assessment are confidential and only visible to you and authorized lending partners you choose to share with. We do not report to traditional credit bureaus or share your data publicly."
        }
      ]
    }
  };

  const handleSectionClick = (sectionKey) => {
    setActiveSection(sectionKey);
    setCurrentView("questions");
    // Add bot message
    setChatHistory([
      ...chatHistory,
      {
        type: "bot",
        message: `Great! Here are questions about ${qaData[sectionKey].title}. Click any question to see the answer.`
      }
    ]);
  };

  const handleQuestionClick = (question) => {
    setActiveQuestion(question);
    setCurrentView("answer");
    // Add user question and bot answer to chat
    setChatHistory([
      ...chatHistory,
      {
        type: "user",
        message: question.question
      },
      {
        type: "bot",
        message: question.answer
      }
    ]);
  };

  const handleBack = () => {
    if (currentView === "answer") {
      setCurrentView("questions");
      setActiveQuestion(null);
    } else if (currentView === "questions") {
      setCurrentView("sections");
      setActiveSection(null);
    }
  };

  const handleReset = () => {
    setCurrentView("sections");
    setActiveSection(null);
    setActiveQuestion(null);
    setChatHistory([]);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && chatHistory.length === 0) {
      // Welcome message
      setChatHistory([
        {
          type: "bot",
          message: "👋 Hi! I'm your Credit Policy Assistant. I can help answer questions about credit norms, lending policies, and risk levels. Choose a topic to get started!"
        }
      ]);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={toggleChat}
        data-chatbot-icon="true"
        className={`fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 z-50 ${
          isOpen
            ? "bg-red-600 hover:bg-red-700"
            : "bg-gradient-to-br from-blue-900 to-blue-700 hover:from-blue-800 hover:to-blue-600"
        }`}
        aria-label="Toggle chat assistant"
      >
        {isOpen ? (
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
            <span className="text-blue-900 text-xs font-bold">?</span>
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border-2 border-blue-900 animate-slideUp">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-t-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Credit Assistant</h3>
                <p className="text-blue-200 text-xs">Always here to help</p>
              </div>
            </div>
            {chatHistory.length > 1 && (
              <button
                onClick={handleReset}
                className="text-white hover:text-yellow-400 transition"
                title="Reset conversation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </div>

          {/* Chat Body */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
            {/* Chat Messages */}
            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"} animate-fadeIn`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.type === "user"
                      ? "bg-blue-900 text-white rounded-br-none"
                      : "bg-white text-gray-800 shadow-md rounded-bl-none border border-gray-200"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.message}</p>
                </div>
              </div>
            ))}

            {/* Section Selection View */}
            {currentView === "sections" && (
              <div className="space-y-2 animate-fadeIn">
                <p className="text-xs text-gray-500 text-center mb-3">Choose a topic:</p>
                {Object.keys(qaData).map((sectionKey) => {
                  const section = qaData[sectionKey];
                  return (
                    <button
                      key={sectionKey}
                      onClick={() => handleSectionClick(sectionKey)}
                      className={`w-full p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                        section.color === "blue"
                          ? "border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-500"
                          : section.color === "green"
                          ? "border-green-300 bg-green-50 hover:bg-green-100 hover:border-green-500"
                          : "border-yellow-300 bg-yellow-50 hover:bg-yellow-100 hover:border-yellow-500"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{section.icon}</span>
                        <div className="text-left flex-1">
                          <h4 className="font-bold text-gray-900">{section.title}</h4>
                          <p className="text-xs text-gray-600">{section.questions.length} questions</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Questions List View */}
            {currentView === "questions" && activeSection && (
              <div className="space-y-2 animate-fadeIn">
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={handleBack}
                    className="p-2 hover:bg-gray-200 rounded-lg transition"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{qaData[activeSection].icon}</span>
                    <span className="font-bold text-gray-900">{qaData[activeSection].title}</span>
                  </div>
                </div>
                {qaData[activeSection].questions.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => handleQuestionClick(q)}
                    className="w-full p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-900 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-sm text-gray-800 font-medium">{q.question}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-white border-t border-gray-200 rounded-b-2xl">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">💡 Static Q&A - No AI</p>
              {currentView !== "sections" && (
                <button
                  onClick={handleBack}
                  className="text-xs text-blue-900 hover:text-blue-700 font-semibold flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default CreditPolicyBot;
