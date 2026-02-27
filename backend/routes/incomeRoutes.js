/**
 * Income Routes
 * 
 * Endpoints for managing income/earnings data
 */

import express from "express";
import {
  addIncome,
  bulkAddIncome,
  getIncome,
  getIncomeSummary
} from "../controllers/incomeController.js";

const router = express.Router();

// Add single income record
router.post("/add", addIncome);

// Bulk add income records (for platform sync)
router.post("/bulk", bulkAddIncome);

// Get income for a user
router.get("/:userId", getIncome);

// Get income summary by platform
router.get("/summary/:userId", getIncomeSummary);

export default router;
