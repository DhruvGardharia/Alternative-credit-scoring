import express from "express";
import {
  getUserById,
  getAllUsers,
  uploadBankStatement,
  getFinancialSummary,
  generateCreditScore,
  getCreditScore,
  getUserProfile,
} from "../controllers/userController.js";
import { upload } from "../middlewares/multer.js";
import { isAuth } from "../middlewares/isAuth.js";

const router = express.Router();

// Protected user routes
router.get("/all", isAuth, getAllUsers);
router.get("/:id", isAuth, getUserById);
router.get("/profile/:userId", isAuth, getUserProfile);

// Bank statement routes
router.post("/upload-statement", isAuth, upload.single("bankStatement"), uploadBankStatement);
router.get("/financial-summary/:userId", isAuth, getFinancialSummary);

// Credit score routes
router.post("/generate-score", isAuth, generateCreditScore);
router.get("/credit-score/:userId", isAuth, getCreditScore);

export default router;