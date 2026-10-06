/**
 * BST Agent routes — /api/bst (2026-09-21).
 * The human console over the agent engine: run agents, review drafts,
 * publish/reject with one click, flip autopilot, read earnings.
 */
import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../identity/auth.js';
import { all, get, run } from '../../db.js';
import { AppError } from '../../middleware/error.js';
import { runBstAgentsForUser } from './bst.service.js';

const router = Router();
const uid = (req: AuthRequest) => req.user?.id;

/** Run the agents now: scan my catalog, stage new product drafts. */
router.post('/agents/run', authenticateToken, async (req: AuthRequest, res) => {
  const drafts = await runBstAgentsForUser(String(uid(req)));
  res.json({ success: true, draftsCreated: drafts.length, drafts });
});

/** My products (drafts + published), newest first. */
router.get('/products', authenticateToken, async (req: AuthRequest, res) => {
  const rows = await all(
    'SELECT * FROM bst_products WHERE user_id = ? ORDER BY created_at DESC LIMIT 200', [uid(req)]);
  res.json(rows || []);
});

/** Publish a draft — the human approval gate. */
router.post('/products/:id/publish', authenticateToken, async (req: AuthRequest, res) => {
  const p = await get<any>('SELECT * FROM bst_products WHERE id = ? AND user_id = ?', [req.params.id, uid(req)]);
  if (!p) throw new AppError('Product not found', 404);
  if (typeof req.body?.price === 'number' && req.body.price > 0) {
    await run('UPDATE bst_products SET price = ? WHERE id = ?', [req.body.price, req.params.id]);
  }
  await run("UPDATE bst_products SET status = 'published', published_at = CURRENT_TIMESTAMP WHERE id = ?", [req.params.id]);
  res.json({ success: true, id: req.params.id, status: 'published' });
});

/** Reject a draft (agents will not re-propose the same source). */
router.post('/products/:id/reject', authenticateToken, async (req: AuthRequest, res) => {
  const p = await get<any>('SELECT id FROM bst_products WHERE id = ? AND user_id = ?', [req.params.id, uid(req)]);
  if (!p) throw new AppError('Product not found', 404);
  await run("UPDATE bst_products SET status = 'rejected' WHERE id = ?", [req.params.id]);
  res.json({ success: true, id: req.params.id, status: 'rejected' });
});

/** Public storefront feed of published, agent-built products. */
router.get('/storefront', async (_req, res) => {
  const rows = await all(
    "SELECT id, user_id, kind, name, description, price, published_at FROM bst_products WHERE status = 'published' ORDER BY published_at DESC LIMIT 100");
  res.json(rows || []);
});

/** Earnings: what the agent-built shelf has actually sold. */
router.get('/earnings', authenticateToken, async (req: AuthRequest, res) => {
  const summary = await get<any>(
    `SELECT COUNT(*) as sales, COALESCE(SUM(amount),0) as gross, COALESCE(SUM(seller_revenue),0) as net
     FROM bst_sales WHERE seller_id = ?`, [uid(req)]);
  const recent = await all(
    'SELECT * FROM bst_sales WHERE seller_id = ? ORDER BY created_at DESC LIMIT 50', [uid(req)]);
  const published = await get<any>(
    "SELECT COUNT(*) as c FROM bst_products WHERE user_id = ? AND status = 'published'", [uid(req)]);
  res.json({
    sales: summary?.sales || 0,
    grossRevenue: summary?.gross || 0,
    netRevenue: summary?.net || 0,
    publishedProducts: published?.c || 0,
    recent: recent || [],
  });
});

/** Autopilot toggle: agents keep the draft shelf stocked; publishing stays yours. */
router.post('/autopilot', authenticateToken, async (req: AuthRequest, res) => {
  const enabled = req.body?.enabled ? 1 : 0;
  const existing = await get('SELECT user_id FROM bst_settings WHERE user_id = ?', [uid(req)]);
  if (existing) await run('UPDATE bst_settings SET autopilot = ? WHERE user_id = ?', [enabled, uid(req)]);
  else await run('INSERT INTO bst_settings (user_id, autopilot) VALUES (?, ?)', [uid(req), enabled]);
  res.json({ success: true, autopilot: !!enabled });
});
router.get('/autopilot', authenticateToken, async (req: AuthRequest, res) => {
  const row = await get<any>('SELECT autopilot FROM bst_settings WHERE user_id = ?', [uid(req)]);
  res.json({ autopilot: !!row?.autopilot, serviceArmed: process.env.ENABLE_BST_AUTOPILOT === 'true' });
});

export default router;
