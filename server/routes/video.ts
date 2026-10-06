import express from 'express';
import Replicate from 'replicate';
import { authenticateToken } from '../domains/identity/auth.js';
import { logger } from '../middleware/error.js';
import { get, run } from '../db.js';

const router = express.Router();

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Generate Video using Replicate
router.post('/generate', authenticateToken, async (req, res) => {
  const { prompt, aspect_ratio, resolution } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    logger.info(`[Replicate] Generating video for prompt: ${prompt}`);
    
    // Using a popular video generation model on Replicate
    // Example: luma/ray-v1
    const prediction = await replicate.predictions.create({
      version: "7393439401563f89a9c54e0a44274718501e74728510a775196395e5b328678f", // Luma Ray v1
      input: {
        prompt: prompt,
        aspect_ratio: aspect_ratio || "16:9",
        resolution: resolution || "720p",
      },
    });

    res.json({ id: prediction.id, status: prediction.status });
  } catch (error) {
    logger.error('[Replicate] Generation error:', error);
    res.status(500).json({ error: 'Failed to start video generation' });
  }
});

// Refine Video using Replicate
router.post('/refine', authenticateToken, async (req, res) => {
  const { video_url, prompt, filter } = req.body;

  if (!video_url) {
    return res.status(400).json({ error: 'Video URL is required' });
  }

  try {
    logger.info(`[Replicate] Refining video with prompt: ${prompt}`);
    
    // Using a video-to-video or refinement model
    // Example: lucataco/animate-diff-video-to-video
    const prediction = await replicate.predictions.create({
      version: "850e0594-8628-449e-b873-1383741548e6", // Placeholder version
      input: {
        video: video_url,
        prompt: `${prompt}${filter ? `, style: ${filter}` : ''}`,
      },
    });

    res.json({ id: prediction.id, status: prediction.status });
  } catch (error) {
    logger.error('[Replicate] Refinement error:', error);
    res.status(500).json({ error: 'Failed to start video refinement' });
  }
});

// Check Prediction Status
router.get('/status/:id', authenticateToken, async (req, res) => {
  try {
    const prediction = await replicate.predictions.get(req.params.id);
    res.json(prediction);
  } catch (error) {
    logger.error('[Replicate] Status check error:', error);
    res.status(500).json({ error: 'Failed to check prediction status' });
  }
});

// Store a new compilation bundle
router.post('/compilations', async (req, res) => {
  try {
    const { trackIds } = req.body;
    if (!trackIds || !Array.isArray(trackIds)) {
      return res.status(400).json({ error: 'trackIds must be an array of numbers' });
    }

    const cleanTrackIds = trackIds.map(id => parseInt(id, 10)).filter(Number.isInteger);
    const compilationId = `comp_${Math.random().toString(36).slice(2, 11)}`;

    await run(
      'INSERT INTO video_compilations (id, track_ids) VALUES (?, ?)',
      [compilationId, JSON.stringify(cleanTrackIds)]
    );

    logger.info(`[Compilation] Saved compilation ${compilationId} with tracks: ${cleanTrackIds.join(', ')}`);

    res.status(201).json({ id: compilationId, trackIds: cleanTrackIds });
  } catch (error) {
    logger.error('[Compilation] Failed to save compilation:', error);
    res.status(500).json({ error: 'Failed to save compilation bundle' });
  }
});

// Retrieve a compilation bundle
router.get('/compilations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const row = await get<{ track_ids: string }>(
      'SELECT track_ids FROM video_compilations WHERE id = ?',
      [id]
    );

    if (!row) {
      return res.status(404).json({ error: 'Compilation bundle not found' });
    }

    res.json({ id, trackIds: JSON.parse(row.track_ids) });
  } catch (error) {
    logger.error('[Compilation] Failed to retrieve compilation:', error);
    res.status(500).json({ error: 'Failed to retrieve compilation bundle' });
  }
});

// Check generation status by fetching the real prediction from Replicate.
// Previously this ignored the :id param entirely and returned hardcoded
// example.com URLs for every request - it always claimed "ready" even for
// jobs that were still processing, failed, or never existed.
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const prediction = await replicate.predictions.get(id);

    if (!prediction) {
      return res.status(404).json({ error: 'Video generation job not found' });
    }

    const outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    const isReady = prediction.status === 'succeeded' && !!outputUrl;

    res.json({
      id,
      title: 'Generated Video',
      status: prediction.status,
      hls_url: isReady ? outputUrl : null,
      dash_url: null, // Replicate output is a direct file, not HLS/DASH packaged
      thumbnail_url: isReady ? `https://picsum.photos/seed/${id}/640/360` : null,
      error: prediction.error ?? null,
    });
  } catch (error) {
    logger.error('[Replicate] Failed to fetch video status:', error);
    res.status(500).json({ error: 'Failed to fetch video metadata' });
  }
});

export default router;
