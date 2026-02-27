import mongoose from "mongoose";

/**
 * LOAN OFFER FLOW:
 *
 * 1. Gig worker applies → loan status: "pending"
 * 2. Lenders see pending loans and can:
 *      - Make an OFFER (interest rate, term, amount) → added to offers[] with status "offered"
 *      - PASS (skip) → added to offers[] with status "passed" — loan stays open, just hidden from that lender
 * 3. Gig worker sees all offers and can:
 *      - ACCEPT one → loan status changes to "approved", lenderId set, other offers marked "not_selected"
 *      - REJECT an offer → offer status = "borrower_rejected", loan stays pending for other offers
 * 4. After acceptance:
 *      - Only the owning lender can disburse → repayment → settlement
 */

const loanOfferSchema = new mongoose.Schema({
    lenderId: { type: mongoose.Schema.Types.ObjectId, ref: "Lender", required: true },
    lenderName: { type: String, required: true },
    lenderOrganization: { type: String, required: true },

    // Offer terms
    interestRate: { type: Number, required: true },
    repaymentTermMonths: { type: Number, required: true },
    offeredAmount: { type: Number, required: true },
    monthlyEmi: { type: Number, required: true },
    totalRepayable: { type: Number, required: true },
    lenderNotes: { type: String, default: "" },

    // Offer status
    status: {
        type: String,
        enum: [
            "offered",             // lender made an offer — waiting for borrower
            "accepted",            // borrower accepted this offer
            "borrower_rejected",   // borrower rejected this offer
            "not_selected",        // borrower accepted a different offer
            "passed",              // lender passed (skipped) — loan stays open
            "withdrawn"            // lender withdrew their offer
        ],
        default: "offered"
    },

    offeredAt: { type: Date, default: Date.now },
    respondedAt: { type: Date }
});

const emergencyLoanSchema = new mongoose.Schema(
    {
        borrowerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        // ── Lender Ownership (set when borrower accepts an offer) ──
        lenderId: { type: mongoose.Schema.Types.ObjectId, ref: "Lender", index: true },
        lenderOrganization: { type: String },

        // ── Loan Details ──
        amount: { type: Number, required: true, min: 1000 },
        purpose: {
            type: String,
            enum: ["medical", "vehicle_repair", "family_emergency", "rent", "equipment", "education", "other"],
            required: true
        },
        purposeDescription: { type: String, required: true, maxlength: 500 },
        urgencyLevel: {
            type: String,
            enum: ["critical", "high", "medium"],
            required: true
        },

        // Status: pending → approved → disbursed → repaid/defaulted
        status: {
            type: String,
            enum: ["pending", "approved", "rejected", "disbursed", "repaid", "defaulted", "cancelled"],
            default: "pending",
            index: true
        },

        // ── All Offers from Lenders ──
        offers: [loanOfferSchema],

        // ── Credit Snapshot at Application Time ──
        creditScoreAtApplication: { type: Number, default: 0 },
        riskLevelAtApplication: { type: String, default: "HIGH" },
        eligibleAmount: { type: Number, default: 0 },

        scoreBreakdown: {
            incomeQualityScore: { type: Number, default: 0 },
            spendingBehaviorScore: { type: Number, default: 0 },
            liquidityScore: { type: Number, default: 0 },
            gigStabilityScore: { type: Number, default: 0 }
        },
        financialSnapshot: {
            monthlyAvgIncome: { type: Number, default: 0 },
            monthlyAvgExpenses: { type: Number, default: 0 },
            savingsRate: { type: Number, default: 0 },
            netBalance: { type: Number, default: 0 }
        },

        // ── Accepted Terms (from the accepted offer) ──
        interestRate: { type: Number },
        repaymentTermMonths: { type: Number },
        approvedAmount: { type: Number },
        totalRepayable: { type: Number, default: 0 },
        totalRepaid: { type: Number, default: 0 },
        monthlyEmi: { type: Number, default: 0 },
        dueDate: { type: Date },

        repaymentHistory: [{
            amount: { type: Number, required: true },
            date: { type: Date, default: Date.now },
            method: { type: String, enum: ["upi", "bank_transfer", "cash", "auto_debit", "other"], default: "bank_transfer" },
            reference: { type: String },
            note: { type: String },
            status: {
                type: String,
                enum: ["pending_confirmation", "confirmed", "rejected"],
                default: "pending_confirmation"
            },
            confirmedAt: { type: Date }
        }],

        // ── Timestamps ──
        approvedAt: Date,
        disbursedAt: Date,
        settledAt: Date,
        defaultedAt: Date
    },
    { timestamps: true }
);

emergencyLoanSchema.index({ status: 1, createdAt: -1 });
emergencyLoanSchema.index({ borrowerId: 1, createdAt: -1 });
emergencyLoanSchema.index({ lenderId: 1, status: 1 });
emergencyLoanSchema.index({ "offers.lenderId": 1 });

export const EmergencyLoan = mongoose.model("EmergencyLoan", emergencyLoanSchema);
