/**
 * Lender Controller — Offer-Based Marketplace
 *
 * FLOW:
 * 1. Lender sees pending loans they haven't acted on yet
 * 2. "Make Offer" → adds offer to loan.offers[] with terms
 * 3. "Pass" → adds entry with status "passed" — loan stays open for others
 * 4. Gig worker accepts/rejects offers from their side
 * 5. After acceptance, only the owning lender manages disbursement/repayment
 */

import { EmergencyLoan } from "../models/EmergencyLoan.js";
import { CreditProfile } from "../models/CreditProfile.js";
import { FinancialSummary } from "../models/financialSummary.js";

/**
 * GET /api/lender/applications
 * Shows:
 *   - Pending loans the lender has NOT acted on (open marketplace)
 *   - Loans where this lender has an active offer (status: offered)
 *   - Loans this lender owns (approved/disbursed/repaid)
 */
export const getAllApplications = async (req, res) => {
    try {
        const lenderId = req.lender._id;
        const { status, sortBy = "createdAt", order = "desc" } = req.query;
        const sortOrder = order === "asc" ? 1 : -1;

        let filter;

        if (status === "pending") {
            // Open loans this lender hasn't acted on
            filter = {
                status: "pending",
                "offers.lenderId": { $ne: lenderId }
            };
        } else if (status === "offered") {
            // Loans where this lender has a pending offer
            filter = {
                status: "pending",
                offers: { $elemMatch: { lenderId, status: "offered" } }
            };
        } else if (status && status !== "all") {
            // My owned loans with specific status
            filter = { lenderId, status };
        } else {
            // "all" — open pending + my offers + my owned
            filter = {
                $or: [
                    // Pending loans I haven't acted on
                    { status: "pending", "offers.lenderId": { $ne: lenderId } },
                    // Pending loans where I have an active offer
                    { status: "pending", offers: { $elemMatch: { lenderId, status: "offered" } } },
                    // My owned loans
                    { lenderId }
                ]
            };
        }

        const applications = await EmergencyLoan.find(filter)
            .populate("borrowerId", "name email employmentType phone")
            .sort({ [sortBy]: sortOrder })
            .lean();

        // Tag each loan with ownership context for the frontend
        const tagged = applications.map(app => {
            const myOffer = app.offers?.find(o => o.lenderId?.toString() === lenderId.toString());
            let ownership = "open";           // never acted on this loan
            let myOfferStatus = null;

            if (app.lenderId?.toString() === lenderId.toString()) {
                ownership = "yours";          // borrower accepted my offer
            } else if (myOffer) {
                ownership = "offer_sent";     // I have a pending/rejected offer
                myOfferStatus = myOffer.status;
            }

            return { ...app, ownership, myOfferStatus, myOffer: myOffer || null };
        });

        res.json({ success: true, data: tagged, total: tagged.length });
    } catch (error) {
        console.error("Get applications error:", error);
        res.status(500).json({ success: false, error: error.message || "Failed to fetch applications" });
    }
};

/**
 * GET /api/lender/applications/:loanId
 */
export const getApplicationDetail = async (req, res) => {
    try {
        const lenderId = req.lender._id;
        const { loanId } = req.params;

        const loan = await EmergencyLoan.findById(loanId)
            .populate("borrowerId", "name email employmentType phone connectedPlatforms createdAt")
            .lean();

        if (!loan) {
            return res.status(404).json({ success: false, error: "Application not found" });
        }

        const [creditProfile, financialSummary] = await Promise.all([
            CreditProfile.findOne({ userId: loan.borrowerId._id }).lean(),
            FinancialSummary.findOne({ userId: loan.borrowerId._id }).lean()
        ]);

        const myOffer = loan.offers?.find(o => o.lenderId?.toString() === lenderId.toString());
        let ownership = "open";
        if (loan.lenderId?.toString() === lenderId.toString()) ownership = "yours";
        else if (myOffer) ownership = "offer_sent";

        res.json({
            success: true,
            data: {
                loan: { ...loan, ownership, myOffer: myOffer || null },
                borrowerProfile: {
                    creditProfile: creditProfile || null,
                    financialSummary: financialSummary || null
                }
            }
        });
    } catch (error) {
        console.error("Get application detail error:", error);
        res.status(500).json({ success: false, error: error.message || "Failed to fetch application details" });
    }
};

/**
 * POST /api/lender/applications/:loanId/offer
 * Make an offer on a pending loan. Does NOT approve it — the borrower decides.
 */
export const makeOffer = async (req, res) => {
    try {
        const lenderId = req.lender._id;
        const { loanId } = req.params;
        const { interestRate, repaymentTermMonths, offeredAmount, lenderNotes } = req.body;

        if (!interestRate || !repaymentTermMonths) {
            return res.status(400).json({
                success: false,
                error: "Interest rate and repayment term are required"
            });
        }

        const loan = await EmergencyLoan.findById(loanId);
        if (!loan) return res.status(404).json({ success: false, error: "Loan not found" });

        if (loan.status !== "pending") {
            return res.status(400).json({ success: false, error: "Can only make offers on pending loans" });
        }

        // Check if lender already has an active offer
        const existingOffer = loan.offers.find(
            o => o.lenderId.toString() === lenderId.toString() && o.status === "offered"
        );
        if (existingOffer) {
            return res.status(400).json({ success: false, error: "You already have an active offer on this loan" });
        }

        const finalAmount = offeredAmount || loan.amount;
        const totalInterest = (finalAmount * interestRate * repaymentTermMonths) / (12 * 100);
        const totalRepayable = Math.round(finalAmount + totalInterest);
        const monthlyEmi = Math.round(totalRepayable / repaymentTermMonths);

        loan.offers.push({
            lenderId,
            lenderName: req.lender.name,
            lenderOrganization: req.lender.organization || req.lender.name,
            interestRate,
            repaymentTermMonths,
            offeredAmount: finalAmount,
            monthlyEmi,
            totalRepayable,
            lenderNotes: lenderNotes || "",
            status: "offered",
            offeredAt: new Date()
        });

        await loan.save();

        res.json({
            success: true,
            message: `Offer sent! ₹${finalAmount.toLocaleString()} at ${interestRate}% for ${repaymentTermMonths} months (EMI: ₹${monthlyEmi.toLocaleString()}/mo). Waiting for borrower's response.`,
            data: loan
        });
    } catch (error) {
        console.error("Make offer error:", error);
        res.status(500).json({ success: false, error: error.message || "Failed to make offer" });
    }
};

/**
 * PUT /api/lender/applications/:loanId/pass
 * Lender passes (skips) on a loan. Loan stays open for other lenders.
 */
export const passOnLoan = async (req, res) => {
    try {
        const lenderId = req.lender._id;
        const { loanId } = req.params;
        const { reason } = req.body;

        const loan = await EmergencyLoan.findById(loanId);
        if (!loan) return res.status(404).json({ success: false, error: "Loan not found" });

        if (loan.status !== "pending") {
            return res.status(400).json({ success: false, error: "Can only pass on pending loans" });
        }

        // Check if already passed
        const alreadyPassed = loan.offers.find(
            o => o.lenderId.toString() === lenderId.toString() && o.status === "passed"
        );
        if (alreadyPassed) {
            return res.status(400).json({ success: false, error: "You have already passed on this loan" });
        }

        loan.offers.push({
            lenderId,
            lenderName: req.lender.name,
            lenderOrganization: req.lender.organization || req.lender.name,
            interestRate: 0,
            repaymentTermMonths: 0,
            offeredAmount: 0,
            monthlyEmi: 0,
            totalRepayable: 0,
            lenderNotes: reason || "Passed",
            status: "passed",
            offeredAt: new Date()
        });

        await loan.save();

        res.json({ success: true, message: "You've passed on this loan. It remains open for other lenders." });
    } catch (error) {
        console.error("Pass on loan error:", error);
        res.status(500).json({ success: false, error: error.message || "Failed to pass" });
    }
};

/**
 * PUT /api/lender/applications/:loanId/withdraw
 * Lender withdraws their pending offer
 */
export const withdrawOffer = async (req, res) => {
    try {
        const lenderId = req.lender._id;
        const { loanId } = req.params;

        const loan = await EmergencyLoan.findById(loanId);
        if (!loan) return res.status(404).json({ success: false, error: "Loan not found" });

        const offer = loan.offers.find(
            o => o.lenderId.toString() === lenderId.toString() && o.status === "offered"
        );
        if (!offer) {
            return res.status(400).json({ success: false, error: "No active offer to withdraw" });
        }

        offer.status = "withdrawn";
        offer.respondedAt = new Date();
        await loan.save();

        res.json({ success: true, message: "Offer withdrawn" });
    } catch (error) {
        console.error("Withdraw offer error:", error);
        res.status(500).json({ success: false, error: error.message || "Failed to withdraw" });
    }
};

/**
 * PUT /api/lender/applications/:loanId/disburse
 * Only the owning lender (after borrower accepted) can disburse
 */
export const disburseLoan = async (req, res) => {
    try {
        const lenderId = req.lender._id;
        const { loanId } = req.params;
        const loan = await EmergencyLoan.findById(loanId);

        if (!loan) return res.status(404).json({ success: false, error: "Loan not found" });

        if (!loan.lenderId || loan.lenderId.toString() !== lenderId.toString()) {
            return res.status(403).json({ success: false, error: "You can only disburse loans you own" });
        }

        if (loan.status !== "approved") {
            return res.status(400).json({ success: false, error: `Current status: ${loan.status}. Must be approved first.` });
        }

        loan.status = "disbursed";
        loan.disbursedAt = new Date();
        await loan.save();

        res.json({
            success: true,
            message: `₹${loan.approvedAmount.toLocaleString()} disbursed. EMI: ₹${loan.monthlyEmi.toLocaleString()}/month`,
            data: loan
        });
    } catch (error) {
        console.error("Disburse error:", error);
        res.status(500).json({ success: false, error: error.message || "Failed to disburse" });
    }
};

/**
 * PUT /api/lender/applications/:loanId/confirm-payment/:paymentId
 * Lender confirms a pending payment from the borrower
 */
export const confirmPayment = async (req, res) => {
    try {
        const lenderId = req.lender._id;
        const { loanId, paymentId } = req.params;

        const loan = await EmergencyLoan.findById(loanId);
        if (!loan) return res.status(404).json({ success: false, error: "Loan not found" });

        if (!loan.lenderId || loan.lenderId.toString() !== lenderId.toString()) {
            return res.status(403).json({ success: false, error: "You can only manage your own loans" });
        }

        if (loan.status !== "disbursed") {
            return res.status(400).json({ success: false, error: "Loan is not in disbursed state" });
        }

        const payment = loan.repaymentHistory.id(paymentId);
        if (!payment) return res.status(404).json({ success: false, error: "Payment not found" });

        if (payment.status !== "pending_confirmation") {
            return res.status(400).json({ success: false, error: `Payment is already ${payment.status}` });
        }

        // Confirm: update totalRepaid
        payment.status = "confirmed";
        payment.confirmedAt = new Date();
        loan.totalRepaid += payment.amount;

        // Auto-settle if fully paid
        if (loan.totalRepaid >= loan.totalRepayable) {
            loan.status = "repaid";
            loan.settledAt = new Date();
        }

        await loan.save();

        res.json({
            success: true,
            message: loan.status === "repaid"
                ? "Payment confirmed — loan fully settled!"
                : `₹${payment.amount.toLocaleString()} confirmed. Remaining: ₹${(loan.totalRepayable - loan.totalRepaid).toLocaleString()}`,
            data: {
                totalRepayable: loan.totalRepayable,
                totalRepaid: loan.totalRepaid,
                remaining: loan.totalRepayable - loan.totalRepaid,
                status: loan.status,
                repaymentHistory: loan.repaymentHistory
            }
        });
    } catch (error) {
        console.error("Confirm payment error:", error);
        res.status(500).json({ success: false, error: error.message || "Failed to confirm payment" });
    }
};

/**
 * PUT /api/lender/applications/:loanId/reject-payment/:paymentId
 * Lender rejects a pending payment from the borrower
 */
export const rejectPayment = async (req, res) => {
    try {
        const lenderId = req.lender._id;
        const { loanId, paymentId } = req.params;
        const { reason } = req.body;

        const loan = await EmergencyLoan.findById(loanId);
        if (!loan) return res.status(404).json({ success: false, error: "Loan not found" });

        if (!loan.lenderId || loan.lenderId.toString() !== lenderId.toString()) {
            return res.status(403).json({ success: false, error: "You can only manage your own loans" });
        }

        const payment = loan.repaymentHistory.id(paymentId);
        if (!payment) return res.status(404).json({ success: false, error: "Payment not found" });

        if (payment.status !== "pending_confirmation") {
            return res.status(400).json({ success: false, error: `Payment is already ${payment.status}` });
        }

        payment.status = "rejected";
        payment.note = (payment.note || "") + (reason ? ` [Rejected: ${reason}]` : " [Rejected by lender]");

        await loan.save();

        res.json({
            success: true,
            message: "Payment rejected. The borrower can submit a new payment request.",
            data: { repaymentHistory: loan.repaymentHistory }
        });
    } catch (error) {
        console.error("Reject payment error:", error);
        res.status(500).json({ success: false, error: error.message || "Failed to reject payment" });
    }
};

/**
 * PUT /api/lender/applications/:loanId/default
 */
export const markDefaulted = async (req, res) => {
    try {
        const lenderId = req.lender._id;
        const { loanId } = req.params;
        const { reason } = req.body;

        const loan = await EmergencyLoan.findById(loanId);
        if (!loan) return res.status(404).json({ success: false, error: "Loan not found" });

        if (!loan.lenderId || loan.lenderId.toString() !== lenderId.toString()) {
            return res.status(403).json({ success: false, error: "You can only default your own loans" });
        }

        if (loan.status !== "disbursed") {
            return res.status(400).json({ success: false, error: "Only disbursed loans can be defaulted" });
        }

        loan.status = "defaulted";
        loan.defaultedAt = new Date();
        await loan.save();

        res.json({ success: true, message: "Loan marked as defaulted", data: loan });
    } catch (error) {
        console.error("Mark default error:", error);
        res.status(500).json({ success: false, error: error.message || "Failed" });
    }
};

/**
 * GET /api/lender/stats
 * Per-lender stats
 */
export const getLenderStats = async (req, res) => {
    try {
        const lenderId = req.lender._id;

        const [
            openPendingCount,
            myOffersCount,
            myApprovedCount,
            myDisbursedCount,
            myRepaidCount,
            myDefaultedCount,
            myTotalApproved,
            myTotalRepaid
        ] = await Promise.all([
            EmergencyLoan.countDocuments({ status: "pending", "offers.lenderId": { $ne: lenderId } }),
            EmergencyLoan.countDocuments({ status: "pending", offers: { $elemMatch: { lenderId, status: "offered" } } }),
            EmergencyLoan.countDocuments({ lenderId, status: "approved" }),
            EmergencyLoan.countDocuments({ lenderId, status: "disbursed" }),
            EmergencyLoan.countDocuments({ lenderId, status: "repaid" }),
            EmergencyLoan.countDocuments({ lenderId, status: "defaulted" }),
            EmergencyLoan.aggregate([
                { $match: { lenderId, status: { $in: ["approved", "disbursed", "repaid"] } } },
                { $group: { _id: null, total: { $sum: "$approvedAmount" } } }
            ]),
            EmergencyLoan.aggregate([
                { $match: { lenderId, status: { $in: ["disbursed", "repaid"] } } },
                { $group: { _id: null, total: { $sum: "$totalRepaid" } } }
            ])
        ]);

        res.json({
            success: true,
            data: {
                openPendingCount,
                myOffersCount,
                approvedCount: myApprovedCount,
                disbursedCount: myDisbursedCount,
                repaidCount: myRepaidCount,
                defaultedCount: myDefaultedCount,
                totalApprovedAmount: myTotalApproved[0]?.total || 0,
                totalRepaidAmount: myTotalRepaid[0]?.total || 0,
                totalApplications: openPendingCount + myOffersCount + myApprovedCount + myDisbursedCount + myRepaidCount + myDefaultedCount
            }
        });
    } catch (error) {
        console.error("Stats error:", error);
        res.status(500).json({ success: false, error: error.message || "Failed to fetch stats" });
    }
};
