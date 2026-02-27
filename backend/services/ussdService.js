/**
 * USSD Service
 * Processes USSD menu inputs for the insurance module.
 * Simulates a *123# interactive menu for feature-phone accessibility.
 */

import { InsurancePolicy } from "../models/InsurancePolicy.js";
import { InsuranceClaim } from "../models/InsuranceClaim.js";

// USSD Session store (in-memory for demo; use Redis in production)
const sessions = new Map();

/**
 * Process a USSD request
 * @param {string} sessionId - unique session identifier
 * @param {string} phoneNumber - worker's phone number
 * @param {string} text - accumulated USSD input (e.g., "1*2" for menu chain)
 * @param {string} userId - resolved from auth
 */
export async function processUssd(sessionId, phoneNumber, text, userId) {
    const inputs = text ? text.split("*") : [];
    const level = inputs.length;

    // ---- Level 0: Main Menu ----
    if (!text || text === "") {
        sessions.set(sessionId, { userId, step: "main" });
        return {
            type: "response",
            message:
                "CON Welcome to GigShield Insurance (*123#)\n" +
                "1. Activate Insurance\n" +
                "2. Check Policy Status\n" +
                "3. Track Claim\n" +
                "4. Exit",
        };
    }

    const [first, second] = inputs;

    // ---- Level 1: Main menu selections ----
    if (level === 1) {
        if (first === "1") {
            return {
                type: "response",
                message:
                    "CON Select Insurance Type:\n" +
                    "1. Shift Insurance (8hrs) - from ₹15\n" +
                    "2. Daily Insurance (Full Day) - from ₹40\n" +
                    "0. Back",
            };
        }

        if (first === "2") {
            // Check active policy
            const policy = await InsurancePolicy.findOne({
                userId,
                status: "active",
                endTime: { $gt: new Date() },
            }).lean();

            if (policy) {
                const remaining = Math.max(
                    0,
                    Math.round((new Date(policy.endTime) - new Date()) / 60000)
                );
                return {
                    type: "end",
                    message:
                        `END Active Policy Found!\n` +
                        `Type: ${policy.policyType === "shift" ? "Shift" : "Daily"}\n` +
                        `Coverage: ₹${policy.coverageAmount?.toLocaleString()}\n` +
                        `Premium Paid: ₹${policy.premium}\n` +
                        `Risk: ${policy.riskClassification}\n` +
                        `Time Remaining: ${remaining} min`,
                };
            } else {
                return {
                    type: "end",
                    message:
                        "END No active insurance policy.\n" +
                        "Dial *123*1# to activate now.",
                };
            }
        }

        if (first === "3") {
            // Check latest claim
            const claim = await InsuranceClaim.findOne({ userId })
                .sort({ createdAt: -1 })
                .lean();

            if (claim) {
                const confidence = claim.llmAnalysis?.approvalConfidence || "N/A";
                const fraud = claim.llmAnalysis?.fraudRisk || "N/A";
                return {
                    type: "end",
                    message:
                        `END Latest Claim Status:\n` +
                        `Type: ${claim.incidentType}\n` +
                        `Status: ${claim.status.toUpperCase()}\n` +
                        `AI Confidence: ${confidence}%\n` +
                        `Fraud Risk: ${fraud}\n` +
                        `Recommendation: ${claim.llmAnalysis?.recommendation || "PENDING"}`,
                };
            } else {
                return {
                    type: "end",
                    message: "END No claims found for your account.",
                };
            }
        }

        if (first === "4") {
            sessions.delete(sessionId);
            return {
                type: "end",
                message: "END Thank you for using GigShield Insurance. Stay safe!",
            };
        }
    }

    // ---- Level 2: Activate sub-menu ----
    if (level === 2 && first === "1") {
        if (second === "1" || second === "2") {
            const type = second === "1" ? "shift" : "daily";
            return {
                type: "end",
                message:
                    `END Activation Request Received!\n` +
                    `Type: ${type === "shift" ? "Shift (8 hrs)" : "Full Day"}\n` +
                    `Status: Processing...\n\n` +
                    `Please open the GigShield app to confirm activation and premium deduction.\n` +
                    `Your risk-based premium will be displayed in the app.`,
            };
        }

        if (second === "0") {
            return {
                type: "response",
                message:
                    "CON Welcome to GigShield Insurance (*123#)\n" +
                    "1. Activate Insurance\n" +
                    "2. Check Policy Status\n" +
                    "3. Track Claim\n" +
                    "4. Exit",
            };
        }
    }

    // Fallback
    sessions.delete(sessionId);
    return {
        type: "end",
        message: "END Invalid selection. Dial *123# to start again.",
    };
}
