import crypto from "crypto";
import { InsurancePolicy } from "../models/InsurancePolicy.js";
import { InsuranceClaim } from "../models/InsuranceClaim.js";

/**
 * Blockchain Service
 * Simulates an immutable, hash-chained ledger for insurance policies and claims.
 * Each block contains: data, previousHash, blockHash (SHA-256), blockHeight, timestamp.
 */

/**
 * Get the latest block hash for a user's chain
 */
async function getLatestBlockHash(userId) {
    // Look at both policies and claims, find the one with highest blockHeight
    const [latestPolicy, latestClaim] = await Promise.all([
        InsurancePolicy.findOne({ userId }).sort({ blockHeight: -1 }).select("blockHash blockHeight").lean(),
        InsuranceClaim.findOne({ userId }).sort({ blockHeight: -1 }).select("blockHash blockHeight").lean(),
    ]);

    if (!latestPolicy && !latestClaim) return { hash: "0", height: 0 };

    const latestPolicyHeight = latestPolicy?.blockHeight || 0;
    const latestClaimHeight = latestClaim?.blockHeight || 0;

    if (latestPolicyHeight >= latestClaimHeight) {
        return { hash: latestPolicy.blockHash, height: latestPolicyHeight };
    }
    return { hash: latestClaim.blockHash, height: latestClaimHeight };
}

/**
 * Compute SHA-256 hash of block data
 */
function computeHash(data, previousHash, timestamp) {
    const content = JSON.stringify({ data, previousHash, timestamp });
    return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Create a new block for a policy
 */
export async function createPolicyBlock(policy) {
    const { hash: previousHash, height: previousHeight } = await getLatestBlockHash(policy.userId);
    const blockHeight = previousHeight + 1;
    const timestamp = new Date();

    const blockData = {
        type: "POLICY",
        policyId: policy._id.toString(),
        userId: policy.userId.toString(),
        policyType: policy.policyType,
        premium: policy.premium,
        coverageAmount: policy.coverageAmount,
        status: policy.status,
        startTime: policy.startTime,
        endTime: policy.endTime,
    };

    const blockHash = computeHash(blockData, previousHash, timestamp);

    // Update policy with blockchain data
    await InsurancePolicy.findByIdAndUpdate(policy._id, {
        blockHeight,
        blockHash,
        previousHash,
        isVerified: true,
    });

    return { blockHeight, blockHash, previousHash };
}

/**
 * Create a new block for a claim
 */
export async function createClaimBlock(claim) {
    const { hash: previousHash, height: previousHeight } = await getLatestBlockHash(claim.userId);
    const blockHeight = previousHeight + 1;
    const timestamp = new Date();

    const blockData = {
        type: "CLAIM",
        claimId: claim._id.toString(),
        policyId: claim.policyId.toString(),
        userId: claim.userId.toString(),
        incidentType: claim.incidentType,
        status: claim.status,
        approvalConfidence: claim.llmAnalysis?.approvalConfidence,
        fraudRisk: claim.llmAnalysis?.fraudRisk,
    };

    const blockHash = computeHash(blockData, previousHash, timestamp);

    // Update claim with blockchain data
    await InsuranceClaim.findByIdAndUpdate(claim._id, {
        blockHeight,
        blockHash,
        previousHash,
        isVerified: true,
    });

    return { blockHeight, blockHash, previousHash };
}

/**
 * Get the full blockchain ledger for a user (policies + claims), sorted by blockHeight
 */
export async function getUserChain(userId) {
    const [policies, claims] = await Promise.all([
        InsurancePolicy.find({ userId }).lean(),
        InsuranceClaim.find({ userId }).lean(),
    ]);

    const blocks = [
        ...policies.map((p) => ({
            blockHeight: p.blockHeight,
            blockHash: p.blockHash,
            previousHash: p.previousHash,
            timestamp: p.createdAt,
            type: "POLICY",
            data: {
                policyId: p._id,
                policyType: p.policyType,
                premium: p.premium,
                coverageAmount: p.coverageAmount,
                status: p.status,
                startTime: p.startTime,
                endTime: p.endTime,
                riskClassification: p.riskClassification,
            },
            isVerified: p.isVerified,
        })),
        ...claims.map((c) => ({
            blockHeight: c.blockHeight,
            blockHash: c.blockHash,
            previousHash: c.previousHash,
            timestamp: c.createdAt,
            type: "CLAIM",
            data: {
                claimId: c._id,
                incidentType: c.incidentType,
                status: c.status,
                approvalConfidence: c.llmAnalysis?.approvalConfidence,
                fraudRisk: c.llmAnalysis?.fraudRisk,
                recommendation: c.llmAnalysis?.recommendation,
                payoutAmount: c.payoutAmount,
            },
            isVerified: c.isVerified,
        })),
    ];

    return blocks.sort((a, b) => (a.blockHeight || 0) - (b.blockHeight || 0));
}

/**
 * Verify chain integrity for a user
 * Returns { isValid, totalBlocks, invalidBlocks }
 */
export async function verifyChain(userId, existingChain = null) {
    const chain = existingChain || await getUserChain(userId);

    let isValid = true;
    const invalidBlocks = [];

    for (let i = 1; i < chain.length; i++) {
        const current = chain[i];
        const previous = chain[i - 1];

        if (current.previousHash !== previous.blockHash) {
            isValid = false;
            invalidBlocks.push(current.blockHeight);
        }
    }

    return {
        isValid,
        totalBlocks: chain.length,
        invalidBlocks,
    };
}
