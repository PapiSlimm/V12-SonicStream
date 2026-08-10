// backend/routes/ai.ts
import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware.ts';
import { generateAIResponse } from '../services/aiService.ts';

const router = express.Router();

router.post('/chat', authenticateToken, async (req: AuthRequest, res) => {
  const { message, conversationId } = req.body;
  try {
    const response = await generateAIResponse(req.user!.id, conversationId, message);
    res.json(response);
  } catch (error) {
    console.error('AI Route Error:', error);
    res.status(500).json({ error: 'AI generation failed.' });
  }
});

export default router;
