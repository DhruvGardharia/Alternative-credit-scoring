/**
 * Lender Auth Routes
 * 
 * Separate authentication endpoints for lenders.
 * Completely independent from gig worker auth routes.
 */

import express from "express";
import { lenderRegister, lenderLogin, getLenderMe } from "../controllers/lenderAuthController.js";
import { isLenderAuth } from "../middlewares/isLenderAuth.js";

const router = express.Router();

router.post("/register", lenderRegister);
router.post("/login", lenderLogin);
router.get("/me", isLenderAuth, getLenderMe);

export default router;
