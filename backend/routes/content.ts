// backend/routes/content.ts
import express from 'express';
import prisma from '../db/client.ts';
import { authenticateToken } from '../middleware/authMiddleware.ts';

const router = express.Router();

router.get('/posts', async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts.' });
  }
});

router.post('/posts', authenticateToken, async (req, res) => {
  const { title, content, published } = req.body;
  try {
    const post = await prisma.post.create({
      data: { title, content, published }
    });
    res.json(post);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create post.' });
  }
});

export default router;
