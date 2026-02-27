import { BankStatement } from "../models/bankStatementModel.js";
import { Income } from "../models/incomeModel.js";
import { Expense } from "../models/expenseModel.js";
import { FinancialSummary } from "../models/financialSummary.js";
import { parsePDFStatement } from "../services/pdfParser.js";
import { calculateCreditProfile } from "../services/creditEngine/index.js";

export const uploadStatement = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: "No file uploaded" 
      });
    }

    // Save bank statement record
    const statement = await BankStatement.create({
      userId,
      fileName: req.file.filename,
      fileUrl: req.file.path,
      status: "processing"
    });

    // Parse PDF statement
    const transactions = await parsePDFStatement(req.file.path);

    // Process transactions
    for (const txn of transactions) {
      if (txn.type === "credit") {
        // Create income record
        await Income.create({
          userId,
          platform: "other",
          amount: txn.amount,
          date: txn.date,
          category: txn.category,
          source: "BANK_PDF",
          description: txn.description,
          status: "completed"
        });
      } else {
        // Create expense record
        await Expense.create({
          userId,
          amount: txn.amount,
          date: txn.date,
          category: txn.category,
          description: txn.description
        });
      }
    }

    // Update statement status
    await BankStatement.findByIdAndUpdate(statement._id, { status: "processed" });

    // Trigger financial summary recalculation (auto-updates netBalance)
    await FinancialSummary.updateSummary(userId);

    // Trigger credit profile recalculation
    const allIncomes = await Income.find({ userId, status: "completed" }).lean();
    const allExpenses = await Expense.find({ userId }).lean();
    
    const normalizedTransactions = [
      ...allIncomes.map(inc => ({
        date: inc.date,
        type: "credit",
        amount: inc.amount,
        category: inc.platform,
        source: "platform"
      })),
      ...allExpenses.map(exp => ({
        date: exp.date,
        type: "debit",
        amount: exp.amount,
        category: exp.category,
        source: "manual"
      }))
    ];

    if (normalizedTransactions.length > 0) {
      await calculateCreditProfile({ userId, transactions: normalizedTransactions });
    }

    res.status(201).json({ 
      success: true,
      data: {
        statement,
        transactionsProcessed: transactions.length
      }
    });

  } catch (error) {
    console.error("Upload statement error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};
