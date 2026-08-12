import { Router } from 'express';
import { all, get, run } from '../db.js';
import { authenticateAdmin } from '../domains/identity/auth.js';
import { Track, User, Payout, Booking, LedgerTransactionType } from '../types.js';
import { notify } from '../domains/social/notification.service.js';
import { LedgerService } from '../domains/finance/ledger.service.js';
import { AuditService } from '../services/AuditService.js';

const router = Router();

// All routes here require admin
router.use(authenticateAdmin);

router.get('/pending-tracks', async (req, res) => {
  const tracks = await all<Track>("SELECT * FROM tracks WHERE status = 'pending'");
  res.json(tracks);
});

router.post('/approve-track/:id', async (req, res) => {
  await run("UPDATE tracks SET status = 'live', moderation_status = 'approved' WHERE id = ?", [req.params.id]);
  
  const track = await get<Track>('SELECT * FROM tracks WHERE id = ?', [req.params.id]);
  if (track) {
    await notify(track.userId, 'track_approved', `Your track "${track.title}" has been approved and is now live!`);
  }
  
  res.json({ success: true });
});

router.post('/reject-track/:id', async (req, res) => {
  await run("UPDATE tracks SET status = 'rejected', moderation_status = 'rejected' WHERE id = ?", [req.params.id]);
  
  const track = await get<Track>('SELECT * FROM tracks WHERE id = ?', [req.params.id]);
  if (track) {
    await notify(track.userId, 'track_rejected', `Your track "${track.title}" has been rejected.`);
  }
  
  res.json({ success: true });
});

router.get('/bookings', async (req, res) => {
  const bookings = await all<Booking>('SELECT * FROM bookings ORDER BY created_at DESC');
  res.json(bookings);
});

router.post('/confirm-booking/:id', async (req, res) => {
  await run("UPDATE bookings SET status = 'confirmed' WHERE id = ?", [req.params.id]);
  
  const booking = await get<Booking>('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
  if (booking) {
    // Notify user
    await notify(booking.userId, 'booking_confirmed', `Your booking for artist ID ${booking.artist_id} has been confirmed!`);
    
    // Notify artist
    const artistUser = await get<{userId: string}>('SELECT user_id FROM artists WHERE id = ?', [booking.artist_id]);
    if (artistUser) {
      await notify(artistUser.userId, 'event_confirmed', `Your upcoming event with ${booking.customer_name} has been confirmed.`);
    }
  }
  
  res.json({ success: true });
});

router.get('/payout-requests', async (req, res) => {
  const payouts = await all<Payout>("SELECT * FROM payouts WHERE status = 'pending'");
  res.json(payouts);
});

router.post('/process-payout/:id', async (req, res) => {
  const { action } = req.body; // 'complete' or 'reject'
  const status = action === 'complete' ? 'completed' : 'failed';
  
  const payout = await get<any>('SELECT * FROM payouts WHERE id = ?', [req.params.id]);
  if (!payout) {
    return res.status(404).json({ error: 'Payout request not found.' });
  }

  await run('UPDATE payouts SET status = ? WHERE id = ?', [status, req.params.id]);

  if (action === 'reject') {
    // Reverse the payout ledger double-entry (Credit USER back, Debit PROCESSOR)
    await LedgerService.createBalancedTransaction({
      tenantId: payout.tenant_id || 'default',
      type: LedgerTransactionType.REFUND,
      description: `Reversal of rejected payout request #${req.params.id}`,
      entries: [
        { accountType: 'USER', userId: payout.user_id, amount: payout.amount }, // Credit back
        { accountType: 'PROCESSOR', amount: -payout.amount } // Debit processor
      ]
    });
    
    await AuditService.log('admin_system', 'payout_reject', 'payout', req.params.id, { amount: payout.amount });
    await notify(payout.user_id, 'payout_failed', `Your payout request of $${payout.amount} was rejected and funds have been returned to your available balance.`);
  } else {
    await AuditService.log('admin_system', 'payout_approve', 'payout', req.params.id, { amount: payout.amount });
    await notify(payout.user_id, 'payout_paid', `Your payout request of $${payout.amount} has been successfully processed and paid!`);
  }

  res.json({ success: true, status });
});

router.get('/users', async (req, res) => {
  const users = await all<User>('SELECT id, email, name, user_type, is_pro, balance, email_verified, avatar_url, created_at FROM users');
  res.json(users);
});

router.patch('/users/:id', async (req, res) => {
  const { name, userType, isPro, balance } = req.body;
  const updates: string[] = [];
  const params: any[] = [];

  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (userType !== undefined) { updates.push('user_type = ?'); params.push(userType); }
  if (isPro !== undefined) { updates.push('is_pro = ?'); params.push(isPro ? 1 : 0); }
  if (balance !== undefined) { updates.push('balance = ?'); params.push(balance); }

  if (updates.length > 0) {
    params.push(req.params.id);
    await run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  const updatedUser = await get<User>('SELECT * FROM users WHERE id = ?', [req.params.id]);
  res.json(updatedUser);
});

router.delete('/users/:id', async (req, res) => {
  await run('DELETE FROM users WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

router.get('/stats', async (req, res) => {
  const userCount = await get<{count: number}>('SELECT COUNT(*) as count FROM users');
  const trackCount = await get<{count: number}>('SELECT COUNT(*) as count FROM tracks');
  res.json({ users: userCount?.count, tracks: trackCount?.count });
});

router.get('/export/users', async (req, res) => {
  const users = await all<User>('SELECT id, email, name, user_type, balance FROM users');
  const format = req.query.format || 'json';
  
  if (format === 'csv') {
    const header = 'id,email,name,userType,balance\n';
    const rows = users.map(u => `${u.id},${u.email},${u.name},${u.userType},${u.balance}`).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    return res.send(header + rows);
  }
  
  res.json(users);
});

router.get('/delivery-jobs', async (req, res) => {
  const jobs = await all<any>(`
    SELECT dj.*, t.title as track_title, u.name as artist_name 
    FROM delivery_jobs dj 
    JOIN tracks t ON dj.track_id = t.id 
    JOIN users u ON t.user_id = u.id 
    ORDER BY dj.created_at DESC
  `);
  res.json(jobs);
});

router.patch('/delivery-jobs/:id', async (req, res) => {
  const { status } = req.body;
  await run('UPDATE delivery_jobs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, req.params.id]);
  
  // Notify artist if completed
  if (status === 'completed') {
    const job = await get<{trackId: number, platformName: string}>('SELECT track_id, platform_name FROM delivery_jobs WHERE id = ?', [req.params.id]);
    const track = await get<{userId: string, title: string}>('SELECT user_id, title FROM tracks WHERE id = ?', [job?.trackId]);
    if (track && job) {
      await notify(track.userId, 'distribution_completed', `Your track "${track.title}" is now live on ${job.platformName}!`);
    }
  }
  
  res.json({ success: true });
});

router.get('/compliance/takedowns', async (req, res) => {
  const takedowns = await all(`
    SELECT td.*, t.title as trackTitle, u.email as reporterEmail
    FROM copyright_takedowns td
    JOIN tracks t ON td.track_id = t.id
    JOIN users u ON td.reporter_id = u.id
    WHERE td.status = 'pending'
  `);
  res.json(takedowns);
});

router.get('/compliance/metadata', async (req, res) => {
  const issues = await all(`
    SELECT id, title, isrc, upc, artist, moderation_status
    FROM tracks
    WHERE (isrc IS NULL OR upc IS NULL OR moderation_status = 'pending')
    LIMIT 50
  `);
  
  const withErrors = issues.map((i: any) => ({
    ...i,
    errors: [!i.isrc ? 'Missing ISRC' : null, !i.upc ? 'Missing UPC' : null].filter(Boolean)
  }));
  
  res.json(withErrors);
});

import { DynamicPricingService, PricingContext } from '../domains/finance/dynamic-pricing.service.js';

router.post('/compliance/:type/:id/:action', async (req, res) => {
  const { type, id, action } = req.params;
  
  if (type === 'takedown') {
    const status = action === 'approve' ? 'accepted' : 'rejected';
    await run('UPDATE copyright_takedowns SET status = ? WHERE id = ?', [status, id]);
    if (action === 'approve') {
      const td = await get<{ track_id: number }>('SELECT track_id FROM copyright_takedowns WHERE id = ?', [id]);
      if (td) await run("UPDATE tracks SET status = 'removed', takedown_status = 'removed' WHERE id = ?", [td.track_id]);
    }
  } else if (type === 'metadata') {
    const status = action === 'approve' ? 'approved' : 'rejected';
    await run('UPDATE tracks SET moderation_status = ? WHERE id = ?', [status, id]);
  }
  
  res.json({ success: true });
});

// REVENUE SIMULATOR
router.post('/revenue/simulate', async (req, res) => {
  const { users, conversionRate, avgRevenuePerUser, churnRate, growthRate, months } = req.body;
  
  const simulation = DynamicPricingService.simulateRevenue({
    users: users || 1000,
    conversionRate: conversionRate || 0.05,
    avgRevenuePerUser: avgRevenuePerUser || 15,
    churnRate: churnRate || 0.02,
    growthRate: growthRate || 0.1,
    months: months || 12
  });

  res.json(simulation);
});

// DYNAMIC FEE CALCULATION
router.post('/calculate-fee', async (req, res) => {
  const ctx: PricingContext = req.body;
  const fee = DynamicPricingService.calculateMarketplaceFee(ctx);
  res.json({ fee, percentage: (fee * 100).toFixed(2) + '%' });
});

// INTEGRATION & DIAGNOSTIC TESTS
import { exec as cpExec } from 'child_process';
router.get('/diagnostics', async (req, res) => {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    database: { status: 'unknown' },
    ffmpeg: { status: 'unknown', version: '' },
    queues: { status: 'unknown' }
  };

  // 1. Check Database
  try {
    const dbTest = await get('SELECT 1 as test');
    diagnostics.database = { status: 'healthy', result: dbTest };
  } catch (err: any) {
    diagnostics.database = { status: 'error', error: err.message };
  }

  // 2. Validate FFmpeg Deployment
  await new Promise<void>((resolve) => {
    cpExec('ffmpeg -version', (err, stdout, _stderr) => {
      if (_stderr) {
        console.log('[FFmpeg diagnostics info]', _stderr);
      }
      if (err) {
        diagnostics.ffmpeg = { 
          status: 'error', 
          error: err.message, 
          details: 'FFmpeg command not found in host path or execution permission denied.' 
        };
      } else {
        const versionLine = stdout.split('\n')[0] || '';
        diagnostics.ffmpeg = { 
          status: 'healthy', 
          version: versionLine.trim() 
        };
      }
      resolve();
    });
  });

  // 3. Queue state status checks
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    diagnostics.queues = {
      status: 'active',
      mode: redisUrl.includes('localhost') || redisUrl === '' ? 'in-memory-simulation' : 'redis-bullmq',
      redisUrl
    };
  } catch (err: any) {
    diagnostics.queues = { status: 'error', error: err.message };
  }

  res.json(diagnostics);
});

// System settings routes
router.get('/settings', async (req, res) => {
  try {
    const settingsList = await all<{ setting_key: string; setting_value: string }>(
      'SELECT setting_key, setting_value FROM system_settings'
    );
    const settingsMap = settingsList.reduce((acc, curr) => {
      acc[curr.setting_key] = curr.setting_value;
      return acc;
    }, {} as Record<string, string>);
    res.json(settingsMap);
  } catch (err: any) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Failed to retrieve system settings' });
  }
});

router.post('/settings', async (req, res) => {
  const settings = req.body;
  try {
    for (const [key, value] of Object.entries(settings)) {
      const existing = await get('SELECT 1 FROM system_settings WHERE setting_key = ?', [key]);
      if (existing) {
        await run('UPDATE system_settings SET setting_value = ? WHERE setting_key = ?', [String(value), key]);
      } else {
        await run('INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)', [key, String(value)]);
      }
    }
    await AuditService.log('admin_system', 'update_settings', 'system_settings', 'all', settings);
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (err: any) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'Failed to update system settings' });
  }
});

export default router;
