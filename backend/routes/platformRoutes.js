/**
 * Platform Routes
 */

import express from "express";
import {
  connectPlatform,
  getConnectedPlatforms
} from "../controllers/platformController.js";

const router = express.Router();

// Connect to a platform
router.post("/connect", connectPlatform);

// Get connected platforms for a user
router.get("/connected/:userId", getConnectedPlatforms);

export default router;
