import express from "express";
import { upload } from "../middlewares/multer.js";
import { uploadStatement } from "../controllers/statementController.js";

const router = express.Router();

router.post("/upload", upload.single("statement"), uploadStatement);

export default router;
