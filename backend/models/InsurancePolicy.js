import mongoose from "mongoose";
import crypto from "crypto";

const insurancePolicySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // Coverage type
        policyType: {
            type: String,
            enum: ["shift", "daily"],
            required: true,
        },

        // Policy status lifecycle
        status: {
            type: String,
            enum: ["active", "expired", "cancelled", "pending"],
            default: "pending",
        },

        // Financials
        premium: { type: Number, required: true }, // in INR
        coverageAmount: { type: Number, required: true }, // in INR
        premiumBreakdown: {
            basePremium: { type: Number },
            riskMultiplier: { type: Number },
            locationRiskFactor: { type: Number },
        },

        // Duration
        startTime: { type: Date, required: true },
        endTime: { type: Date, required: true },

        // AI Risk Assessment
        riskScore: { type: Number, min: 0, max: 100 },
        riskClassification: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH"],
            default: "MEDIUM",
        },

        // Blockchain ledger fields
        blockHeight: { type: Number },
        blockHash: { type: String },
        previousHash: { type: String, default: "0" },
        isVerified: { type: Boolean, default: true },

        // Metadata
        locationZone: { type: String, default: "urban" },
        workerStatus: { type: String, default: "online" },
    },
    { timestamps: true }
);

// Generate a SHA-256 block hash for this policy
insurancePolicySchema.methods.generateHash = function () {
    const data = JSON.stringify({
        userId: this.userId.toString(),
        policyType: this.policyType,
        premium: this.premium,
        coverageAmount: this.coverageAmount,
        startTime: this.startTime,
        endTime: this.endTime,
        riskScore: this.riskScore,
        previousHash: this.previousHash,
        timestamp: this.createdAt || new Date(),
    });
    return crypto.createHash("sha256").update(data).digest("hex");
};

insurancePolicySchema.index({ userId: 1, status: 1 });
insurancePolicySchema.index({ blockHeight: 1 });

export const InsurancePolicy = mongoose.model("InsurancePolicy", insurancePolicySchema);
