/**
 * V12 CONSTITUTION — human authority routes (Article X).
 *
 * Every route here is behind authenticateAdmin: a verified human
 * administrator. This is the ONLY code path that constructs the
 * HumanAuthority capability — agents have no route to halt, resume,
 * or lift a sanction (§10.1, §11.3).
 *
 *   GET  /api/constitution/status               — anchor digest, version, halt + sanction state
 *   GET  /api/constitution/violations           — recent audit trail entries (§11.4)
 *   POST /api/constitution/halt                 — halt the ecosystem (no justification required, §10.1)
 *   POST /api/constitution/resume               — human restart (§11.1)
 *   POST /api/constitution/agents/:id/lift      — lift an agent suspension (§11.3, human-only)
 *   POST /api/constitution/tenants/:id/lift     — lift a tenant quarantine (§11.3, human-only)
 */
import { Router, Response } from 'express';
import { authenticateAdmin, AuthRequest } from '../domains/identity/auth.js';
import { all } from '../db.js';
import { constitutionEngine, constitutionStatus, humanAuthority } from '../constitution/engine.js';
import { ConstitutionError } from '../constitution/engine.core.js';

const router = Router();
router.use(authenticateAdmin);

function handle(res: Response, fn: () => void): void {
  try {
    fn();
    res.json({ ok: true, state: constitutionStatus().state });
  } catch (err) {
    if (err instanceof ConstitutionError) {
      res.status(err.code === 'ENGINE_UNAVAILABLE' ? 503 : 403).json({ error: err.message, code: err.code });
      return;
    }
    res.status(500).json({ error: 'Constitution operation failed' });
  }
}

router.get('/status', (_req: AuthRequest, res: Response) => {
  res.json(constitutionStatus());
});

router.get('/violations', async (_req: AuthRequest, res: Response) => {
  try {
    const rows = await all<unknown>(
      `SELECT * FROM constitution_violations ORDER BY at DESC LIMIT 100`, [],
    );
    res.json({ violations: rows });
  } catch {
    res.json({ violations: [] });
  }
});

router.post('/halt', (req: AuthRequest, res: Response) => {
  handle(res, () => {
    const reason = typeof req.body?.reason === 'string' ? req.body.reason : undefined;
    constitutionEngine().halt(humanAuthority(req.user!.id), reason);
  });
});

router.post('/resume', (req: AuthRequest, res: Response) => {
  handle(res, () => {
    constitutionEngine().resume(humanAuthority(req.user!.id));
  });
});

router.post('/agents/:id/lift', (req: AuthRequest, res: Response) => {
  handle(res, () => {
    constitutionEngine().liftAgentSuspension(humanAuthority(req.user!.id), String(req.params.id));
  });
});

router.post('/tenants/:id/lift', (req: AuthRequest, res: Response) => {
  handle(res, () => {
    constitutionEngine().liftTenantQuarantine(humanAuthority(req.user!.id), String(req.params.id));
  });
});

export default router;
