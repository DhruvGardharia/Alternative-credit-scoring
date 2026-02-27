/**
 * Loan Routes — Gig Worker Side
 */

import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import {
    getEligibility,
    applyForLoan,
    getMyLoans,
    getLoanById,
    acceptOffer,
    rejectOffer,
    makeRepayment
} from "../controllers/loanController.js";

const router = express.Router();

// Eligibility
router.get("/eligibility", isAuth, getEligibility);

// Apply for loan
router.post("/apply", isAuth, applyForLoan);

// My loans
router.get("/my-loans", isAuth, getMyLoans);
router.get("/:loanId", isAuth, getLoanById);

// Respond to offers
router.put("/:loanId/offers/:offerId/accept", isAuth, acceptOffer);
router.put("/:loanId/offers/:offerId/reject", isAuth, rejectOffer);

// Make repayment
router.post("/:loanId/repay", isAuth, makeRepayment);

export default router;
