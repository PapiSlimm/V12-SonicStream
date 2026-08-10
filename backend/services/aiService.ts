// backend/services/aiService.ts
import { GoogleGenAI } from '@google/genai';
import prisma from '../db/client.ts';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const generateAIResponse = async (userId: string, conversationId: string | null, userMessage: string) => {
  let conversation;
  
  if (conversationId) {
    conversation = await prisma.aIConversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });
  }

  if (!conversation) {
    conversation = await prisma.aIConversation.create({
      data: { userId }
    });
  }

  // Save user message
  await prisma.aIMessage.create({
    data: {
      conversationId: conversation.id,
      role: 'user',
      content: userMessage
    }
  });

  // Get history for context
  const history = await prisma.aIMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'asc' },
    take: 10 // Last 10 messages for context
  });

  const response = await genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      ...history.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })),
      { role: 'user', parts: [{ text: userMessage }] }
    ]
  });
  
  const assistantResponse = response.text || "ERROR: NO RESPONSE GENERATED.";

  // Save assistant response
  const savedMsg = await prisma.aIMessage.create({
    data: {
      conversationId: conversation.id,
      role: 'assistant',
      content: assistantResponse
    }
  });

  return {
    conversationId: conversation.id,
    message: savedMsg
  };
};
