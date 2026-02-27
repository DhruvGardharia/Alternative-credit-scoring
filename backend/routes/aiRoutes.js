import express from "express";
import axios from "axios";
import { isAuth } from "../middlewares/isAuth.js";

const router = express.Router();

const GROK_URL = "https://api.x.ai/v1/chat/completions";

// Grok 3 models — available on new xAI accounts
const GROK_MODELS = ["grok-3-mini", "grok-3", "grok-3-fast"];

/**
 * POST /api/ai/chat
 * Proxy to xAI Grok. Keeps API key server-side.
 * Body: { messages: [{role, content}] }
 */
router.post("/chat", isAuth, async (req, res) => {
  const apiKey = process.env.GROK_API_KEY;

  if (!apiKey || apiKey === "your_grok_api_key_here") {
    return res.status(500).json({
      error: "GROK_API_KEY not set in root .env — add it and restart the backend.",
    });
  }

  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required" });
  }

  for (const model of GROK_MODELS) {
    try {
      const response = await axios.post(
        GROK_URL,
        { model, messages, max_tokens: 500, temperature: 0.7 },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          timeout: 30000,
          // Don't let axios throw on 4xx so we can inspect the body
          validateStatus: () => true,
        },
      );

      console.log(`[AI] model=${model} status=${response.status}`);

      if (response.status === 200) {
        const text = response.data?.choices?.[0]?.message?.content;
        if (text) return res.json({ success: true, text, model });
        return res.status(502).json({ error: "Grok returned empty content" });
      }

      const errMsg = response.data?.error?.message || JSON.stringify(response.data);
      console.error(`[AI] model=${model} error: ${errMsg}`);

      // 401 = invalid key, 429 = rate limit — stop immediately
      if (response.status === 401 || response.status === 429) {
        return res.status(response.status).json({ error: `Grok: ${errMsg}` });
      }

      // 400/404 = bad model name/params — try next model
    } catch (err) {
      console.error(`[AI] model=${model} exception:`, err.message);
    }
  }

  return res.status(502).json({
    error: "All Grok models failed — check backend terminal logs for exact error.",
  });
});

export default router;
