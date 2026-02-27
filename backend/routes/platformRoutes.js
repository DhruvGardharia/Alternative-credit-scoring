/**
 * Platform Routes
 */

import express from "express";
import {
  connectPlatform,
  getConnectedPlatforms,
  disconnectPlatform
} from "../controllers/platformController.js";

const router = express.Router();

// Connect to a platform
router.post("/connect", connectPlatform);

// Disconnect from a platform
router.post("/disconnect", disconnectPlatform);

// Get connected platforms for a user
router.get("/connected/:userId", getConnectedPlatforms);

export default router;
