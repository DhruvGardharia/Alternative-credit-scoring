import express from "express";
import { getCreditScore } from "../controllers/newCreditController.js";

const router = express.Router();

// GET /api/credit/:userId - Get credit score for a user
router.get("/:userId", getCreditScore);

export default router;
