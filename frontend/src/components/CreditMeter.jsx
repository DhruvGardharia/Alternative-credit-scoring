export default function CreditMeter({ score }) {
  const getColor = () => {
    if (score >= 75) return { from: "#10b981", to: "#059669" }; // Green
    if (score >= 50) return { from: "#f59e0b", to: "#d97706" }; // Yellow/Orange
    return { from: "#ef4444", to: "#dc2626" }; // Red
  };

  const getLabel = () => {
    if (score >= 75) return "Excellent";
    if (score >= 50) return "Good";
    return "Fair";
  };

  const { from, to } = getColor();
  const percentage = score;

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
          <span className="text-5xl font-bold text-gray-900">{score}</span>
          <span className="text-sm text-gray-600 font-medium">{getLabel()}</span>
        </div>
      </div>
      <div className="mt-4 w-full max-w-xs">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>0</span>
          <span>50</span>
          <span>100</span>
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
      </div>
    </div>
  );
}
