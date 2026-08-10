import { Router } from 'express';
import { run } from '../db.js';

const router = Router();

// Store Web Vitals
router.post('/vitals', async (req, res) => {
  const { name, value, delta, id, entries } = req.body;
  const tenantId = req.headers['x-tenant-id'] || 'default';
  
  try {
    // In a real app we might use a timeseries DB or BigQuery
    // Here we just log to the audit stream for now
    await run(
      'INSERT INTO event_logs (id, tenant_id, event_type, payload) VALUES (?, ?, ?, ?)',
      [
        `vit_${id}_${Date.now()}`,
        tenantId as string,
        `WEB_VITAL_${name}`,
        JSON.stringify({ value, delta, entries: entries?.length || 0 })
      ]
    );
    res.status(202).send();
  } catch (err) {
    console.error('Failed to log vital:', err);
    res.status(500).send();
  }
});

// Live Video Milestones Analytics Tracker
router.post('/video-progress', async (req, res) => {
  const { videoId, percentage, currentTime, duration, userId } = req.body;
  const tenantId = req.headers['x-tenant-id'] || 'default';
  
  try {
    await run(
      'INSERT INTO event_logs (id, tenant_id, event_type, payload) VALUES (?, ?, ?, ?)',
      [
        `vpr_${videoId}_${percentage}_${Date.now()}`,
        tenantId as string,
        'VIDEO_PROGRESS_MILESTONE',
        JSON.stringify({ videoId, percentage, currentTime, duration, userId, trackedAt: new Date().toISOString() })
      ]
    );
    console.log(`[Analytics] Tracked video milestone: Video ${videoId} is ${percentage}% completed by User ${userId || 'guest'}`);
    res.status(200).json({ success: true, message: 'Video progression logged successfully' });
  } catch (err) {
    console.error('Failed to log video progress:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Live Share Intent Analytics Tracker
router.post('/share-intent', async (req, res) => {
  const { videoId, song, creator, currentTime, duration, userId } = req.body;
  const tenantId = req.headers['x-tenant-id'] || 'default';
  
  try {
    await run(
      'INSERT INTO event_logs (id, tenant_id, event_type, payload) VALUES (?, ?, ?, ?)',
      [
        `vsh_${videoId}_${Date.now()}`,
        tenantId as string,
        'VIDEO_SHARE_INTENT',
        JSON.stringify({ videoId, song, creator, currentTime, duration, userId, trackedAt: new Date().toISOString() })
      ]
    );
    console.log(`[Analytics] Tracked video share intent: Video ${videoId} ("${song}" by ${creator}) shared by User ${userId || 'guest'}`);
    res.status(200).json({ success: true, message: 'Video share intent logged successfully' });
  } catch (err) {
    console.error('Failed to log video share intent:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
