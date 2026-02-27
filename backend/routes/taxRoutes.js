import express from "express";
import {
  getAnnualTaxSummary,
  downloadTaxSummaryPdf,
} from "../controllers/taxController.js";
import { isAuth } from "../middlewares/isAuth.js";

const router = express.Router();

router.get("/annual-summary", isAuth, getAnnualTaxSummary);
router.get("/download-pdf", isAuth, downloadTaxSummaryPdf);

export default router;
