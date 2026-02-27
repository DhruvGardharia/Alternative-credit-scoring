/**
 * Loan Controller — Gig Worker Side
 *
 * - Check eligibility (from CreditProfile + FinancialSummary)
 * - Apply for emergency loan (multiple loans allowed)
 * - View incoming offers from lenders
 * - Accept or reject individual offers
 * - Make repayments on disbursed loans
 */

import { EmergencyLoan } from "../models/EmergencyLoan.js";
import { checkEligibility } from "../services/loanEligibilityService.js";

/**
 * GET /api/loans/eligibility
 */
export const getEligibility = async (req, res) => {
    try {
        const userId = req.user._id;
        const eligibility = await checkEligibility(userId);
        res.json({ success: true, data: eligibility });
    } catch (error) {
        console.error("Eligibility check error:", error);
        res.status(500).json({ success: false, error: error.message || "Failed to check eligibility" });
    }
};

/**
 * POST /api/loans/apply
 */
export const applyForLoan = async (req, res) => {
    try {
        const userId = req.user._id;
        const { amount, purpose, purposeDescription, urgencyLevel } = req.body;

        if (!amount || !purpose || !purposeDescription || !urgencyLevel) {
            return res.status(400).json({
                success: false,
                error: "All fields are required: amount, purpose, purposeDescription, urgencyLevel"
            });
        }

        const eligibility = await checkEligibility(userId);
        if (!eligibility.eligible) {
            return res.status(400).json({ success: false, error: "Not eligible", reasons: eligibility.reasons });
        }

        if (amount > eligibility.maxAmount) {
            return res.status(400).json({
                success: false,
                error: `Amount ₹${amount.toLocaleString()} exceeds eligible ₹${eligibility.maxAmount.toLocaleString()}`
            });
        }

        if (amount < 1000) {
            return res.status(400).json({ success: false, error: "Minimum loan amount is ₹1,000" });
        }

        const loan = await EmergencyLoan.create({
            borrowerId: userId,
            amount, purpose, purposeDescription, urgencyLevel,
            creditScoreAtApplication: eligibility.creditScore,
            riskLevelAtApplication: eligibility.riskLevel,
            eligibleAmount: eligibility.maxAmount,
            scoreBreakdown: eligibility.scoreBreakdown,
            financialSnapshot: eligibility.financialSnapshot,
            status: "pending"
        });

        res.status(201).json({
            success: true,
            message: "Application submitted! Lenders will make offers on your loan.",
            data: loan
        });
    } catch (error) {
        console.error("Loan application error:", error);
        res.status(500).json({ success: false, error: error.message || "Failed to submit" });
    }
};

/**
 * GET /api/loans/my-loans
 * Includes offers so borrower can see and respond to them
 */
export const getMyLoans = async (req, res) => {
    try {
        const userId = req.user._id;
        const loans = await EmergencyLoan.find({ borrowerId: userId })
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, data: loans });
    } catch (error) {
        console.error("Get my loans error:", error);
        res.status(500).json({ success: false, error: error.message || "Failed to fetch loans" });
    }
};

/**
 * GET /api/loans/:loanId
 */
export const getLoanById = async (req, res) => {
    try {
        const { loanId } = req.params;
        const loan = await EmergencyLoan.findById(loanId)
            .populate("borrowerId", "name email employmentType phone")
            .lean();

        if (!loan) return res.status(404).json({ success: false, error: "Loan not found" });

        res.json({ success: true, data: loan });
    } catch (error) {
        console.error("Get loan error:", error);
        res.status(500).json({ success: false, error: error.message || "Failed to fetch loan" });
    }
};

/**
 * PUT /api/loans/:loanId/offers/:offerId/accept
 * Borrower accepts a specific offer — loan becomes approved with that lender
 */
export const acceptOffer = async (req, res) => {
    try {
        const userId = req.user._id;
        const { loanId, offerId } = req.params;

        const loan = await EmergencyLoan.findOne({ _id: loanId, borrowerId: userId });
        if (!loan) return res.status(404).json({ success: false, error: "Loan not found" });

        if (loan.status !== "pending") {
            return res.status(400).json({ success: false, error: "This loan has already been finalized" });
        }

        const offer = loan.offers.id(offerId);
        if (!offer) return res.status(404).json({ success: false, error: "Offer not found" });

        if (offer.status !== "offered") {
            return res.status(400).json({ success: false, error: `Cannot accept an offer with status: ${offer.status}` });
        }

        // Accept this offer
        offer.status = "accepted";
        offer.respondedAt = new Date();

        // Mark all other active offers as "not_selected"
        loan.offers.forEach(o => {
            if (o._id.toString() !== offerId && o.status === "offered") {
                o.status = "not_selected";
                o.respondedAt = new Date();
            }
        });

        // Set loan as approved with the accepted terms
        loan.status = "approved";
        loan.lenderId = offer.lenderId;
        loan.lenderOrganization = offer.lenderOrganization;
        loan.interestRate = offer.interestRate;
        loan.repaymentTermMonths = offer.repaymentTermMonths;
        loan.approvedAmount = offer.offeredAmount;
        loan.totalRepayable = offer.totalRepayable;
        loan.monthlyEmi = offer.monthlyEmi;
        loan.approvedAt = new Date();

        // Calculate due date
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + offer.repaymentTermMonths);
        loan.dueDate = dueDate;

        await loan.save();

        res.json({
            success: true,
            message: `Offer from ${offer.lenderOrganization} accepted! EMI: ₹${offer.monthlyEmi.toLocaleString()}/month for ${offer.repaymentTermMonths} months`,
            data: loan
        });
    } catch (error) {
        console.error("Accept offer error:", error);
        res.status(500).json({ success: false, error: error.message || "Failed to accept offer" });
    }
};

/**
 * PUT /api/loans/:loanId/offers/:offerId/reject
 * Borrower rejects a specific offer — loan stays pending for other offers
 */
export const rejectOffer = async (req, res) => {
    try {
        const userId = req.user._id;
        const { loanId, offerId } = req.params;

        const loan = await EmergencyLoan.findOne({ _id: loanId, borrowerId: userId });
        if (!loan) return res.status(404).json({ success: false, error: "Loan not found" });

        if (loan.status !== "pending") {
            return res.status(400).json({ success: false, error: "This loan has already been finalized" });
        }

        const offer = loan.offers.id(offerId);
        if (!offer) return res.status(404).json({ success: false, error: "Offer not found" });

        if (offer.status !== "offered") {
            return res.status(400).json({ success: false, error: `Cannot reject an offer with status: ${offer.status}` });
        }

        offer.status = "borrower_rejected";
        offer.respondedAt = new Date();

        await loan.save();

        res.json({
            success: true,
            message: `Offer from ${offer.lenderOrganization} rejected. Your loan stays open for other lenders.`,
            data: loan
        });
    } catch (error) {
        console.error("Reject offer error:", error);
        res.status(500).json({ success: false, error: error.message || "Failed to reject offer" });
    }
};

/**
 * POST /api/loans/:loanId/repay
 * Gig worker submits a payment request — lender must confirm before it counts.
 */
export const makeRepayment = async (req, res) => {
    try {
        const userId = req.user._id;
        const { loanId } = req.params;
        const { amount, method, reference, note } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, error: "Valid amount required" });
        }

        const loan = await EmergencyLoan.findOne({ _id: loanId, borrowerId: userId });
        if (!loan) return res.status(404).json({ success: false, error: "Loan not found" });

        if (loan.status !== "disbursed") {
            return res.status(400).json({ success: false, error: "Repayments only on disbursed loans" });
        }

        // Don't allow another request while one is pending
        const hasPending = loan.repaymentHistory.some(p => p.status === "pending_confirmation");
        if (hasPending) {
            return res.status(400).json({
                success: false,
                error: "You already have a pending payment awaiting lender confirmation"
            });
        }

        const remaining = loan.totalRepayable - loan.totalRepaid;
        const paymentAmount = Math.min(amount, remaining);

        // Add as pending — does NOT update totalRepaid yet
        loan.repaymentHistory.push({
            amount: paymentAmount,
            date: new Date(),
            method: method || "bank_transfer",
            reference: reference || "",
            note: note || "",
            status: "pending_confirmation"
        });

        await loan.save();

        res.json({
            success: true,
            message: `Payment request of ₹${paymentAmount.toLocaleString()} submitted. Waiting for lender confirmation.`,
            data: {
                totalRepayable: loan.totalRepayable,
                totalRepaid: loan.totalRepaid,
                remaining: remaining,
                pendingAmount: paymentAmount,
                status: loan.status
            }
        });
    } catch (error) {
        console.error("Repayment error:", error);
        res.status(500).json({ success: false, error: error.message || "Failed to submit payment request" });
    }
};
