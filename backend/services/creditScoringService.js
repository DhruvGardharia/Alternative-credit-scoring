const calculateCreditScore = (summary) => {
  let score = 0;
  let explanation = [];

  if (summary.incomeConsistencyScore > 70) {
    score += 30;
    explanation.push("Stable income pattern detected");
  }

  if (summary.activeWorkDays > 20) {
    score += 25;
    explanation.push("Consistent work activity");
  }

  if (summary.expenseToIncomeRatio < 0.5) {
    score += 25;
    explanation.push("Healthy expense-to-income ratio");
  }

  if (summary.averageDailyBalance > 3000) {
    score += 20;
    explanation.push("Maintains sufficient account balance");
  }

  let riskLevel = "High";
  if (score >= 70) riskLevel = "Low";
  else if (score >= 50) riskLevel = "Medium";

  const eligibleCreditAmount =
    riskLevel === "Low" ? 10000 : riskLevel === "Medium" ? 5000 : 2000;

  return {
    score,
    riskLevel,
    eligibleCreditAmount,
    explanation
  };
};

export default calculateCreditScore;
