import express from "express";
import {
  getCreditScore,
  calculateCredit,
  calculateCreditManual,
  getCreditMetrics,
  refreshCreditScore
} from "../controllers/newCreditController.js";

const router = express.Router();

// POST /api/credit/calculate - Calculate credit score from DB data
router.post("/calculate", calculateCredit);

// POST /api/credit/calculate-manual - Calculate from provided transactions
router.post("/calculate-manual", calculateCreditManual);

// GET /api/credit/metrics/:userId - Detailed metrics breakdown
router.get("/metrics/:userId", getCreditMetrics);

// POST /api/credit/refresh/:userId - Force refresh
router.post("/refresh/:userId", refreshCreditScore);

// GET /api/credit/:userId - Get credit score (must be last — catches all /:userId)
router.get("/:userId", getCreditScore);

export default router;
