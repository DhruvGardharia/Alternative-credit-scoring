import Conversation from "../models/conversationModel.js";
import chatLog from "../models/chatLogModel.js";
import {
  checkRateLimit,
  buildConversationContext,
  generateEmbedding,
  retrieveRelevantKnowledge,
  generateAIResponse,
} from "../services/aiService.js";

export const chatWithAI = async (req, res) => {
  try {
    const userId = req.user._id;
    const { message } = req.body;
    const role = req.user?.role || "worker";

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    await checkRateLimit(userId);

    let conversation = await Conversation.findOne({ userId });

    if (!conversation) {
      conversation = await Conversation.create({
        userId,
        role,
        messages: [],
      });
    }

    const conversationContext = buildConversationContext(conversation, message);
    const embedding = await generateEmbedding(message);
    const retrievedDocs = await retrieveRelevantKnowledge(embedding);
    const aiResponse = await generateAIResponse(retrievedDocs, conversationContext, role);

    conversation.messages.push({ sender: "user", text: message });
    conversation.messages.push({ sender: "assistant", text: aiResponse });
    await conversation.save();

    await chatLog.create({
      userId,
      conversationId: conversation._id,
      question: message,
      retrievedKnowledgeIds: retrievedDocs.map((doc) => doc._id),
      similarityScore: retrievedDocs[0]?.score || 1,
      response: aiResponse,
      confidence: retrievedDocs[0]?.score || 1,
    });

    return res.json({
      reply: aiResponse,
      confidence: retrievedDocs[0]?.score || 1,
    });

  } catch (error) {
    console.error("Chat error:", error.message);
    return res.status(400).json({ error: error.message });
  }
};