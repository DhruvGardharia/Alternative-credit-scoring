import BankStatement from "../models/BankStatement.model.js";
import FinancialSummary from "../models/FinancialSummary.model.js";
import parseBankStatement from "../services/statementParser.service.js";

export const uploadStatement = async (req, res) => {
  try {
    const { userId } = req.body;

    const statement = await BankStatement.create({
      userId,
      fileName: req.file.filename,
      fileUrl: req.file.path
    });

    const parsedData = parseBankStatement();

    const summary = await FinancialSummary.create({
      userId,
      ...parsedData
    });

    res.status(201).json({ statement, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
