/**
 * Financial Summary Routes
 */

import express from "express";
import {
  getFinancialSummary,
  refreshFinancialSummary
} from "../controllers/summaryController.js";

const router = express.Router();

// Get financial summary for a user
router.get("/:userId", getFinancialSummary);

// Refresh financial summary
router.post("/refresh/:userId", refreshFinancialSummary);

export default router;
