/**
 * Mock Bank Statement Parser Service
 * Simulates extracting financial metrics from uploaded bank statements
 * In production, this would use PDF parsing libraries and pattern matching
 */

export const parseBankStatement = async (filePath) => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Generate realistic mock data for gig workers
  const mockMetrics = {
    averageMonthlyIncome: Math.floor(Math.random() * 30000) + 20000, // ₹20k-50k
    incomeConsistencyScore: Math.floor(Math.random() * 40) + 60, // 60-100
    activeWorkDays: Math.floor(Math.random() * 10) + 20, // 20-30 days
    expenseToIncomeRatio: (Math.random() * 0.3 + 0.5).toFixed(2), // 0.5-0.8
    averageDailyBalance: Math.floor(Math.random() * 10000) + 5000 // ₹5k-15k
  };

  return mockMetrics;
};

/**
 * Validate uploaded file
 */
export const validateBankStatement = (file) => {
  if (!file) {
    throw new Error('No file uploaded');
  }

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type. Only PDF, JPG, and PNG are allowed');
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('File size exceeds 5MB limit');
  }

  return true;
};
