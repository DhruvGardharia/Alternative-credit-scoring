/**
 * Credit Routes
 * 
 * API endpoints for credit scoring operations
 */

import express from "express";
import {
  calculateCredit,
  calculateCreditManual,
  getCreditScore,
  getCreditMetrics,
  refreshCreditScore
} from "../controllers/newCreditController.js";

const router = express.Router();

/**
 * POST /api/credit/calculate
 * Calculate credit score from aggregated user data
 * Body: { userId }
 */
router.post("/calculate", calculateCredit);

/**
 * POST /api/credit/calculate-manual
 * Calculate credit score from manually provided transactions
 * Body: { userId, transactions[], gigData? }
 */
router.post("/calculate-manual", calculateCreditManual);

/**
 * GET /api/credit/:userId
 * Get existing credit profile
 */
router.get("/:userId", getCreditScore);

/**
 * GET /api/credit/metrics/:userId
 * Get detailed metrics breakdown
 */
router.get("/metrics/:userId", getCreditMetrics);

/**
 * POST /api/credit/refresh/:userId
 * Refresh credit score with latest data
 */
router.post("/refresh/:userId", refreshCreditScore);

export default router;
