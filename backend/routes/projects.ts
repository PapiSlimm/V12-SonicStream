import express from 'express';
import prisma from '../db/client.ts';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware.ts';

const router = express.Router();

// GET all projects for current user
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const projects = await prisma.project.findMany({
      where: { userId },
      include: { 
        brief: true,
        _count: { select: { assets: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET specific project details
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const project = await prisma.project.findFirst({
      where: { id, userId },
      include: {
        brief: true,
        assets: {
          include: {
            comments: true
          }
        }
      }
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// CREATE new project
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const project = await prisma.project.create({
      data: {
        name,
        description,
        userId
      }
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// UPDATE brief for project
router.post('/:id/brief', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { goals, targetAudience, visualReference, aiProposedStory } = req.body;
    const userId = req.user?.id;

    // Check ownership
    const project = await prisma.project.findFirst({ where: { id, userId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const brief = await prisma.brief.upsert({
      where: { projectId: id },
      update: { goals, targetAudience, visualReference, aiProposedStory },
      create: { projectId: id, goals, targetAudience, visualReference, aiProposedStory }
    });

    res.json(brief);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update brief' });
  }
});

// ADD asset to project
router.post('/:id/assets', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, url, type, stage } = req.body;
    const userId = req.user?.id;

    const project = await prisma.project.findFirst({ where: { id, userId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const asset = await prisma.asset.create({
      data: {
        projectId: id,
        name,
        url,
        type,
        stage: stage || 'Raw'
      }
    });

    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add asset' });
  }
});

// ADD comment to asset
router.post('/assets/:assetId/comments', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { assetId } = req.params;
    const { content, timestamp, frame } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const comment = await prisma.comment.create({
      data: {
        assetId,
        userId,
        content,
        timestamp,
        frame
      }
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// UPDATE project status with Identity check
router.patch('/:id/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Check ownership
    const project = await prisma.project.findFirst({ where: { id, userId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // IDENTITY CHECK for "Live" status
    if (status === 'Live') {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.isVerified) {
        return res.status(403).json({ 
          error: 'Verification Required', 
          message: 'You must complete V12 Identity Verification before setting a project to Live.' 
        });
      }
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: { status }
    });

    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project status' });
  }
});

export default router;
