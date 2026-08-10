import { Router } from 'express';
import { all, run, get } from '../../db.js';
import { authenticateToken, AuthRequest } from '../identity/auth.js';
import { Notification } from '../../types.js';
import { z } from 'zod';
import { sendSMS, sendPush, triggerCampaignChannel } from './notification.service.js';

const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  const notifications = await all<Notification>('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [req.user?.id]);
  res.json(notifications);
});

router.post('/read', authenticateToken, async (req: AuthRequest, res) => {
  await run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user?.id]);
  res.json({ success: true });
});

router.post('/:id/read', authenticateToken, async (req: AuthRequest, res) => {
  await run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user?.id]);
  res.json({ success: true });
});

router.get('/preferences', authenticateToken, async (req: AuthRequest, res) => {
  let prefs = await get<any>('SELECT * FROM notification_preferences WHERE user_id = ?', [req.user?.id]);
  if (!prefs) {
    await run('INSERT INTO notification_preferences (user_id) VALUES (?)', [req.user?.id]);
    prefs = await get<any>('SELECT * FROM notification_preferences WHERE user_id = ?', [req.user?.id]);
  }
  res.json(prefs);
});

router.post('/preferences', authenticateToken, async (req: AuthRequest, res) => {
  const { bookings, royalties, distribution } = z.object({
    bookings: z.number().min(0).max(1),
    royalties: z.number().min(0).max(1),
    distribution: z.number().min(0).max(1),
  }).parse(req.body);

  await run(
    'UPDATE notification_preferences SET bookings = ?, royalties = ?, distribution = ? WHERE user_id = ?',
    [bookings, royalties, distribution, req.user?.id]
  );
  res.json({ success: true });
});

// REGISTER PHONE & MOBILE PUSH TOKEN (React Native / Expo Compatibility)
router.post('/register-mobile', authenticateToken, async (req: AuthRequest, res) => {
  const { phone, pushToken } = z.object({
    phone: z.string().optional(),
    pushToken: z.string().optional(),
  }).parse(req.body);

  const userId = req.user?.id ? req.user.id.toString() : '';

  if (phone && userId) {
    await run('UPDATE users SET phone = ? WHERE id = ?', [phone, userId]);
    await sendSMS(userId, 'Welcome to SonicStream! Your mobile channel is successfully verified for royalty payouts and instant push updates.');
  }
  if (pushToken && userId) {
    await run('UPDATE users SET push_token = ? WHERE id = ?', [pushToken, userId]);
    await sendPush(userId, 'SonicStream Link Established', 'Push notification token is successfully configured for device alerts.');
  }

  res.json({ success: true, message: 'Mobile devices contact channels registered successfully and verified.' });
});

// MARKETING OUTREACH CAMPAIGNS (CREATOR CRM / AUTOMATION)
router.post('/campaigns', authenticateToken, async (req: AuthRequest, res) => {
  const { name, triggerType, subject, body, targetSegment } = z.object({
    name: z.string(),
    triggerType: z.enum(['SMS', 'PUSH', 'OMNICHANNEL']),
    subject: z.string().optional(),
    body: z.string(),
    targetSegment: z.enum(['all', 'pro', 'listeners']).optional(),
  }).parse(req.body);

  const campaignId = `cmp_${Math.random().toString(36).substr(2, 9)}`;
  await run(
    'INSERT INTO marketing_campaigns (id, artist_id, name, trigger_type, subject, body, target_segment, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [campaignId, req.user?.id, name, triggerType, subject || '', body, targetSegment || 'all', 'draft']
  );

  res.json({ success: true, campaignId });
});

router.post('/campaigns/:id/trigger', authenticateToken, async (req: AuthRequest, res) => {
  const result = await triggerCampaignChannel(req.params.id);
  res.json({ success: result });
});

router.get('/campaigns', authenticateToken, async (req: AuthRequest, res) => {
  const campaigns = await all<any>('SELECT * FROM marketing_campaigns WHERE artist_id = ? ORDER BY created_at DESC', [req.user?.id]);
  res.json(campaigns);
});

router.get('/campaigns/:id/logs', authenticateToken, async (req: AuthRequest, res) => {
  const logs = await all<any>(
    'SELECT cs.*, u.name, u.email FROM campaign_subscribers cs JOIN users u ON cs.user_id = u.id WHERE cs.campaign_id = ?',
    [req.params.id]
  );
  res.json(logs);
});

export default router;

