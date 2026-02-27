import mongoose from "mongoose";
import crypto from "crypto";

const insuranceClaimSchema = new mongoose.Schema(
    {
        policyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "InsurancePolicy",
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // Claim details
        incidentType: {
            type: String,
            enum: ["accident", "medical", "equipment_damage", "theft", "liability", "other"],
            required: true,
        },
        description: { type: String, required: true },
        proofUrl: { type: String }, // Cloudinary URL
        proofPublicId: { type: String },

        // RAG-retrieved policy clauses
        ragRetrievedClauses: [
            {
                clauseId: String,
                title: String,
                text: String,
                relevanceScore: Number,
            },
        ],

        // LLM Analysis (Gemini)
        llmAnalysis: {
            summary: { type: String },
            approvalConfidence: { type: Number, min: 0, max: 100 }, // 0–100 %
            fraudRisk: {
                type: String,
                enum: ["LOW", "MEDIUM", "HIGH"],
                default: "LOW",
            },
            recommendation: { type: String }, // "APPROVE" | "REVIEW" | "REJECT"
            analysisNotes: { type: String },
            imageVerification: {
                imageProvided: { type: Boolean, default: false },
                imageDescription: { type: String },
                matchesDescription: {
                    type: String,
                    enum: ["MATCH", "PARTIAL_MATCH", "MISMATCH", "SUSPICIOUS", "NO_IMAGE"],
                    default: "NO_IMAGE",
                },
                imageNotes: { type: String },
            },
        },

        // Claim decision
        status: {
            type: String,
            enum: ["pending", "ai_reviewed", "approved", "rejected", "under_review"],
            default: "pending",
        },
        payoutAmount: { type: Number, default: 0 },
        reviewerNotes: { type: String },

        // Blockchain ledger
        blockHeight: { type: Number },
        blockHash: { type: String },
        previousHash: { type: String, default: "0" },
        isVerified: { type: Boolean, default: true },
        payoutTxHash: { type: String }, // hash of payout transaction
    },
    { timestamps: true }
);

// Generate a SHA-256 block hash for this claim
insuranceClaimSchema.methods.generateHash = function () {
    const data = JSON.stringify({
        policyId: this.policyId.toString(),
        userId: this.userId.toString(),
        incidentType: this.incidentType,
        description: this.description,
        status: this.status,
        previousHash: this.previousHash,
        timestamp: this.createdAt || new Date(),
    });
    return crypto.createHash("sha256").update(data).digest("hex");
};

insuranceClaimSchema.index({ userId: 1, status: 1 });
insuranceClaimSchema.index({ policyId: 1 });
insuranceClaimSchema.index({ blockHeight: 1 });

export const InsuranceClaim = mongoose.model("InsuranceClaim", insuranceClaimSchema);
