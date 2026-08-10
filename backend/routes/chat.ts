// backend/routes/chat.ts
import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware.ts';
import { getChatHistory, saveChatMessage, getOrCreateRoom } from '../services/chatService.ts';

const router = express.Router();

router.get('/:roomId', authenticateToken, async (req, res) => {
  try {
    const history = await getChatHistory(req.params.roomId);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history.' });
  }
});

router.post('/:roomId/message', authenticateToken, async (req: AuthRequest, res) => {
  const { content } = req.body;
  try {
    const msg = await saveChatMessage(req.params.roomId, req.user!.id, content);
    res.json(msg);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save message.' });
  }
});

router.get('/rooms/general', authenticateToken, async (req, res) => {
  try {
    const room = await getOrCreateRoom('general');
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get room.' });
  }
});

export default router;
