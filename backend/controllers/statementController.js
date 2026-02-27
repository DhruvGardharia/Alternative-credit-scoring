import { BankStatement } from "../models/bankStatementModel.js";
import { Income } from "../models/incomeModel.js";
import { Expense } from "../models/expenseModel.js";
import { FinancialSummary } from "../models/financialSummary.js";
import { parsePDFStatement } from "../services/pdfParser.js";
import { calculateCreditProfile } from "../services/creditEngine/index.js";

export const uploadStatement = async (req, res) => {
  try {
    const { userId } = req.body;

    console.log('Upload statement request:', { userId, hasFile: !!req.file });

    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: "No file uploaded" 
      });
    }

    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: "userId is required" 
      });
    }

    console.log('File details:', {
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Save bank statement record
    const statement = await BankStatement.create({
      userId,
      fileName: req.file.filename,
      fileUrl: req.file.path,
      status: "processing"
    });

    console.log('Bank statement record created:', statement._id);

    // Parse PDF statement
    let transactions = [];
    try {
      transactions = await parsePDFStatement(req.file.path);
      console.log('Transactions parsed:', transactions.length);
    } catch (parseError) {
      console.error('PDF parsing failed:', parseError.message);
      throw parseError;
    }

    // Process transactions
    console.log(`Processing ${transactions.length} transactions...`);
    
    for (const txn of transactions) {
      if (txn.type === "credit") {
        // Create income record - use "other" as platform since it's from bank statement
        await Income.create({
          userId,
          platform: "other", // Bank statement incomes go to "other" platform
          amount: txn.amount,
          date: txn.date,
          category: txn.category || "other", // Ensure valid category
          source: "BANK_PDF",
          description: txn.description || "Bank credit",
          status: "completed"
        });
      } else {
        // Create expense record - ensure category is valid
        const validExpenseCategories = ["food", "transport", "utilities", "rent", "healthcare", "entertainment", "upi", "cash_withdrawal", "other"];
        const expenseCategory = validExpenseCategories.includes(txn.category) ? txn.category : "other";
        
        await Expense.create({
          userId,
          amount: txn.amount,
          date: txn.date,
          category: expenseCategory,
          description: txn.description || "Bank debit",
          source: "BANK_PDF"
        });
      }
    }
    
    console.log(`✅ Created ${transactions.filter(t => t.type === 'credit').length} income records`);
    console.log(`✅ Created ${transactions.filter(t => t.type === 'debit').length} expense records`);

    // Update statement status
    await BankStatement.findByIdAndUpdate(statement._id, { status: "processed" });

    // Trigger financial summary recalculation (auto-updates netBalance)
    try {
      await FinancialSummary.updateSummary(userId);
    } catch (summaryError) {
      console.error('Financial summary update error:', summaryError);
    }

    // Trigger credit profile recalculation
    console.log('\n🔷 Triggering credit score calculation...');
    const allIncomes = await Income.find({ userId, status: "completed" }).lean();
    const allExpenses = await Expense.find({ userId }).lean();
    
    console.log(`📊 Total data: ${allIncomes.length} incomes, ${allExpenses.length} expenses`);
    
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

    let creditResult = null;
    if (normalizedTransactions.length > 0) {
      try {
        console.log(`🔄 Calculating credit profile with ${normalizedTransactions.length} transactions...`);
        creditResult = await calculateCreditProfile({ userId, transactions: normalizedTransactions });
        console.log(`✅ Credit score calculated: ${creditResult.creditScore}`);
      } catch (creditError) {
        console.error('❌ Credit profile calculation error:', creditError.message);
        console.error(creditError.stack);
      }
    }

    console.log('Statement upload completed successfully');

    res.status(201).json({ 
      success: true,
      message: "Bank statement uploaded and processed successfully",
      data: {
        statement,
        transactionsProcessed: transactions.length,
        creditScore: creditResult?.creditScore || null,
        creditProfile: creditResult || null,
      }
    });

  } catch (error) {
    console.error("Upload statement error:", {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      success: false,
      error: error.message || "Failed to process bank statement"
    });
  }
};
