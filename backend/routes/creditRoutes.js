import express from "express";
import { generateCreditScore } from "../controllers/credit.controller.js";

const router = express.Router();

router.post("/generate", generateCreditScore);

export default router;
