import Knowledge from "../models/knowledgeModel.js";
import AIUsage from "../models/aiUsageModel.js";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MAX_REQUESTS = parseInt(process.env.MAX_AI_REQUESTS_PER_HOUR) || 20;

export const checkRateLimit = async (userId) => {
  const usage = await AIUsage.findOne({ userId });
  const now = new Date();

  if (!usage) {
    await AIUsage.create({ userId, requestCount: 1, windowStart: now });
    return;
  }

  const oneHour = 60 * 60 * 1000;

  if (now - usage.windowStart > oneHour) {
    usage.requestCount = 1;
    usage.windowStart = now;
    await usage.save();
    return;
  }

  if (usage.requestCount >= MAX_REQUESTS) {
    throw new Error("AI request limit exceeded.");
  }

  usage.requestCount += 1;
  await usage.save();
};

export const buildConversationContext = (conversation, newMessage) => {
  const lastMessages = conversation.messages.slice(-7);
  const contextText = lastMessages
    .map((msg) => `${msg.sender}: ${msg.text}`)
    .join("\n");
  return contextText + `\nuser: ${newMessage}`;
};

export const generateEmbedding = async (text) => {
  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${process.env.GEMINI_API_KEY}`,
    {
      content: { parts: [{ text }] },
    }
  );
  return response.data.embedding.values;
};

export const retrieveRelevantKnowledge = async (embedding) => {
  const results = await Knowledge.aggregate([
    {
      $vectorSearch: {
        index: "vector_index",
        path: "embedding",
        queryVector: embedding,
        numCandidates: 50,
        limit: 3,
      },
    },
    {
      $addFields: { score: { $meta: "vectorSearchScore" } },
    },
  ]);

  if (!results.length) {
    return await Knowledge.find({}).limit(3);
  }

  return results;
};

export const generateAIResponse = async (retrievedDocs, conversationContext, role) => {
  const knowledgeText = retrievedDocs.map((doc) => doc.content).join("\n\n");

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are a Credit Intelligence Assistant for a gig worker lending platform.
Answer questions about loans, credit scores, eligibility, interest rates, repayment, insurance, and tax.
Use ONLY the provided policy context. Be helpful and professional.
If not found say: "I cannot find this in our credit policies."

IMPORTANT: Detect the language of the user's message and reply in the SAME language.
If the user writes in Marathi, reply in Marathi.
If the user writes in Hindi, reply in Hindi.
If the user writes in English, reply in English.
Same for any other language.

User Role: ${role}
Policy Context:
${knowledgeText}

Conversation:
${conversationContext}`;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

