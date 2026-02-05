import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import CreditMeter from "../components/CreditMeter";

export default function CreditResult() {
  const [credit, setCredit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const { userId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchExistingScore();
  }, [userId]);

  const fetchExistingScore = async () => {
    try {
      const response = await axios.get(`/api/user/credit-score/${userId}`);
      if (response.data.success) {
        setCredit(response.data.creditScore);
      }
    } catch (err) {
      // Score doesn't exist yet, that's okay
      console.log("No existing score found");
    }
  };

  const generateScore = async () => {
    setGenerating(true);
    setError("");

    try {
      const response = await axios.post("/api/user/generate-score", { userId });
      if (response.data.success) {
        setCredit(response.data.creditScore);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate credit score");
    } finally {
      setGenerating(false);
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case "Low":
        return "text-green-600 bg-green-100";
      case "Medium":
        return "text-yellow-600 bg-yellow-100";
      case "High":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
      <div className="max-w-2xl mx-auto">
        {!credit && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mx-auto w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-10 h-10 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Generate Your Credit Score
            </h1>
            <p className="text-gray-600 mb-8">
              Based on your financial summary, we'll calculate your alternative credit
              score and determine your loan eligibility.
            </p>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <button
              onClick={generateScore}
              disabled={generating}
              className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-indigo-700 transition disabled:opacity-50 shadow-lg"
            >
              {generating ? "Calculating..." : "Generate Credit Score"}
            </button>

            <button
              onClick={() => navigate(`/dashboard/${userId}`)}
              className="mt-4 text-gray-600 hover:text-gray-900 text-sm"
            >
              ← Back to Dashboard
            </button>
          </div>
        )}

        {credit && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Your Credit Score
                </h1>
                <p className="text-gray-600">
                  Alternative credit assessment for {credit.userId?.name}
                </p>
              </div>

              <CreditMeter score={credit.score} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">
                    Credit Score
                  </h3>
                  <p className="text-4xl font-bold text-blue-900">
                    {credit.score}<span className="text-xl">/100</span>
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
                  <h3 className="text-sm font-medium text-purple-900 mb-2">
                    Risk Level
                  </h3>
                  <span
                    className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${getRiskColor(
                      credit.riskLevel
                    )}`}
                  >
                    {credit.riskLevel} Risk
                  </span>
                </div>

                <div className="md:col-span-2 bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
                  <h3 className="text-sm font-medium text-green-900 mb-2">
                    Eligible Credit Amount
                  </h3>
                  <p className="text-4xl font-bold text-green-900">
                    ₹{credit.eligibleCreditAmount?.toLocaleString()}
                  </p>
                  <p className="text-sm text-green-700 mt-2">
                    Maximum loan amount you qualify for
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Score Breakdown
              </h2>
              <ul className="space-y-3">
                {credit.explanation?.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-indigo-600 mr-3 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-indigo-50 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-indigo-900 mb-2">
                Next Steps
              </h3>
              <p className="text-sm text-indigo-700 mb-4">
                Share your credit score with lenders or financial institutions to
                apply for loans and credit products.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => navigate(`/dashboard/${userId}`)}
                  className="bg-white text-indigo-600 px-6 py-2 rounded-lg font-semibold hover:bg-indigo-50 transition"
                >
                  View Dashboard
                </button>
                <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition">
                  Download Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
