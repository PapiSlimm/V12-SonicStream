import { Router } from 'express';
import { authenticateAdmin, AuthRequest } from '../domains/identity/auth.js';
import { AppError } from '../middleware/error.js';
import { runFactory, listReports, getReport, setReportStatus, agentRoster } from '../agents/AgentFactory.js';

/**
 * V12 AI Agent Factory — admin control surface.
 * Reports to V12 OS + NEXION; code-changing execution stays human-gated.
 */
const router = Router();

// The roster of specialized agents.
router.get('/agents', authenticateAdmin, (_req, res) => {
  res.json({ agents: agentRoster() });
});

// Kick off a full factory scan across every specialty.
router.post('/run', authenticateAdmin, async (_req, res) => {
  const report = await runFactory();
  res.json({ report });
});

// List recent reports.
router.get('/reports', authenticateAdmin, async (req, res) => {
  const limit = Math.min(Math.max(parseInt(String(req.query.limit)) || 25, 1), 100);
  res.json({ reports: await listReports(limit) });
});

// Fetch one report.
router.get('/reports/:id', authenticateAdmin, async (req, res) => {
  const report = await getReport(req.params.id);
  if (!report) throw new AppError('Report not found', 404);
  res.json({ report });
});

// Human approval gate (Article X/XI): approve a report for execution, or mark resolved.
router.post('/reports/:id/status', authenticateAdmin, async (req: AuthRequest, res) => {
  const status = String(req.body?.status || '');
  if (!['open', 'approved', 'resolved'].includes(status)) {
    throw new AppError('status must be open | approved | resolved', 400);
  }
  const existing = await getReport(req.params.id);
  if (!existing) throw new AppError('Report not found', 404);
  await setReportStatus(req.params.id, status as any);
  res.json({ id: req.params.id, status });
});

export default router;
