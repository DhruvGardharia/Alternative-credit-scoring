export default function CreditMeter({ score }) {
  // Score is on a 0-1000 scale
  const getColor = () => {
    if (score >= 750) return { from: "#10b981", to: "#059669" }; // Green — Excellent
    if (score >= 500) return { from: "#f59e0b", to: "#d97706" }; // Yellow/Orange — Good
    if (score >= 350) return { from: "#f97316", to: "#ea580c" }; // Orange — Fair
    return { from: "#ef4444", to: "#dc2626" };                   // Red — Poor
  };

  const getLabel = () => {
    if (score >= 750) return "Excellent";
    if (score >= 500) return "Good";
    if (score >= 350) return "Fair";
    return "Poor";
  };

  const { from, to } = getColor();
  // Convert 0-1000 to 0-100% for the SVG arc
  const percentage = Math.min(100, Math.max(0, (score / 850) * 100));

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48">
        <svg className="w-48 h-48 transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="96"
            cy="96"
            r="80"
            stroke="#e5e7eb"
            strokeWidth="12"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="96"
            cy="96"
            r="80"
            stroke={`url(#gradient-${score})`}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${(percentage / 100) * 502.4} 502.4`}
            style={{ transition: "stroke-dasharray 1s ease" }}
          />
          <defs>
            <linearGradient id={`gradient-${score}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={from} />
              <stop offset="100%" stopColor={to} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-gray-900">{score}</span>
          <span className="text-xs text-gray-500 font-medium">out of 850</span>
          <span className="text-sm font-semibold mt-1" style={{ color: from }}>{getLabel()}</span>
        </div>
      </div>
      {/* Scale bar */}
      <div className="mt-4 w-full max-w-xs">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>0</span>
          <span className="text-red-500">350</span>
          <span className="text-yellow-500">500</span>
          <span className="text-green-500">750</span>
          <span>1000</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${percentage}%`,
              background: `linear-gradient(to right, ${from}, ${to})`,
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Poor</span>
          <span>Fair</span>
          <span>Good</span>
          <span>Excellent</span>
        </div>
      </div>
    </div>
  );
}
