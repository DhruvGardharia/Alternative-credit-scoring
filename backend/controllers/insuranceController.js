import { assessRisk } from "../services/insuranceRiskEngine.js";
import { calculatePremium, getPolicyDuration } from "../services/premiumCalculator.js";
import { retrieveRelevantClauses, analyzeClaim } from "../services/claimIntelligence.js";
import { createPolicyBlock, createClaimBlock, getUserChain, verifyChain } from "../services/blockchainService.js";
import { processUssd } from "../services/ussdService.js";
import { InsurancePolicy } from "../models/InsurancePolicy.js";
import { InsuranceClaim } from "../models/InsuranceClaim.js";
import cloudinary from "cloudinary";
import fs from "fs";

// ─────────────────────────────────────────────
// GET /api/insurance/risk-assessment
// ─────────────────────────────────────────────
export const getRiskAssessment = async (req, res) => {
    try {
        const userId = req.user._id;
        const { policyType = "shift", locationZone = "urban" } = req.query;

        const riskAssessment = await assessRisk(userId, policyType, locationZone);

        // Calculate premiums for both policy types
        const shiftPremiumDetails = calculatePremium("shift", riskAssessment);
        const dailyPremiumDetails = calculatePremium("daily", riskAssessment);

        res.json({
            success: true,
            riskAssessment,
            premiumOptions: {
                shift: shiftPremiumDetails,
                daily: dailyPremiumDetails,
            },
        });
    } catch (error) {
        console.error("Risk assessment error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// POST /api/insurance/activate
// ─────────────────────────────────────────────
export const activatePolicy = async (req, res) => {
    try {
        const userId = req.user._id;
        const { policyType, locationZone = "urban" } = req.body;

        if (!["shift", "daily"].includes(policyType)) {
            return res.status(400).json({ success: false, message: "Invalid policy type. Use 'shift' or 'daily'" });
        }

        // Check for already active policy
        const existing = await InsurancePolicy.findOne({
            userId,
            status: "active",
            endTime: { $gt: new Date() },
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: "You already have an active insurance policy.",
                activePolicy: existing,
            });
        }

        // Run risk assessment & calculate premium
        const riskAssessment = await assessRisk(userId, policyType, locationZone);
        const premiumDetails = calculatePremium(policyType, riskAssessment);
        const { startTime, endTime } = getPolicyDuration(policyType);

        // Create policy record
        const policy = await InsurancePolicy.create({
            userId,
            policyType,
            status: "active",
            premium: premiumDetails.finalPremium,
            coverageAmount: premiumDetails.coverageAmount,
            premiumBreakdown: {
                basePremium: premiumDetails.basePremium,
                riskMultiplier: premiumDetails.premiumMultiplier,
                locationRiskFactor: premiumDetails.locationRiskFactor,
            },
            startTime,
            endTime,
            riskScore: riskAssessment.riskScore,
            riskClassification: riskAssessment.riskClassification,
            locationZone,
            workerStatus: "online",
        });

        // Create blockchain block
        const blockData = await createPolicyBlock(policy);

        // Fetch updated policy with blockchain data
        const updatedPolicy = await InsurancePolicy.findById(policy._id).lean();

        res.status(201).json({
            success: true,
            message: `${policyType === "shift" ? "Shift" : "Daily"} insurance activated successfully!`,
            policy: updatedPolicy,
            riskAssessment,
            premiumDetails,
            blockchain: blockData,
        });
    } catch (error) {
        console.error("Policy activation error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/insurance/active-policy
// ─────────────────────────────────────────────
export const getActivePolicy = async (req, res) => {
    try {
        const userId = req.user._id;
        const policy = await InsurancePolicy.findOne({
            userId,
            status: "active",
            endTime: { $gt: new Date() },
        }).lean();

        res.json({ success: true, policy: policy || null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/insurance/policies
// ─────────────────────────────────────────────
export const getPolicies = async (req, res) => {
    try {
        const userId = req.user._id;

        // Auto-expire old policies
        await InsurancePolicy.updateMany(
            { userId, status: "active", endTime: { $lt: new Date() } },
            { $set: { status: "expired" } }
        );

        const policies = await InsurancePolicy.find({ userId })
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, policies });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// POST /api/insurance/claim
// ─────────────────────────────────────────────
export const fileClaim = async (req, res) => {
    try {
        const userId = req.user._id;
        const { policyId, description, incidentType } = req.body;

        if (!policyId || !description || !incidentType) {
            return res.status(400).json({
                success: false,
                message: "policyId, description, and incidentType are required",
            });
        }

        // Validate policy exists and belongs to user
        const policy = await InsurancePolicy.findOne({ _id: policyId, userId });
        if (!policy) {
            return res.status(404).json({ success: false, message: "Policy not found" });
        }

        // Upload proof file to Cloudinary (if provided)
        let proofUrl = null;
        let proofPublicId = null;
        if (req.file) {
            try {
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: "insurance-claims",
                    resource_type: "auto",
                });
                proofUrl = result.secure_url;
                proofPublicId = result.public_id;
                fs.unlinkSync(req.file.path);
            } catch (uploadErr) {
                console.warn("Cloudinary upload failed:", uploadErr.message);
            }
        }

        // RAG: Retrieve relevant policy clauses
        const ragClauses = retrieveRelevantClauses(description, incidentType);

        // LLM: Analyze claim with Gemini (multimodal — text + proof image)
        const llmAnalysis = await analyzeClaim(description, incidentType, ragClauses, proofUrl);

        // Determine claim status from AI recommendation
        const statusMap = { APPROVE: "approved", REVIEW: "ai_reviewed", REJECT: "rejected" };
        const claimStatus = statusMap[llmAnalysis.recommendation] || "ai_reviewed";

        // Payout = % of coverage based on confidence
        const payoutAmount =
            llmAnalysis.recommendation === "APPROVE"
                ? Math.round((policy.coverageAmount * llmAnalysis.approvalConfidence) / 100)
                : 0;

        // Create claim
        const claim = await InsuranceClaim.create({
            policyId,
            userId,
            incidentType,
            description,
            proofUrl,
            proofPublicId,
            ragRetrievedClauses: ragClauses.map((c) => ({
                clauseId: c.clauseId,
                title: c.title,
                text: c.text,
                relevanceScore: c.relevanceScore,
            })),
            llmAnalysis,
            status: claimStatus,
            payoutAmount,
        });

        // Create blockchain block for claim
        const blockData = await createClaimBlock(claim);
        const updatedClaim = await InsuranceClaim.findById(claim._id).lean();

        res.status(201).json({
            success: true,
            message: "Claim filed and AI analysis complete",
            claim: updatedClaim,
            blockchain: blockData,
        });
    } catch (error) {
        console.error("Claim filing error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/insurance/claims
// ─────────────────────────────────────────────
export const getClaims = async (req, res) => {
    try {
        const userId = req.user._id;
        const claims = await InsuranceClaim.find({ userId })
            .populate("policyId", "policyType coverageAmount startTime endTime")
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, claims });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/insurance/blockchain-ledger
// ─────────────────────────────────────────────
export const getBlockchainLedger = async (req, res) => {
    try {
        const userId = req.user._id;
        const chain = await getUserChain(userId);
        const verification = await verifyChain(userId, chain);

        res.json({
            success: true,
            chain,
            verification,
            totalBlocks: chain.length,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// POST /api/insurance/ussd
// ─────────────────────────────────────────────
export const handleUssd = async (req, res) => {
    try {
        const { sessionId, phoneNumber, text } = req.body;
        const userId = req.user?._id || null;

        const response = await processUssd(sessionId || "demo-session", phoneNumber || "0000000000", text || "", userId);

        // Africa's Talking USSD response format
        res.set("Content-Type", "text/plain");
        res.send(response.message);
    } catch (error) {
        console.error("USSD error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/insurance/recommendations
// Calls the FastAPI AI microservice to get ranked
// insurance plan recommendations for this worker.
// ─────────────────────────────────────────────
export const getRecommendations = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = req.user;

        // Get the worker's credit profile for AI context
        const riskAssessment = await assessRisk(userId, "shift", "urban");

        // Build payload for FastAPI
        const payload = {
            user_id: userId.toString(),
            employment_type: user.employmentType || "delivery",
            risk_score: riskAssessment.riskScore,
            risk_classification: riskAssessment.riskClassification,
            avg_monthly_income: riskAssessment.scoreBreakdown?.incomeStability
                ? riskAssessment.scoreBreakdown.incomeStability * 500  // rough estimate
                : 15000,
            work_stability_score: riskAssessment.scoreBreakdown?.earningsTrend || 50,
            location_zone: req.query.locationZone || "urban",
            top_n: parseInt(req.query.topN) || 3,
        };

        // Call FastAPI microservice
        const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

        let fastApiResponse;
        try {
            const fetch = (await import("node-fetch")).default;
            const response = await fetch(`${FASTAPI_URL}/recommend`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(30000), // 30s timeout
            });

            if (!response.ok) {
                throw new Error(`FastAPI responded with ${response.status}`);
            }
            fastApiResponse = await response.json();
        } catch (fetchErr) {
            console.warn("FastAPI service unavailable:", fetchErr.message);
            // Return a graceful degradation response
            return res.json({
                success: true,
                serviceAvailable: false,
                message: "AI recommendation service is starting up. Please try again in a moment.",
                workerProfile: {
                    employment_type: user.employmentType || "delivery",
                    risk_classification: riskAssessment.riskClassification,
                    risk_score: riskAssessment.riskScore,
                },
                recommendations: [],
            });
        }

        res.json({
            success: true,
            serviceAvailable: true,
            ...fastApiResponse,
        });
    } catch (error) {
        console.error("Recommendations error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

