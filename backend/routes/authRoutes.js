import express from "express";
import { register, login, getMe, verifyOtp, forgotPassword, resetPassword } from "../controllers/authController.js";
import { isAuth } from "../middlewares/isAuth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp/:token", verifyOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/me", isAuth, getMe);

export default router;
