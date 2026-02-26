/**
 * Gig Metrics Calculator
 * 
 * Placeholder for gig-specific metrics
 * Can be extended with platform ratings, completion rates, etc.
 */

/**
 * Calculate gig stability score
 * Currently returns a default neutral score
 * 
 * Future enhancements:
 * - Platform ratings
 * - Order completion rate
 * - Customer feedback scores
 * - Platform diversity
 * - Peak hour activity
 */
export function calculateGigStabilityScore(transactions, gigData = {}) {
  // Default neutral score
  let score = 50;
  let status = "No Gig Data Available";

  // Check if we have gig-specific data
  if (gigData && Object.keys(gigData).length > 0) {
    // Future implementation based on gig platform data
    // Example fields: platformRatings, completionRate, totalOrders, etc.
    
    // Placeholder logic
    if (gigData.platformRating) {
      const rating = gigData.platformRating;
      if (rating >= 4.5) {
        score = 90;
        status = "Excellent Platform Rating";
      } else if (rating >= 4.0) {
        score = 75;
        status = "Good Platform Rating";
      } else if (rating >= 3.5) {
        score = 60;
        status = "Average Platform Rating";
      } else {
        score = 40;
        status = "Below Average Rating";
      }
    }
  } else {
    // Use transaction-based proxy metrics
    const creditTransactions = transactions.filter((t) => t.type === "credit");
    
    if (creditTransactions.length > 0) {
      // Use income consistency as proxy for gig stability
      const monthlyIncomes = {};
      creditTransactions.forEach((t) => {
        const monthKey = new Date(t.date).toISOString().slice(0, 7);
        monthlyIncomes[monthKey] = (monthlyIncomes[monthKey] || 0) + t.amount;
      });

      const monthCount = Object.keys(monthlyIncomes).length;
      
      if (monthCount >= 6) {
        score = 70;
        status = "Long-term Earning History";
      } else if (monthCount >= 3) {
        score = 55;
        status = "Moderate Earning History";
      } else {
        score = 40;
        status = "Limited Earning History";
      }
    }
  }

  return {
    value: score,
    score,
    status,
    lastUpdated: new Date()
  };
}

/**
 * Calculate all gig metrics
 */
export function calculateAllGigMetrics(transactions, gigData = {}) {
  return {
    gigStabilityScore: calculateGigStabilityScore(transactions, gigData)
  };
}
