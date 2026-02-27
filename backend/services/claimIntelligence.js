import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

/**
 * Claim Intelligence Service
 * Implements LLM + RAG for claim validation using Groq (Llama 3.3 + Llama 3.2 Vision)
 * Multimodal: cross-checks uploaded proof images against claim descriptions
 */

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Models
const TEXT_MODEL = "llama-3.3-70b-versatile";
const VISION_MODEL = "llama-3.2-90b-vision-preview";

// ============================================================
// RAG: Policy Clause Knowledge Base
// ============================================================
const POLICY_CLAUSES = [
    {
        clauseId: "PA-001",
        title: "Personal Accident Cover",
        keywords: ["accident", "injury", "hurt", "fall", "fracture", "crash", "collision", "hit", "road accident"],
        text: "Covers bodily injury caused directly and solely by accidental, external, violent means. Includes fractures, dislocations, and temporary/permanent disability. Claimant must provide medical certificate within 72 hours of incident.",
    },
    {
        clauseId: "ME-001",
        title: "Medical Emergency Expenses",
        keywords: ["medical", "hospital", "doctor", "treatment", "emergency", "ambulance", "surgery", "health", "illness", "sick"],
        text: "Reimburses emergency medical expenses incurred due to an accident during insured shift. Covers hospitalization, emergency treatment, pharmacy bills. Maximum limit: 30% of coverage amount. Bills must be original and from registered practitioners.",
    },
    {
        clauseId: "ED-001",
        title: "Equipment Damage Cover",
        keywords: ["equipment", "phone", "mobile", "bike", "vehicle", "helmet", "damaged", "broken", "stolen", "bag", "device"],
        text: "Covers accidental damage or theft of work equipment during the insured shift. Includes delivery bags, mobile phones, helmets, and bicycles. Excludes wear-and-tear or pre-existing damage. Photo evidence required.",
    },
    {
        clauseId: "TL-001",
        title: "Third Party Liability",
        keywords: ["third party", "liability", "damage to property", "caused damage", "damaged someone", "hit someone", "other person"],
        text: "Covers legal liability to third parties for bodily injury or property damage caused during the course of gig work. Valid only when worker is carrying out job duties. Limit: 5% of coverage amount per incident.",
    },
    {
        clauseId: "EX-001",
        title: "General Exclusions",
        keywords: ["drink", "alcohol", "drugs", "intentional", "pre-existing", "fraud", "false", "suicide", "war", "nuclear"],
        text: "Claims are excluded if the incident occurred due to: intoxication (alcohol/drugs), self-inflicted injury, pre-existing conditions, intentional acts, war or civil unrest. Any misrepresentation voids the claim.",
    },
    {
        clauseId: "EL-001",
        title: "Eligibility & Activation Rules",
        keywords: ["policy", "active", "inactive", "not active", "not online", "offline", "not working"],
        text: "Insurance is valid ONLY when the worker status is 'Online' and has an active policy for the current shift/day. Claims filed for incidents outside the active policy window will be rejected.",
    },
    {
        clauseId: "CL-001",
        title: "Claim Filing Process",
        keywords: ["file", "submit", "claim", "how to claim", "process", "document", "proof", "evidence"],
        text: "Submit claim within 48 hours of incident with: (1) incident description, (2) photographic/documentary evidence, (3) FIR copy if applicable, (4) medical records if applicable. AI-assisted review provides preliminary assessment within minutes.",
    },
];

/**
 * RAG: Retrieve relevant policy clauses by keyword matching
 */
export function retrieveRelevantClauses(claimDescription, incidentType = "") {
    const query = `${claimDescription} ${incidentType}`.toLowerCase();
    const words = query.split(/\s+/);

    const scored = POLICY_CLAUSES.map((clause) => {
        const matches = clause.keywords.filter((kw) =>
            words.some((word) => word.includes(kw) || kw.includes(word))
        );
        const relevanceScore = matches.length / clause.keywords.length;
        return { ...clause, relevanceScore: parseFloat(relevanceScore.toFixed(2)), matchedKeywords: matches };
    });

    return scored
        .filter((c) => c.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 3);
}


// ============================================================
// Helper: Fetch image from URL and convert to base64
// ============================================================
async function fetchImageAsBase64(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const contentType = response.headers.get("content-type") || "image/jpeg";
        return { base64, mimeType: contentType.split(";")[0] };
    } catch (err) {
        console.warn("Failed to fetch proof image:", err.message);
        return null;
    }
}


/**
 * LLM: Analyze claim using Groq API (multimodal — text + image via Llama Vision)
 * @param {string} description - claim description
 * @param {string} incidentType
 * @param {Array} retrievedClauses - from RAG
 * @param {string|null} proofUrl - Cloudinary URL of uploaded proof image
 * @returns {object} llmAnalysis with imageVerification field
 */
export async function analyzeClaim(description, incidentType, retrievedClauses, proofUrl = null) {
    try {
        const clauseContext = retrievedClauses
            .map((c) => `**${c.title}** (${c.clauseId}): ${c.text}`)
            .join("\n\n");

        const hasImage = !!proofUrl;

        const imageInstructions = hasImage
            ? `
IMAGE VERIFICATION (CRITICAL):
An image has been provided as proof. You MUST:
1. Describe what you see in the image
2. Assess whether the image content matches the claimed incident type ("${incidentType}")
3. Check if the image supports the worker's description: "${description}"
4. Look for fraud indicators: stock photos, screenshots, old images, inconsistencies
5. Rate image-description consistency as: MATCH / PARTIAL_MATCH / MISMATCH / SUSPICIOUS`
            : `\nNO IMAGE PROVIDED: The claimant did not upload proof. Factor this into your assessment.`;

        const prompt = `You are an AI insurance claim analyst for a gig worker micro-insurance platform. Analyze the following claim and respond ONLY with valid JSON.

CLAIM DETAILS:
- Incident Type: ${incidentType}
- Description: "${description}"
- Proof Image Uploaded: ${hasImage ? "YES" : "NO"}

RELEVANT POLICY CLAUSES:
${clauseContext || "No specific clauses retrieved. Apply general policy rules."}
${imageInstructions}

INSTRUCTIONS:
Analyze whether this claim is likely valid under the policy clauses above.
Assess for potential fraud indicators (inconsistency, vagueness, exaggeration).
${hasImage ? "Cross-check the uploaded image against the claim description." : ""}
Provide your analysis in this EXACT JSON format with no additional text:

{
  "summary": "2-3 sentence plain English summary of the claim and your assessment",
  "approvalConfidence": <integer 0-100>,
  "fraudRisk": "<LOW|MEDIUM|HIGH>",
  "recommendation": "<APPROVE|REVIEW|REJECT>",
  "analysisNotes": "Key factors that influenced your assessment",
  "imageVerification": {
    "imageProvided": ${hasImage},
    "imageDescription": "<what you see in the image, or 'No image uploaded'>",
    "matchesDescription": "<MATCH|PARTIAL_MATCH|MISMATCH|SUSPICIOUS|NO_IMAGE>",
    "imageNotes": "<specific observations about the proof image, or 'No proof submitted — recommend requesting evidence'>"
  }
}`;

        let result;

        if (hasImage) {
            // MULTIMODAL: Use Llama Vision model with image
            const imageData = await fetchImageAsBase64(proofUrl);
            if (imageData) {
                console.log(`📸 Proof image attached for Groq Vision analysis (${imageData.mimeType})`);
                result = await groq.chat.completions.create({
                    model: VISION_MODEL,
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: prompt },
                                {
                                    type: "image_url",
                                    image_url: {
                                        url: `data:${imageData.mimeType};base64,${imageData.base64}`,
                                    },
                                },
                            ],
                        },
                    ],
                    temperature: 0.3,
                    max_tokens: 2048,
                });
            } else {
                // Image fetch failed, fall back to text-only
                console.warn("⚠️ Could not fetch proof image, using text-only analysis");
                result = await groq.chat.completions.create({
                    model: TEXT_MODEL,
                    messages: [
                        { role: "system", content: "You are an AI insurance claim analyst. Respond only with valid JSON." },
                        { role: "user", content: prompt },
                    ],
                    temperature: 0.3,
                    max_tokens: 2048,
                });
            }
        } else {
            // TEXT-ONLY: Use fast text model
            result = await groq.chat.completions.create({
                model: TEXT_MODEL,
                messages: [
                    { role: "system", content: "You are an AI insurance claim analyst. Respond only with valid JSON." },
                    { role: "user", content: prompt },
                ],
                temperature: 0.3,
                max_tokens: 2048,
            });
        }

        const responseText = result.choices[0].message.content.trim();

        // Extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("No JSON found in LLM response");
        }

        const analysis = JSON.parse(jsonMatch[0]);

        // Validate and sanitize
        return {
            summary: analysis.summary || "Claim reviewed by AI system.",
            approvalConfidence: Math.min(100, Math.max(0, parseInt(analysis.approvalConfidence) || 50)),
            fraudRisk: ["LOW", "MEDIUM", "HIGH"].includes(analysis.fraudRisk) ? analysis.fraudRisk : "LOW",
            recommendation: ["APPROVE", "REVIEW", "REJECT"].includes(analysis.recommendation)
                ? analysis.recommendation
                : "REVIEW",
            analysisNotes: analysis.analysisNotes || "",
            imageVerification: {
                imageProvided: hasImage,
                imageDescription: analysis.imageVerification?.imageDescription || (hasImage ? "Image analysis unavailable" : "No image uploaded"),
                matchesDescription: analysis.imageVerification?.matchesDescription || (hasImage ? "PARTIAL_MATCH" : "NO_IMAGE"),
                imageNotes: analysis.imageVerification?.imageNotes || (hasImage ? "Automated image check" : "No proof submitted — recommend requesting evidence"),
            },
        };
    } catch (err) {
        console.error("LLM analysis failed:", err.message);
        return fallbackAnalysis(description, incidentType, retrievedClauses, !!proofUrl);
    }
}

/**
 * Fallback analysis when LLM API is unavailable
 */
function fallbackAnalysis(description, incidentType, retrievedClauses, hasImage = false) {
    const fraudKeywords = ["alcohol", "drink", "drugs", "intentional", "fake", "false"];
    const hasFraudIndicator = fraudKeywords.some((kw) =>
        description.toLowerCase().includes(kw)
    );

    const imageBonus = hasImage ? 10 : -10;
    const approvalConfidence = hasFraudIndicator
        ? 15
        : retrievedClauses.length > 0
            ? Math.min(95, 65 + imageBonus)
            : Math.min(95, 45 + imageBonus);
    const fraudRisk = hasFraudIndicator ? "HIGH" : hasImage ? "LOW" : "MEDIUM";

    return {
        summary: `AI review processed ${incidentType} claim. ${retrievedClauses.length} relevant policy clause(s) found. ${hasImage ? "Proof image uploaded." : "No proof image provided."} Manual review recommended.`,
        approvalConfidence,
        fraudRisk,
        recommendation: hasFraudIndicator ? "REJECT" : approvalConfidence > 60 ? "APPROVE" : "REVIEW",
        analysisNotes: `Automated fallback analysis. Groq API unavailable. ${hasImage ? "Proof image was uploaded but could not be AI-verified." : "No proof image — request evidence from claimant."} Please verify with manual review.`,
        imageVerification: {
            imageProvided: hasImage,
            imageDescription: hasImage ? "Image uploaded but AI verification unavailable" : "No image uploaded",
            matchesDescription: hasImage ? "PARTIAL_MATCH" : "NO_IMAGE",
            imageNotes: hasImage
                ? "Unable to verify image content — Groq unavailable. Manual review required."
                : "No proof submitted — recommend requesting photographic evidence.",
        },
    };
}
