import express from "express";
import upload from "../middleware/upload.middleware.js";
import { uploadStatement } from "../controllers/statement.controller.js";

const router = express.Router();

router.post("/upload", upload.single("statement"), uploadStatement);

export default router;
