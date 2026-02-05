/**
 * CSV Bank Statement Parser
 * Parses uploaded CSV files and extracts financial metrics
 */

import fs from 'fs';

export const parseCSVBankStatement = async (filePath) => {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    // Skip header row
    const dataLines = lines.slice(1);
    
    const transactions = dataLines.map(line => {
      const [date, description, debit, credit, balance] = line.split(',').map(item => item.trim());
      return {
        date: date ? new Date(date) : null,
        description: description || '',
        debit: parseFloat(debit) || 0,
        credit: parseFloat(credit) || 0,
        balance: parseFloat(balance) || 0
      };
    }).filter(t => t.date); // Remove invalid entries

    // Calculate metrics
    const credits = transactions.filter(t => t.credit > 0);
    const debits = transactions.filter(t => t.debit > 0);
    
    // Average monthly income (sum of credits)
    const totalIncome = credits.reduce((sum, t) => sum + t.credit, 0);
    const averageMonthlyIncome = Math.round(totalIncome);

    // Income consistency (based on variance of credit amounts)
    const creditAmounts = credits.map(t => t.credit);
    const avgCredit = totalIncome / credits.length || 0;
    const variance = creditAmounts.reduce((sum, amt) => sum + Math.pow(amt - avgCredit, 2), 0) / credits.length || 0;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = avgCredit > 0 ? (stdDev / avgCredit) : 1;
    const incomeConsistencyScore = Math.max(0, Math.min(100, Math.round(100 * (1 - coefficientOfVariation))));

    // Active work days (unique dates with credit transactions)
    const workDays = new Set(credits.map(t => t.date.toDateString())).size;
    const activeWorkDays = workDays;

    // Expense to income ratio
    const totalExpenses = debits.reduce((sum, t) => sum + t.debit, 0);
    const expenseToIncomeRatio = totalIncome > 0 ? parseFloat((totalExpenses / totalIncome).toFixed(2)) : 0;

    // Average daily balance
    const balances = transactions.map(t => t.balance);
    const averageDailyBalance = Math.round(balances.reduce((sum, b) => sum + b, 0) / balances.length || 0);

    return {
      averageMonthlyIncome,
      incomeConsistencyScore,
      activeWorkDays,
      expenseToIncomeRatio,
      averageDailyBalance,
      transactionCount: transactions.length,
      totalCredits: totalIncome,
      totalDebits: totalExpenses
    };
  } catch (error) {
    console.error('CSV parsing error:', error);
    throw new Error('Failed to parse CSV file. Please ensure it follows the correct format.');
  }
};

/**
 * Validate CSV file format
 */
export const validateCSV = (file) => {
  if (!file) {
    throw new Error('No file uploaded');
  }

  const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
  if (!allowedTypes.includes(file.mimetype) && !file.originalname.endsWith('.csv')) {
    throw new Error('Invalid file type. Only CSV files are allowed');
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('File size exceeds 5MB limit');
  }

  return true;
};
