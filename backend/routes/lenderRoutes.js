/**
 * Lender Routes — Offer-Based Marketplace
 */

import express from "express";
import { isLenderAuth } from "../middlewares/isLenderAuth.js";
import {
    getAllApplications,
    getApplicationDetail,
    makeOffer,
    passOnLoan,
    withdrawOffer,
    disburseLoan,
    confirmPayment,
    rejectPayment,
    markDefaulted,
    getLenderStats
} from "../controllers/lenderController.js";

const router = express.Router();

// Dashboard stats
router.get("/stats", isLenderAuth, getLenderStats);

// Browse loan applications
router.get("/applications", isLenderAuth, getAllApplications);
router.get("/applications/:loanId", isLenderAuth, getApplicationDetail);

// Offer actions
router.post("/applications/:loanId/offer", isLenderAuth, makeOffer);
router.put("/applications/:loanId/pass", isLenderAuth, passOnLoan);
router.put("/applications/:loanId/withdraw", isLenderAuth, withdrawOffer);

// Post-acceptance actions (only owning lender)
router.put("/applications/:loanId/disburse", isLenderAuth, disburseLoan);
router.put("/applications/:loanId/confirm-payment/:paymentId", isLenderAuth, confirmPayment);
router.put("/applications/:loanId/reject-payment/:paymentId", isLenderAuth, rejectPayment);
router.put("/applications/:loanId/default", isLenderAuth, markDefaulted);

export default router;
