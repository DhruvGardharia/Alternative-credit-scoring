/**
 * PDF Bank Statement Parser
 * Extracts transactions from bank statement PDFs
 */

import { createRequire } from "module";
import fs from "fs";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

export const parsePDFStatement = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    const text = data.text;

    // Split into lines
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);

    const transactions = [];
    const datePattern = /(\d{2}-[A-Z]{3}-\d{4})/;

    for (let line of lines) {
      // Skip header lines
      if (line.includes('Value Date') || line.includes('Particulars') || line.includes('Balance')) {
        continue;
      }

      // Match transaction pattern: Date ... Withdrawals/Deposits ... Balance ... DR/CR
      if (datePattern.test(line)) {
        const parts = line.split(/\s+/);
        
        // Extract date (first occurrence)
        const dateMatch = line.match(datePattern);
        if (!dateMatch) continue;
        
        const date = dateMatch[0];
        
        // Find amounts (numbers with decimals)
        const amounts = parts.filter(p => /^\d+(\.\d{2})?$/.test(p)).map(parseFloat);
        
        // Check for DR/CR
        const isDR = line.includes(' Dr') || line.includes(' DR');
        const isCR = line.includes(' Cr') || line.includes(' CR');
        
        // Determine transaction type
        let type, amount, balance;
        
        if (amounts.length >= 2) {
          // Last amount is usually balance
          balance = amounts[amounts.length - 1];
          amount = amounts[amounts.length - 2];
          
          // Determine type from DR/CR or from which column has value
          if (isCR || (!isDR && !isCR && amounts.length === 2)) {
            type = "credit";
          } else {
            type = "debit";
          }
        } else {
          continue;
        }

        // Extract description (everything between date and amounts)
        const descMatch = line.match(/\d{4}\s+(.+?)\s+\d+\.\d{2}/);
        const description = descMatch ? descMatch[1].trim() : "Transaction";

        // Determine category from description
        const category = categorizeTransaction(description);

        transactions.push({
          date: parseDate(date),
          type,
          amount,
          balance,
          description,
          category,
          source: "BANK_PDF"
        });
      }
    }

    return transactions;

  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF statement');
  }
};

function parseDate(dateStr) {
  // Convert "28-JAN-2026" to Date object
  const months = {
    JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
    JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11
  };
  
  const parts = dateStr.split('-');
  const day = parseInt(parts[0]);
  const month = months[parts[1]];
  const year = parseInt(parts[2]);
  
  return new Date(year, month, day);
}

function categorizeTransaction(description) {
  const desc = description.toLowerCase();
  
  if (desc.includes('upi') || desc.includes('paytm') || desc.includes('phonepe')) {
    return 'upi';
  } else if (desc.includes('atm') || desc.includes('withdrawal')) {
    return 'cash_withdrawal';
  } else if (desc.includes('salary') || desc.includes('income')) {
    return 'salary';
  } else if (desc.includes('food') || desc.includes('zomato') || desc.includes('swiggy')) {
    return 'food';
  } else if (desc.includes('fuel') || desc.includes('petrol')) {
    return 'transport';
  } else if (desc.includes('electricity') || desc.includes('water') || desc.includes('gas')) {
    return 'utilities';
  } else if (desc.includes('rent')) {
    return 'rent';
  } else {
    return 'other';
  }
}
