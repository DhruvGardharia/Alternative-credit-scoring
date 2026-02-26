# Credit Scoring Engine Documentation

## Overview

This is a production-ready, modular credit scoring engine designed for gig workers and alternative credit assessment. The engine is **source-agnostic**, meaning it works with any transaction data source (bank statements, gig platforms, manual entries) as long as the data is converted to a standardized format.

## Architecture

```
backend/
├── config/
│   └── metricDefinitions.js          # Central configuration for all scoring rules
├── models/
│   └── CreditProfile.js               # MongoDB schema for credit profiles
├── services/
│   └── creditEngine/
│       ├── index.js                   # Main entry point
│       ├── incomeMetrics.js          # Income quality calculations
│       ├── spendingMetrics.js        # Spending behavior calculations
│       ├── liquidityMetrics.js       # Liquidity calculations
│       ├── gigMetrics.js             # Gig-specific metrics (extensible)
│       ├── scoreAggregator.js        # Score aggregation logic
│       └── riskClassifier.js         # Risk classification & recommendations
├── controllers/
│   └── newCreditController.js        # API controllers
└── routes/
    └── newCreditRoutes.js            # API routes
```

## Core Concepts

### 1. Standardized Transaction Format

All data sources must be converted to this format before reaching the credit engine:

```javascript
{
  userId: "ObjectId",
  transactions: [
    {
      date: Date,
      type: "credit" | "debit",
      amount: Number,
      category: String,
      source: "platform" | "manual" | "bank",
      description: String (optional)
    }
  ],
  gigData: {  // Optional
    platformRating: Number,
    completionRate: Number,
    // ... other gig-specific data
  }
}
```

### 2. Credit Score Range

- **Range**: 300 - 850 (similar to FICO)
- **Risk Bands**:
  - **HIGH**: 300-550 (High risk borrowers)
  - **MEDIUM**: 551-700 (Moderate risk)
  - **LOW**: 701-850 (Low risk, creditworthy)

### 3. Score Composition

The credit score is composed of 4 main categories with weighted contributions:

| Category | Weight | Description |
|----------|--------|-------------|
| Income Quality | 35% | Earning capacity, stability, consistency |
| Spending Behavior | 30% | Savings habits, expense patterns |
| Liquidity | 20% | Cash cushion, balance patterns |
| Gig Stability | 15% | Work pattern stability (extensible) |

## Metrics Breakdown

### Income Quality Metrics (35% weight)

1. **Average Monthly Income** (20% of category)
   - Measures earning capacity
   - Higher income = better score

2. **Income Volatility** (15% of category)
   - Coefficient of variation
   - Lower volatility = better score

3. **Income Consistency** (15% of category)
   - % of months with income
   - Higher consistency = better score

4. **Income Trend** (15% of category)
   - Month-over-month growth rate
   - Positive trend = better score

5. **Active Work Days** (10% of category)
   - Average earning days per month
   - More active days = better score

6. **Income Diversification** (15% of category)
   - Number of income sources
   - More sources = better score

7. **Work Stability** (10% of category)
   - Maximum gap between earnings
   - Shorter gaps = better score

### Spending Behavior Metrics (30% weight)

1. **Net Cash Flow Ratio** (30% of category)
   - (Income - Expenses) / Income
   - Higher savings rate = better score

2. **Savings Behavior** (30% of category)
   - % of months with positive cash flow
   - Consistent savings = better score

3. **Expense Shocks** (20% of category)
   - Months with abnormal high expenses
   - Fewer shocks = better score

4. **Fixed Obligation Ratio** (20% of category)
   - Recurring expenses / Income
   - Lower obligations = better score

### Liquidity Metrics (20% weight)

1. **Average Daily Balance** (60% of category)
   - Cash cushion strength
   - Higher balance = better score

2. **Negative Balance Risk** (40% of category)
   - % of days with low balance
   - Lower risk = better score

### Gig Stability Metrics (15% weight)

- Placeholder for platform-specific metrics
- Currently uses transaction history as proxy
- Extensible for platform ratings, completion rates, etc.

## API Endpoints

### 1. Calculate Credit Score

**POST** `/api/credit/calculate`

Calculate credit score from aggregated user data (expenses, bank statements, platform earnings).

```javascript
// Request
{
  "userId": "user_id_here"
}

// Response
{
  "success": true,
  "data": {
    "creditScore": 720,
    "riskLevel": "LOW",
    "scoreBreakdown": {
      "incomeQualityScore": 75,
      "spendingBehaviorScore": 82,
      "liquidityScore": 68,
      "gigStabilityScore": 70
    },
    "metrics": {
      "avgMonthlyIncome": {
        "value": 42000,
        "score": 80,
        "status": "Good Income",
        "lastUpdated": "2026-02-27T..."
      },
      // ... all other metrics
    },
    "riskAnalysis": {
      "riskLevel": "LOW",
      "eligibleLoanAmount": 50000,
      "interestRate": 12,
      "loanTerm": 12,
      "insurancePremiumMultiplier": 1.0,
      "walletLimit": 100000,
      "strengths": ["Strong income profile", "Excellent spending discipline"],
      "weaknesses": [],
      "recommendedActions": []
    }
  }
}
```

### 2. Calculate Credit Score (Manual)

**POST** `/api/credit/calculate-manual`

Calculate credit score from manually provided transactions. Useful for testing or external integrations.

```javascript
// Request
{
  "userId": "user_id_here",
  "transactions": [
    {
      "date": "2026-01-15",
      "type": "credit",
      "amount": 5000,
      "category": "gig_earning",
      "source": "platform"
    },
    {
      "date": "2026-01-16",
      "type": "debit",
      "amount": 1500,
      "category": "food",
      "source": "manual"
    }
    // ... more transactions
  ],
  "gigData": {
    "platformRating": 4.8
  }
}

// Response: Same as above
```

### 3. Get Credit Score

**GET** `/api/credit/:userId`

Get existing credit profile for a user.

```javascript
// Response
{
  "success": true,
  "data": {
    "creditScore": 720,
    "riskLevel": "LOW",
    // ... complete profile
  }
}
```

### 4. Get Credit Metrics

**GET** `/api/credit/metrics/:userId`

Get detailed metrics breakdown.

```javascript
// Response
{
  "success": true,
  "data": {
    "metrics": { /* all metrics */ },
    "scoreBreakdown": { /* category scores */ },
    "creditScore": 720,
    "riskLevel": "LOW"
  }
}
```

### 5. Refresh Credit Score

**POST** `/api/credit/refresh/:userId`

Recalculate credit score with latest transaction data.

```javascript
// Response
{
  "success": true,
  "message": "Credit score refreshed successfully",
  "data": { /* updated profile */ }
}
```

## Usage Examples

### Example 1: Calculate Credit for New User

```javascript
// Sample transaction data
const transactions = [
  // Income transactions (credits)
  { date: "2026-01-01", type: "credit", amount: 8000, category: "uber", source: "platform" },
  { date: "2026-01-05", type: "credit", amount: 6500, category: "swiggy", source: "platform" },
  { date: "2026-01-12", type: "credit", amount: 7200, category: "uber", source: "platform" },
  
  // Expense transactions (debits)
  { date: "2026-01-03", type: "debit", amount: 2000, category: "food", source: "manual" },
  { date: "2026-01-10", type: "debit", amount: 5000, category: "rent", source: "manual" },
  { date: "2026-01-15", type: "debit", amount: 1500, category: "utilities", source: "manual" }
];

// Calculate credit score
const response = await fetch('/api/credit/calculate-manual', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: "user123",
    transactions: transactions
  })
});

const result = await response.json();
console.log(`Credit Score: ${result.data.creditScore}`);
console.log(`Risk Level: ${result.data.riskLevel}`);
```

### Example 2: Use in Loan Eligibility Check

```javascript
async function checkLoanEligibility(userId, requestedAmount) {
  // Get credit profile
  const response = await fetch(`/api/credit/${userId}`);
  const { data } = await response.json();
  
  const { creditScore, riskAnalysis } = data;
  
  if (requestedAmount <= riskAnalysis.eligibleLoanAmount) {
    return {
      approved: true,
      amount: requestedAmount,
      interestRate: riskAnalysis.interestRate,
      term: riskAnalysis.loanTerm,
      message: `Loan approved at ${riskAnalysis.interestRate}% interest`
    };
  } else {
    return {
      approved: false,
      maxAmount: riskAnalysis.eligibleLoanAmount,
      message: `Maximum eligible amount: ₹${riskAnalysis.eligibleLoanAmount}`
    };
  }
}
```

### Example 3: Insurance Premium Calculation

```javascript
async function calculateInsurancePremium(userId, basePremium) {
  const response = await fetch(`/api/credit/${userId}`);
  const { data } = await response.json();
  
  const multiplier = data.riskAnalysis.insurancePremiumMultiplier;
  const finalPremium = basePremium * multiplier;
  
  return {
    basePremium,
    riskMultiplier: multiplier,
    finalPremium,
    riskLevel: data.riskLevel
  };
}
```

## Extending the Engine

### Adding New Metrics

1. Define metric in `config/metricDefinitions.js`:
```javascript
export const NEW_METRICS = {
  myNewMetric: {
    weight: 20,
    scoringBands: [
      { min: 0, max: 10, score: 20, status: "Low" },
      { min: 11, max: 20, score: 50, status: "Medium" },
      { min: 21, max: Infinity, score: 100, status: "High" }
    ]
  }
};
```

2. Create calculation function in appropriate metrics file:
```javascript
export function calculateMyNewMetric(transactions) {
  // Your calculation logic
  const value = /* calculated value */;
  const { score, status } = getScoreFromBands(value, NEW_METRICS.myNewMetric.scoringBands);
  
  return { value, score, status, lastUpdated: new Date() };
}
```

3. Update schema in `models/CreditProfile.js` to include the new metric.

4. Update aggregator to include the new metric in category score calculation.

## Testing

Test the credit engine with different transaction patterns to ensure correct scoring:

```javascript
// Test Case 1: High income, low expenses
const highScoreTransactions = [
  // Regular high income
  { date: "2026-01-01", type: "credit", amount: 50000, ... },
  // Low expenses
  { date: "2026-01-05", type: "debit", amount: 5000, ... }
];

// Test Case 2: Irregular income, high expenses
const lowScoreTransactions = [
  // Irregular income
  { date: "2026-01-01", type: "credit", amount: 10000, ... },
  { date: "2026-01-25", type: "credit", amount: 5000, ... },
  // High expenses
  { date: "2026-01-10", type: "debit", amount: 12000, ... }
];
```

## Production Considerations

1. **Data Privacy**: Ensure transaction data is encrypted and access-controlled
2. **Performance**: Use database indexing for userId queries
3. **Caching**: Cache credit profiles with TTL to reduce calculations
4. **Monitoring**: Track score distributions and metric anomalies
5. **Validation**: Validate transaction data before processing
6. **Error Handling**: Implement comprehensive error handling
7. **Rate Limiting**: Limit API calls to prevent abuse
8. **Audit Trail**: Log all credit score calculations for compliance

## Future Enhancements

- [ ] Add support for bill payment history
- [ ] Integrate with credit bureau APIs
- [ ] Machine learning for dynamic weight optimization
- [ ] Real-time score updates on new transactions
- [ ] Multi-currency support
- [ ] Fraud detection metrics
- [ ] Social trust scores
- [ ] Platform-specific gig metrics (Uber ratings, completion rates)
- [ ] Peer comparison analytics

## License

Proprietary - Internal Use Only
