/**
 * PDF Bank Statement Parser
 * Extracts transactions from bank statement PDFs
 */

import fs from "fs";
import { createRequire } from "module";

// Create require function for CommonJS modules
const require = createRequire(import.meta.url);

export const parsePDFStatement = async (filePath) => {
  try {
    console.log('Starting PDF parsing for file:', filePath);
    
    if (!fs.existsSync(filePath)) {
      throw new Error('PDF file not found');
    }

    const dataBuffer = fs.readFileSync(filePath);
    console.log('File read, size:', dataBuffer.length, 'bytes');
    
    // Load pdf-parse using require (CommonJS)
    const pdfParse = require("pdf-parse");
    console.log('pdf-parse loaded, type:', typeof pdfParse);
    console.log('pdfParse function?', typeof pdfParse === 'function');
    
    // ✅ FIX 1: Pass max:0 to force pdf-parse to read ALL pages (default limit causes truncation)
    const data = await pdfParse(dataBuffer, { max: 0 });
    const text = data.text;
    console.log('✅ PDF parsed successfully');
    console.log('Pages:', data.numpages, '| Text length:', text.length);
    console.log('\n=== FIRST 1000 CHARS ===');
    console.log(text.substring(0, 1000));
    console.log('========================\n');

    // Split into raw lines
    const rawLines = text.split('\n').map(line => line.trim()).filter(line => line && line.length > 0);
    console.log('Total raw lines:', rawLines.length);

    // ✅ FIX 2: Join multi-line transactions.
    // A transaction in many PDFs is spread across 2-3 lines. We detect a "start" line
    // (has a date pattern) and keep appending continuation lines until the next date line
    // OR until the line ends with Cr/Dr (transaction complete).
    const datePattern = /\d{1,2}[-\/\s][A-Z]{3}[-\/\s]\d{4}|\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/i;
    const joinedLines = [];
    let currentLine = '';

    for (let i = 0; i < rawLines.length; i++) {
      const raw = rawLines[i];

      // Skip pure header/footer lines
      if (/^(Bank Statement|Page \d+|Date\s*Value\s*Date|Tran\s*Date|Opening Balance|Closing Balance|Sl\.?\s*No|Statement of Account)/i.test(raw)) {
        if (currentLine) {
          joinedLines.push(currentLine);
          currentLine = '';
        }
        continue;
      }

      if (datePattern.test(raw)) {
        // Save the previous accumulated line
        if (currentLine) {
          joinedLines.push(currentLine);
        }
        currentLine = raw;
      } else if (currentLine) {
        // Continuation of current transaction line — append
        currentLine += ' ' + raw;
      }

      // If the accumulated line already ends with Cr/Dr, flush it
      if (currentLine && /(?:Cr|Dr)\s*$/i.test(currentLine)) {
        joinedLines.push(currentLine);
        currentLine = '';
      }
    }
    if (currentLine) joinedLines.push(currentLine);

    console.log(`Total joined transaction candidates: ${joinedLines.length}`);
    console.log('\n========== FIRST 20 JOINED LINES ==========');
    joinedLines.slice(0, 20).forEach((line, i) => {
      console.log(`Line ${i + 1}: "${line.substring(0, 160)}${line.length > 160 ? '...' : ''}"`);
    });
    console.log('==========================================\n');

    const transactions = [];
    let transactionsFound = 0;
    let skippedShort = 0;
    let skippedHeader = 0;
    let skippedNoDateOrCr = 0;
    let skippedNoAmount = 0;

    for (let i = 0; i < joinedLines.length; i++) {
      const line = joinedLines[i];

      if (line.length < 20) { skippedShort++; continue; }
      if (/Bank Statement|Opening Balance|Closing Balance|DateValue|Particulars|Tran Type|Page \d+/i.test(line)) {
        skippedHeader++; continue;
      }

      // Must contain a date
      if (!datePattern.test(line)) { skippedNoDateOrCr++; continue; }

      const isCR = /Cr\s*$/i.test(line);
      const isDR = /Dr\s*$/i.test(line);

      // Must end with Cr or Dr
      if (!isCR && !isDR) { skippedNoDateOrCr++; continue; }

      // Extract first date found
      const dateMatch = line.match(datePattern);
      const date = dateMatch[0];

      // ✅ FIX 3: Detect all common transaction types, not just UPI
      const isUPIIN  = /UPIIN|UPI-IN|UPI IN/i.test(line);
      const isUPIOUT = /UPIOUT|UPI-OUT|UPI OUT/i.test(line);
      const isNEFT   = /NEFT/i.test(line);
      const isRTGS   = /RTGS/i.test(line);
      const isIMPS   = /IMPS/i.test(line);
      const isATM    = /ATM|CASH WITHDRAWAL|CASH WDL/i.test(line);
      const isSalary = /SALARY|SAL\//i.test(line);
      const isEMI    = /EMI|LOAN/i.test(line);

      // Build description
      let description = "Bank Transaction";
      const upiMatch = line.match(/UPI(?:IN|OUT|\/)[^\s\/]*\/([^\/\s]+)/i);
      if (upiMatch) {
        description = `UPI - ${upiMatch[1]}`;
      } else if (isNEFT) {
        const neftMatch = line.match(/NEFT[\/\-\s]+([A-Za-z0-9\s]+?)(?:\s{2,}|\d{2,}|$)/i);
        description = neftMatch ? `NEFT - ${neftMatch[1].trim()}` : 'NEFT Transfer';
      } else if (isRTGS) {
        description = 'RTGS Transfer';
      } else if (isIMPS) {
        const impsMatch = line.match(/IMPS[\/\-\s]+([A-Za-z0-9\s]+?)(?:\s{2,}|\d{2,}|$)/i);
        description = impsMatch ? `IMPS - ${impsMatch[1].trim()}` : 'IMPS Transfer';
      } else if (isATM) {
        description = 'ATM Withdrawal';
      } else if (isSalary) {
        description = 'Salary Credit';
      } else if (isEMI) {
        description = 'EMI Payment';
      }
      if (description.length > 80) description = description.substring(0, 80) + '...';

      // ✅ FIX 4: Robust amount extraction
      // The balance is always the LAST amount on the line (before Cr/Dr)
      const balanceMatch = line.match(/(\d[\d,]*\.\d{2})\s*(?:Cr|Dr)\s*$/i);
      const balance = balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, '')) : 0;

      // Strip balance + Cr/Dr from end, then find remaining amounts (withdrawal or deposit)
      const lineWithoutBalance = line.replace(/[\d,]+\.\d{2}\s*(?:Cr|Dr)\s*$/i, '');
      const allAmounts = (lineWithoutBalance.match(/[\d,]+\.\d{2}/g) || [])
        .map(a => parseFloat(a.replace(/,/g, '')))
        .filter(a => a > 0);

      console.log(`\n📋 Line ${i + 1}: "${line.substring(0, 100)}..."`);
      console.log(`   amounts=${JSON.stringify(allAmounts)}, balance=${balance}, Cr=${isCR}, Dr=${isDR}`);

      let type, amount;

      if (isDR) {
        // Debit: amount is the first non-balance number after the date/description
        type = 'debit';
        amount = allAmounts.length > 0 ? allAmounts[0] : 0;
      } else {
        // Credit: amount is typically the last non-balance number
        type = 'credit';
        amount = allAmounts.length > 0 ? allAmounts[allAmounts.length - 1] : 0;
      }

      // For UPIOUT specifically, first amount = withdrawal
      if (isUPIOUT) { type = 'debit';  amount = allAmounts[0] || 0; }
      // For UPIIN specifically, last amount = deposit
      if (isUPIIN)  { type = 'credit'; amount = allAmounts[allAmounts.length - 1] || 0; }

      if (!amount || amount <= 0 || isNaN(amount)) {
        console.log(`   ⚠️  Invalid amount, skipping`);
        skippedNoAmount++;
        continue;
      }

      const category = categorizeTransaction(description);
      const transaction = {
        date:  parseFlexibleDate(date),
        type,
        amount,
        balance,
        description,
        category,
        source: "BANK_PDF"
      };

      console.log(`   ✅ ${type.toUpperCase()} ₹${amount.toFixed(2)} | ${description.substring(0, 40)}`);
      transactions.push(transaction);
      transactionsFound++;
    }

    console.log('\n========================================');
    console.log(`✅ Valid transactions extracted: ${transactionsFound}`);
    console.log(`📊 Skipped — short:${skippedShort} | header:${skippedHeader} | noDateCr:${skippedNoDateOrCr} | noAmount:${skippedNoAmount}`);
    console.log('========================================\n');
    
    // Log summary breakdown
    const credits = transactions.filter(t => t.type === 'credit');
    const debits = transactions.filter(t => t.type === 'debit');
    console.log(`📊 Breakdown: ${credits.length} credits, ${debits.length} debits`);
    console.log(`💰 Total Credit: ₹${credits.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}`);
    console.log(`💸 Total Debit: ₹${debits.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}\n`);
    
    // If no transactions found, log warning but still return empty array
    if (transactions.length === 0) {
      console.log('⚠️  WARNING: No transactions parsed from PDF!');
      console.log('⚠️  Possible reasons:');
      console.log('   - PDF format not recognized');
      console.log('   - No date patterns matched');
      console.log('   - PDF might be image-based (not text-based)');
      console.log('⚠️  Please check the PDF format or contact support');
    }

    return transactions;

  } catch (error) {
    console.error('PDF parsing error details:', {
      message: error.message,
      stack: error.stack,
      filePath
    });
    
    // Throw error instead of returning sample data
    throw new Error(`Failed to parse PDF: ${error.message}. Please ensure the file is a valid text-based PDF bank statement.`);
  }
};

function parseFlexibleDate(dateStr) {
  try {
    // Try different date formats
    
    // Format: 28-JAN-2026 or 28 JAN 2026
    const monthNamePattern = /(\d{1,2})[-\s]([A-Z]{3})[-\s](\d{4})/i;
    const monthMatch = dateStr.match(monthNamePattern);
    if (monthMatch) {
      const months = {
        JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
        JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11
      };
      const day = parseInt(monthMatch[1]);
      const month = months[monthMatch[2].toUpperCase()];
      const year = parseInt(monthMatch[3]);
      return new Date(year, month, day);
    }
    
    // Format: 28/01/2026 or 28-01-2026
    const dmyPattern = /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/;
    const dmyMatch = dateStr.match(dmyPattern);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1]);
      const month = parseInt(dmyMatch[2]) - 1; // 0-indexed
      const year = parseInt(dmyMatch[3]);
      return new Date(year, month, day);
    }
    
    // Format: 2026-01-28 (ISO)
    const isoPattern = /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/;
    const isoMatch = dateStr.match(isoPattern);
    if (isoMatch) {
      const year = parseInt(isoMatch[1]);
      const month = parseInt(isoMatch[2]) - 1; // 0-indexed
      const day = parseInt(isoMatch[3]);
      return new Date(year, month, day);
    }
    
    // Fallback: try to parse directly
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    
    // Last resort: return today
    return new Date();
  } catch (error) {
    console.error('Date parsing error for:', dateStr, error);
    return new Date();
  }
}

function parseDate(dateStr) {
  // Convert "28-JAN-2026" to Date object (kept for backwards compatibility)
  return parseFlexibleDate(dateStr);
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
