import express from "express";
import { register, login, getMe } from "../controllers/authController.js";
import { isAuth } from "../middlewares/isAuth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", isAuth, getMe);

export default router;
