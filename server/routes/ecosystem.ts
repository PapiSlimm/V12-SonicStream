/**
 * V12 ECOSYSTEM ROUTES — wired for SonicStream.
 *
 * All route logic lives in ecosystem.core.ts (dependency-injected, unit
 * tested). This file only binds it to SonicStream's config, database,
 * session issuing, and admin guard.
 *
 * Mounted in server.ts at /api/ecosystem. See ECOSYSTEM.md for the protocol.
 */
import { createEcosystemRouter, parsePeers } from './ecosystem.core.js';
import { config } from '../config.js';
import { get, run } from '../db.js';
import { JWTService } from '../domains/identity/jwt.service.js';
import { authenticateAdmin } from '../domains/identity/auth.js';
import { User } from '../types.js';
import { publishToFeeds, feedPeers, PUBLISHABLE_TYPES, PublishableType } from '../services/EcosystemPublisher.js';

const ecosystemRouter = createEcosystemRouter({
  secret: config.ECOSYSTEM_SECRET || undefined,
  appId: config.APP_ID,
  peers: parsePeers(config.V12_PEERS),

  findUserByEmail: async (email) => {
    const user = await get<User>('SELECT * FROM users WHERE LOWER(email) = ?', [email]);
    return user ? { id: (user as any).id, email: (user as any).email, name: (user as any).name } : undefined;
  },

  createUser: async ({ id, email, name }) => {
    await run(
      'INSERT INTO users (id, email, name, user_type) VALUES (?, ?, ?, ?)',
      [id, email, name, 'listener'],
    );
  },

  issueSession: ({ id, email }) =>
    JWTService.generateToken({ uid: id, email, type: 'access' }, '24h'),

  adminGuard: authenticateAdmin,
});

// ── Feed syndication (outbound fan-out; see services/EcosystemPublisher.ts) ──

/** GET /api/ecosystem/feeds — admin: configured feed destinations. */
ecosystemRouter.get('/feeds', authenticateAdmin, (_req, res) => {
  res.json({ app: config.APP_ID, peers: feedPeers(), publishableTypes: PUBLISHABLE_TYPES });
});

/**
 * POST /api/ecosystem/broadcast — admin: manually syndicate one event to every
 * configured peer feed. Body: { type, payload, subjectUserId?, rationale? }.
 */
ecosystemRouter.post('/broadcast', authenticateAdmin, async (req, res) => {
  const { type, payload, subjectUserId, rationale } = req.body ?? {};
  if (!PUBLISHABLE_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${PUBLISHABLE_TYPES.join(', ')}` });
  }
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ error: 'payload object is required' });
  }
  try {
    const outcome = await publishToFeeds(type as PublishableType, payload, {
      subjectUserId: typeof subjectUserId === 'string' ? subjectUserId : undefined,
      rationale: typeof rationale === 'string' ? rationale : 'manual broadcast by human administrator',
    });
    res.json(outcome);
  } catch (err) {
    res.status(409).json({ error: err instanceof Error ? err.message : 'broadcast failed' });
  }
});

export default ecosystemRouter;
