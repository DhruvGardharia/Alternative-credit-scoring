import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { isAuth } from "../middlewares/isAuth.js";
import {
    getRiskAssessment,
    activatePolicy,
    getActivePolicy,
    getPolicies,
    fileClaim,
    getClaims,
    getBlockchainLedger,
    handleUssd,
    getRecommendations,
} from "../controllers/insuranceController.js";

const router = express.Router();

// Multer for claim proof uploads (images, PDFs)
const claimsUploadsDir = "uploads/insurance-claims";
if (!fs.existsSync(claimsUploadsDir)) {
    fs.mkdirSync(claimsUploadsDir, { recursive: true });
}

const claimStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, claimsUploadsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const claimUpload = multer({
    storage: claimStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error("Only images and PDFs are allowed for claim proof"), false);
    },
});

// ── Risk Assessment ──────────────────────────────────────────
// GET /api/insurance/risk-assessment?policyType=shift&locationZone=urban
router.get("/risk-assessment", isAuth, getRiskAssessment);

// ── Policy Management ────────────────────────────────────────
// POST /api/insurance/activate   { policyType, locationZone }
router.post("/activate", isAuth, activatePolicy);

// GET /api/insurance/active-policy
router.get("/active-policy", isAuth, getActivePolicy);

// GET /api/insurance/policies
router.get("/policies", isAuth, getPolicies);

// ── Claims ────────────────────────────────────────────────────
// POST /api/insurance/claim   (multipart: policyId, description, incidentType, proof?)
router.post("/claim", isAuth, claimUpload.single("proof"), fileClaim);

// GET /api/insurance/claims
router.get("/claims", isAuth, getClaims);

// ── Blockchain Ledger ─────────────────────────────────────────
// GET /api/insurance/blockchain-ledger
router.get("/blockchain-ledger", isAuth, getBlockchainLedger);

// ── USSD Gateway ──────────────────────────────────────────────
// POST /api/insurance/ussd   (Africa's Talking format + auth for sim)
router.post("/ussd", isAuth, handleUssd);

// ── AI Plan Recommendations (calls FastAPI microservice) ───────
// GET /api/insurance/recommendations?topN=3&locationZone=urban
router.get("/recommendations", isAuth, getRecommendations);

export default router;
