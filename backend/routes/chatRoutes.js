// routes/chatRoutes.js

import express from "express";
import { chatWithAI } from "../controllers/chatController.js";
import { isAuth } from "../middlewares/isAuth.js";

const router = express.Router();

router.post("/chat", isAuth, chatWithAI);

export default router;