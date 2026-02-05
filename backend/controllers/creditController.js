import FinancialSummary from "../models/FinancialSummary.model.js";
import CreditScore from "../models/CreditScore.model.js";
import calculateCreditScore from "../services/creditScoring.service.js";

export const generateCreditScore = async (req, res) => {
  try {
    const { userId } = req.body;

    const summary = await FinancialSummary.findOne({ userId });
    if (!summary) {
      return res.status(404).json({ error: "Financial summary not found" });
    }

    const result = calculateCreditScore(summary);

    const creditScore = await CreditScore.create({
      userId,
      ...result
    });

    res.status(201).json(creditScore);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
