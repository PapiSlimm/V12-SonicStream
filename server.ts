import dotenv from 'dotenv';
dotenv.config();
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local' });
}

import express from 'express';
import type { Express } from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import Redis from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';
import { getApps, deleteApp } from 'firebase-admin/app';
import { config, allowedOrigins } from './server/config.js';
import { initDB, closeDB, get as pingDB, run as dbRun, get as dbGet } from './server/db.js';
import sanitizeHtml from 'sanitize-html';
import { LRUCache } from 'lru-cache';
import { z } from 'zod';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { authenticateToken } from './server/domains/identity/auth.js';
import { auth as firebaseAuth } from './server/firebase-admin.js';
import { errorHandler, logger } from './server/middleware/error.js';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';
import { metricsMiddleware, register, serviceHealth } from './server/monitoring.js';
import { canaryMiddleware } from './server/canary.js';
import { sentryHandler, sentryErrorHandler } from './server/middleware/sentry.js';
import { Server } from 'socket.io';
import http from 'http';
import { getWritablePath } from './server/utils/storage.js';
import { highlightWorker } from './server/services/HighlightWorker.js';
import { registry } from './server/services/ServiceRegistry.js';
import { PlatformBrain } from './server/services/PlatformBrain.js';
import { startRSSAutomation, stopRSSAutomation } from './server/services/rssService.js';
import { RecommendationEngine } from './server/services/RecommendationEngine.js';
import { initRedis, closeRedis, initWorker, connection as redisConnection } from './server/jobs.js';
import { runMigrations } from './server/services/MigrationService.js';
import { initializeFirebase } from './server/services/firebase.js';

// Routers (Identity)
import userRouter from './server/domains/identity/user.routes.js';

// Routers (Music)
import tracksRouter from './server/domains/music/tracks.routes.js';
import playlistsRouter from './server/domains/music/playlists.routes.js';

// Routers (Social)
import socialRouter from './server/domains/social/social.routes.js';
import roomsRouter from './server/domains/social/rooms.routes.js';
import notificationsRouter from './server/domains/social/notifications.routes.js';

// Routers (Finance)
import paymentsRouter from './server/domains/finance/payments.routes.js';
import royaltiesRouter from './server/domains/finance/royalties.routes.js';

// Routers (Events)
import eventsRouter from './server/domains/events/events.routes.js';
import bookingsRouter from './server/domains/events/bookings.routes.js';

// Routers (Other)
import adminRouter from './server/routes/admin.js';
import printingRouter from './server/routes/printing.js';
import aiRouter from './server/routes/ai.js';
import crmRouter from './server/routes/crm.js';
import affiliatesRouter from './server/routes/affiliates.js';
import aiJobsRouter from './server/routes/aijobs.js';
import integrationsRouter from './server/routes/integrations.js';
import marketingRouter from './server/routes/marketing.js';
import artistRouter from './server/routes/artist.js';
import searchRouter from './server/routes/search.js';
import payoutsRouter from './server/domains/finance/payouts.routes.js';
import recommendationsRouter from './server/routes/recommendations.js';
import aiPlaylistRouter from './server/routes/ai-playlist.js';
import bandcampRouter from './server/routes/bandcamp.js';
import creditsRouter from './server/routes/credits.js';
import billingRouter from './server/domains/finance/billing.routes.js';
import curationRouter from './server/routes/curation.js';
import radioRouter from './server/routes/radio.js';
import assetsRouter from './server/routes/assets.js';
import rssRouter from './server/routes/rss.js';
import videoRouter from './server/routes/video.js';
import sitemapRouter from './server/routes/sitemap.js';
import analyticsRouter from './server/routes/analytics.js';
import brainRouter from './server/routes/brain.js';
import legalRouter, { ingestionFirewall } from './server/routes/legal.js';
import bandcampWebhookRouter from './server/routes/bandcamp-webhook.js';
import stripeWebhookRouter from './server/routes/webhooks.js';
import marketplaceRouter from './server/routes/marketplace.js';
import tenantRouter from './server/routes/tenants.js';
import ecosystemRouter from './server/routes/ecosystem.js';
import constitutionRouter from './server/routes/constitution.js';
import { initConstitution, constitutionGuard } from './server/constitution/engine.js';
import { initEcosystemPublisher } from './server/services/EcosystemPublisher.js';
import { createFeedIntake } from './ecosystem/v12-feed-intake.js';
import designAgentRouter from './server/routes/design-agent.js';
import monetizeRouter from './server/routes/monetize.js';
import { rateLimit as customRateLimit } from './server/middleware/rateLimit.js';

let io: Server;
let httpServer: http.Server | null = null;

function initApp(app: Express) {
  // 1. VERY TOP: Stripe/Bandcamp Webhooks need raw body
  app.post('/api/bandcamp/webhook', express.raw({ type: 'application/json' }), bandcampWebhookRouter);
  app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhookRouter);

  // V12 ecosystem feed intake — raw-body HMAC route, must precede the JSON
  // parser. Receives R.M.P.M marketing suggestions/campaign records and any
  // peer envelopes: GET /api/ecosystem/feed/inbox to review them.
  app.use('/api/ecosystem/feed', createFeedIntake({ serviceId: 'sonicstream' }));

  // Trust proxy for rate limiter
  app.set('trust proxy', 1);

  app.use(cors({
    origin: config.NODE_ENV === 'production' ? allowedOrigins : true,
    credentials: true,
  }));

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          "default-src": ["'self'"],
          // Scripts: only our own bundles and Stripe.js. No unsafe-inline - index.html
          // has no inline executable scripts (verified; the ld+json block is data, not code).
          "script-src": ["'self'", "https://js.stripe.com"],
          // framer-motion and React set inline style attributes; Google Fonts stylesheet.
          "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
          // User-generated content (avatars, product images, cover art) legitimately
          // points at many hosts: GCS, Unsplash, QR service, Replicate outputs.
          "img-src": ["'self'", "data:", "blob:", "https:"],
          "media-src": ["'self'", "blob:", "https://storage.googleapis.com", "https://*.replicate.delivery"],
          "connect-src": [
            "'self'",
            "wss:",
            "https://*.googleapis.com",       // Firebase auth/Firestore/GCS
            "https://oauth2.googleapis.com",
            "https://api.stripe.com",
            "https://api.spotify.com",
            "https://api.qrserver.com",
            "https://*.replicate.delivery",
          ],
          "frame-src": ["'self'", "https://js.stripe.com", "https://hooks.stripe.com", "https://*.firebaseapp.com", "https://accounts.google.com"],
          "worker-src": ["'self'", "blob:"],
          "object-src": ["'none'"],
          "base-uri": ["'self'"],
          "form-action": ["'self'", "https://checkout.stripe.com"],
          // frame-ancestors is deliberately NOT set here: the middleware below sets it
          // per-host (preview iframes on run.app vs. DENY on production domains).
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" }
    })
  );

  // Dynamic Security Headers custom middleware to safely align with Cloud Run & AI Studio environments
  app.use((req, res, next) => {
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(self)');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const host = req.get('host') || '';
    if (host.includes('run.app') || host.includes('localhost') || host.includes('127.0.0.1')) {
      // In development/preview container, support the nested preview iframe
      res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://*.google.com https://*.run.app https://ai.studio");
    } else {
      // Enforce strict production policies on custom domains
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
    }
    next();
  });

  app.use(compression());

  // Set larger bodies limit for AI/art route, smaller for general
  app.use('/api/ai', express.json({ limit: '10mb' }));
  app.use(express.json({ limit: '1mb' }));

  // Create necessary directories (regardless of environment to avoid write failures)
  const dirs = ['uploads/temp', 'uploads/social', 'uploads/mastered', 'uploads/streams', 'uploads/avatars'];
  dirs.forEach(dir => {
    const fullDir = getWritablePath(dir);
    if (!fs.existsSync(fullDir)) {
      fs.mkdirSync(fullDir, { recursive: true });
    }
  });

  // Serve static uploads using absolute STORAGE_BASE_DIR paths to shield from local directory changes
  app.use('/uploads', express.static(getWritablePath('uploads'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.mpd')) {
        res.setHeader('Content-Type', 'application/dash+xml');
      }
    }
  }));
}

function initSecurity(app: Express) {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api/auth', limiter);
  app.use('/api/ai', limiter);

  // V12 Constitution, Art. X §10.2: a halt takes effect before the next
  // action. While halted, every mutating /api call is denied except the
  // constitution routes (human resume) and health checks.
  app.use('/api', constitutionGuard);

  // Re-ordered middleware so metrics wraps FIRST for total request timing!
  app.use(metricsMiddleware);
  app.use(sentryHandler);
  app.use(canaryMiddleware);

  function updateServiceHealthGauges() {
    const dbReady = registry.has('database');
    const redisReadyStatus = registry.has('redis');
    const rssReadyStatus = registry.has('rss');
    const platBrainReadyStatus = registry.has('platformBrain');
    const recEngineReadyStatus = registry.has('recommendationEngine');
    const workerReadyStatus = registry.has('worker');

    let firebaseReadyStatus = false;
    if (registry.has('firebase')) {
      const fbService = registry.get('firebase');
      firebaseReadyStatus = typeof fbService?.ready === 'function' ? fbService.ready() : !!fbService?.ready;
    }

    let stripeReadyStatus = false;
    if (registry.has('stripe')) {
      const stripeService = registry.get('stripe');
      stripeReadyStatus = typeof stripeService?.ready === 'function' ? stripeService.ready() : !!stripeService?.ready;
    }

    let aiReadyStatus = false;
    const geminiService = registry.has('gemini') ? registry.get('gemini') : null;
    const openaiService = registry.has('openai') ? registry.get('openai') : null;
    const isGeminiReady = typeof geminiService?.ready === 'function' ? geminiService.ready() : !!geminiService?.ready;
    const isOpenaiReady = typeof openaiService?.ready === 'function' ? openaiService.ready() : !!openaiService?.ready;
    aiReadyStatus = isGeminiReady || isOpenaiReady;

    serviceHealth.set({ service: 'database' }, dbReady ? 1 : 0);
    serviceHealth.set({ service: 'redis' }, redisReadyStatus ? 1 : 0);
    serviceHealth.set({ service: 'firebase' }, firebaseReadyStatus ? 1 : 0);
    serviceHealth.set({ service: 'stripe' }, stripeReadyStatus ? 1 : 0);
    serviceHealth.set({ service: 'ai' }, aiReadyStatus ? 1 : 0);
    serviceHealth.set({ service: 'rss' }, rssReadyStatus ? 1 : 0);
    serviceHealth.set({ service: 'platformBrain' }, platBrainReadyStatus ? 1 : 0);
    serviceHealth.set({ service: 'recommendations' }, recEngineReadyStatus ? 1 : 0);
    serviceHealth.set({ service: 'worker' }, workerReadyStatus ? 1 : 0);

    return {
      database: dbReady,
      redis: redisReadyStatus,
      rss: rssReadyStatus,
      platformBrain: platBrainReadyStatus,
      recommendations: recEngineReadyStatus,
      worker: workerReadyStatus,
      firebase: firebaseReadyStatus,
      stripe: stripeReadyStatus,
      ai: aiReadyStatus
    };
  }

  app.get('/metrics', async (req, res) => {
    updateServiceHealthGauges();
    if (config.NODE_ENV === 'production') {
      return authenticateToken(req as any, res, async () => {
        const user = (req as any).user;
        if (user?.userType !== 'admin') {
          return res.status(403).json({ error: 'Admin access required' });
        }
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
      });
    }
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });
}

function initRoutes(app: Express) {
  // =========================================================================
  // API GATEWAY - ROUTING LAYER (TARGET DECOUPLED ARCHITECTURE)
  // =========================================================================
  const gateway = express.Router();

  // 1. IDENTITY SERVICE
  // Manages Authentication, User Records, and RBAC Profiles
  const identityService = express.Router();
  identityService.use('/users', userRouter);
  identityService.get('/status', (req, res) => {
    res.json({ success: true, service: 'Identity Service', status: 'online', rbac: 'enabled' });
  });
  gateway.use('/identity', identityService);

  // 2. COMMERCE SERVICE
  // Manages Marketplace storefronts, print Orders, and payment intents
  const commerceService = express.Router();
  commerceService.use('/marketplace', marketplaceRouter);
  commerceService.use('/orders', printingRouter);
  commerceService.use('/payments', paymentsRouter);
  commerceService.get('/status', (req, res) => {
    res.json({ success: true, service: 'Commerce Service', status: 'online' });
  });
  gateway.use('/commerce', commerceService);

  // 3. CREATOR CORE SERVICE
  // Manages Artist profiles, local CRM databases, and fans follows
  const creatorCoreService = express.Router();
  creatorCoreService.use('/profiles', artistRouter);
  creatorCoreService.use('/crm', crmRouter);
  creatorCoreService.use('/followers', socialRouter);
  creatorCoreService.use('/rooms', roomsRouter);
  creatorCoreService.use('/notifications', notificationsRouter);
  creatorCoreService.get('/status', (req, res) => {
    res.json({ success: true, service: 'Creator Core Service', status: 'online' });
  });
  gateway.use('/creator', creatorCoreService);

  // 4. EVENT BUS (REDIS CORE ROUTER)
  // Mediates events, pub/sub triggers and queue workers
  const eventBusService = express.Router();
  eventBusService.get('/status', (req, res) => {
    const isRedisReady = redisConnection && redisConnection.status === 'ready';
    res.json({
      success: true,
      service: 'Event Bus (Redis)',
      connection: isRedisReady ? 'connected' : 'mock-in-memory',
      queues: ['ai_jobs_pipeline', 'rss_updates', 'analytics_stream'],
      active_workers: {
        ai_jobs_retry_worker: config.ENABLE_AI_WORKERS ? 'active' : 'idle',
        platform_brain_worker: config.ENABLE_PLATFORM_BRAIN ? 'active' : 'idle',
        recommendation_worker: config.ENABLE_RECOMMENDATIONS ? 'active' : 'idle',
        rss_auto_worker: config.ENABLE_RSS_AUTOMATION ? 'active' : 'idle'
      }
    });
  });
  gateway.use('/event-bus', eventBusService);

  // 5. AI SERVICE
  // Recommendations, Smart playlists, AI studio generation & asynchronous jobs
  const aiService = express.Router();
  aiService.use('/recommendations', recommendationsRouter);
  
  // Combine all AI-powered features
  const aiStudioRouter = express.Router();
  aiStudioRouter.use('/', aiRouter);
  aiStudioRouter.use('/jobs', aiJobsRouter);
  aiStudioRouter.use('/playlist', aiPlaylistRouter);
  aiService.use('/ai-studio', aiStudioRouter);
  aiService.get('/status', (req, res) => res.json({ success: true, service: 'AI Service', status: 'online' }));
  gateway.use('/ai-service', aiService);

  // 6. CONTENT SERVICE
  // Coordinates low-latency track streams, radio streams, and live video renders
  const contentService = express.Router();
  
  const streamingRouter = express.Router();
  streamingRouter.use('/tracks', tracksRouter);
  streamingRouter.use('/playlists', playlistsRouter);
  streamingRouter.use('/radio', radioRouter);
  streamingRouter.use('/video', videoRouter);
  contentService.use('/streaming', streamingRouter);

  const mediaPipelineRouter = express.Router();
  mediaPipelineRouter.use('/assets', assetsRouter);
  mediaPipelineRouter.use('/rss', rssRouter);
  mediaPipelineRouter.use('/curation', curationRouter);
  mediaPipelineRouter.use('/bandcamp', bandcampRouter);
  contentService.use('/media-pipeline', mediaPipelineRouter);
  
  contentService.get('/status', (req, res) => {
    res.json({ success: true, service: 'Content Service', status: 'online' });
  });
  gateway.use('/content', contentService);

  // 7. BOOKING SERVICE
  // Event ticketing and premium venue allocations
  const bookingService = express.Router();
  bookingService.use('/ticketing', eventsRouter);
  bookingService.use('/venue-management', bookingsRouter);
  bookingService.get('/status', (req, res) => {
    res.json({ success: true, service: 'Booking Service', status: 'online' });
  });
  gateway.use('/bookings', bookingService);

  // 8. FINANCIAL SERVICE
  // Multi-ledger wallets, artist royalties, payouts reviews, and affiliate credits
  const financialService = express.Router();
  financialService.use('/wallet-ledger', billingRouter);
  financialService.use('/royalties', royaltiesRouter);
  financialService.use('/payouts', payoutsRouter);
  financialService.use('/affiliates', affiliatesRouter);
  financialService.use('/credits', creditsRouter);
  financialService.get('/status', (req, res) => {
    res.json({ success: true, service: 'Financial Service', status: 'online' });
  });
  gateway.use('/financial', financialService);

  // 9. ANALYTICS SERVICE
  // General metrics tracking, smart attribution logs, and BI engine insights
  const analyticsService = express.Router();
  analyticsService.use('/metrics', analyticsRouter);
  analyticsService.use('/bi', brainRouter);
  analyticsService.get('/attribution', (req, res) => {
    res.json({
      success: true,
      service: 'Analytics Attribution Hub',
      channels: ['organic', 'bandcamp', 'print_marketplace', 'radio_syndication']
    });
  });
  gateway.use('/analytics', analyticsService);

  // Mount API Gateway on /api/v1
  app.use('/api/v1', gateway);

  // API Gateway Pattern: Domain-Based Routing (v2) - Future-proofing
  const apiV2 = express.Router();
  apiV2.get('/info', (req, res) => {
    res.json({
      version: 'v2',
      status: 'preview',
      documentation: 'https://sonicstream.com/docs/v2',
      notice: 'API version 2 is in dynamic developer preview. Production default remains v1.'
    });
  });
  app.use('/api/v2', apiV2);

  // Direct unique legacy endpoints fallback (maintains complete compatibility with existing client requests)
  app.use('/api/admin', adminRouter);
  app.use('/api/printing', printingRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/crm', crmRouter);
  app.use('/api/affiliates', affiliatesRouter);
  app.use('/api/ai-jobs', aiJobsRouter);
  app.use('/api/integrations', integrationsRouter);
  app.use('/api/marketing', marketingRouter);
  app.use('/api/artist', artistRouter);
  app.use('/api/search', searchRouter);
  app.use('/api/credits', creditsRouter);
  app.use('/api/recommendations', recommendationsRouter);
  app.use('/api/ai/playlist', aiPlaylistRouter);
  app.use('/api/bandcamp', bandcampRouter);
  app.use('/api/curation', curationRouter);
  app.use('/api/radio', radioRouter);
  app.use('/api/assets', assetsRouter);
  app.use('/api/rss', rssRouter);
  app.use('/api/video', videoRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/brain', brainRouter);
  app.use('/api/legal', legalRouter);
  app.use('/api/marketplace', customRateLimit({ max: 60 }), marketplaceRouter);
  app.use('/api/tenants', customRateLimit({ max: 60 }), tenantRouter);

  // V12 Ecosystem interconnect: ping + SSO handoff (service-token auth,
  // fail-closed when ECOSYSTEM_SECRET is unset). See ECOSYSTEM.md.
  app.use('/api/ecosystem', customRateLimit({ max: 60 }), ecosystemRouter);

  // V12 Constitution: human authority routes (admin-only halt/resume/status).
  app.use('/api/constitution', customRateLimit({ max: 30 }), constitutionRouter);

  // Web builder design agent: generate/refine in place + AI warehouse & factory.
  app.use('/api/design-agent', customRateLimit({ max: 30 }), designAgentRouter);

  // Monetization: terms, earning avenues, all-in pricing, top-20 social
  // sharing, radio sponsorships — accounted via Headless Financial.
  app.use('/api/monetize', customRateLimit({ max: 60 }), monetizeRouter);

  // Legacy direct layout compatibility
  app.use('/api/v1/identity', userRouter);

  // Flat-path compatibility (2026-07): the client API layer calls these
  // namespaces directly (/api/user/profile, /api/tracks, ...) while the domain
  // gateway serves them under /api/v1/*. The /api/user/profile 404 was bouncing
  // every signed-in user back to the landing page. Mount both conventions.
  app.use('/api/user', userRouter);
  app.use('/api/users', userRouter);
  app.use('/api/tracks', tracksRouter);
  app.use('/api/playlists', playlistsRouter);
  app.use('/api/bookings', bookingsRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/events', eventsRouter);

  // New Event Highlights Service routes
  app.get('/api/events/:id/highlights', async (req, res) => {
    try {
      const { id } = req.params;
      const clips = await highlightWorker.getHighlightsForEvent(id);
      res.json(clips);
    } catch {
      res.status(500).json({ error: 'Failed to fetch highlights' });
    }
  });

  app.post('/api/events/:id/highlights/trigger', async (req, res) => {
    try {
      const { id } = req.params;
      const { score } = req.body || { score: 5 };
      await (highlightWorker as any).generateHighlightClip(id, score || 5);
      const clips = await highlightWorker.getHighlightsForEvent(id);
      res.json({ success: true, clips });
    } catch {
      res.status(500).json({ error: 'Failed to trigger highlight' });
    }
  });

  app.use('/', sitemapRouter);

  // Liveness Probe Check
  app.get('/health/live', (req, res) => {
    res.json({
      status: 'ok'
    });
  });

  // GET /health/brain endpoint for direct PlatformBrain monitoring
  app.get('/health/brain', (req, res) => {
    if (PlatformBrain.status === 'healthy') {
      res.status(200).json({ status: 'healthy', brain: 'PlatformBrain online' });
    } else {
      res.status(503).json({ status: 'unhealthy', error: `PlatformBrain status: ${PlatformBrain.status}` });
    }
  });

  // Readiness Probe Check using ServiceRegistry flags for deterministic health monitoring
  app.get('/health/ready', (req, res) => {
    const health = updateServiceHealthGauges();
    res.json(health);
  });

  let lastHealthCheckTime = 0;
  let cachedHealthResult: {
    db: string;
    redis: string;
    firebase: string;
  } | null = null;

  // Real Database Health Check accuracy & Redis health verification with lightweight caching (15s TTL)
  app.get('/api/health', async (req, res) => {
    const now = Date.now();
    const CACHE_TTL_MS = 15000; // 15 seconds

    if (!cachedHealthResult || (now - lastHealthCheckTime) > CACHE_TTL_MS) {
      let dbStatus = 'disconnected';
      try {
        await pingDB('SELECT 1');
        dbStatus = 'connected';
      } catch (e) {
        dbStatus = `error: ${e instanceof Error ? e.message : 'unknown'}`;
      }

      let redisStatus = 'disconnected';
      try {
        if (redisConnection && redisConnection.status === 'ready') {
          await redisConnection.ping();
          redisStatus = 'connected';
        } else if (redisConnection) {
          redisStatus = `active (${redisConnection.status})`;
        } else {
          redisStatus = 'mock/in-memory';
        }
      } catch (e) {
        redisStatus = `error: ${e instanceof Error ? e.message : 'unknown'}`;
      }

      let firebaseStatus = 'unconfigured';
      if (registry.has('firebase')) {
        const fbService = registry.get('firebase');
        const isFbReady = typeof fbService?.ready === 'function' ? fbService.ready() : !!fbService?.ready;
        if (isFbReady) {
          const verified = typeof fbService?.verify === 'function' ? await fbService.verify().catch(() => false) : false;
          firebaseStatus = verified ? 'connected' : 'active (unverified)';
        } else {
          firebaseStatus = 'failed';
        }
      }

      cachedHealthResult = {
        db: dbStatus,
        redis: redisStatus,
        firebase: firebaseStatus
      };
      lastHealthCheckTime = now;
    }

    res.json({ 
      status: 'ok', 
      db: cachedHealthResult.db,
      redis: cachedHealthResult.redis,
      firebase: cachedHealthResult.firebase,
      environment: config.NODE_ENV,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  // Explicitly namespace API 404 routes catch-all so they do not fall back to Vite SPA HTML
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: 'API route not found' });
  });

  app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send(`User-agent: *
Allow: /
Sitemap: ${config.APP_URL || 'https://sonicstream.com'}/sitemap.xml`);
  });

  app.get('/docs', (req, res) => {
    const docsPath = config.NODE_ENV === 'production'
      ? path.join(process.cwd(), 'dist', 'docs.html')
      : path.join(process.cwd(), 'public', 'docs.html');
    res.sendFile(docsPath);
  });

  app.get('/pricing', (req, res) => {
    res.redirect(301, '/#pricing');
  });
}

interface PollOption {
  id: string;
  text: string;
  votes: number;
}
interface LivePoll {
  id: string;
  question: string;
  options: PollOption[];
}

async function getOrCreatePoll(roomId: string): Promise<LivePoll> {
  const row = await dbGet<{ roomId: string; id: string; question: string; options: string }>(
    'SELECT * FROM active_polls WHERE roomId = ?',
    [roomId]
  );
  if (row) {
    try {
      const parsedOptions = JSON.parse(row.options);
      return {
        id: row.id,
        question: row.question,
        options: parsedOptions
      };
    } catch (err) {
      logger.error(`Failed to parse poll options for room ${roomId}:`, err);
    }
  }

  // Create default fallback poll if not found
  const defaultPoll: LivePoll = {
    id: `poll-${roomId}`,
    question: "Which highlight track should the artist stream next?",
    options: [
      { id: "1", text: "Electric Overdrive (Hardwave)", votes: 142 },
      { id: "2", text: "Midnight Reflection (Synthwave)", votes: 94 },
      { id: "3", text: "Stardust Horizon (Trance VIP)", votes: 215 }
    ]
  };

  await dbRun(
    'REPLACE INTO active_polls (roomId, id, question, options) VALUES (?, ?, ?, ?)',
    [roomId, defaultPoll.id, defaultPoll.question, JSON.stringify(defaultPoll.options)]
  ).catch(async () => {
    await dbRun(
      'INSERT INTO active_polls (roomId, id, question, options) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE id = ?, question = ?, options = ?',
      [roomId, defaultPoll.id, defaultPoll.question, JSON.stringify(defaultPoll.options), defaultPoll.id, defaultPoll.question, JSON.stringify(defaultPoll.options)]
    ).catch(() => {
      // ignore
    });
  });

  return defaultPoll;
}

async function savePoll(roomId: string, poll: LivePoll): Promise<void> {
  await dbRun(
    'REPLACE INTO active_polls (roomId, id, question, options) VALUES (?, ?, ?, ?)',
    [roomId, poll.id, poll.question, JSON.stringify(poll.options)]
  ).catch(async () => {
    await dbRun(
      'INSERT INTO active_polls (roomId, id, question, options) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE id = ?, question = ?, options = ?',
      [roomId, poll.id, poll.question, JSON.stringify(poll.options), poll.id, poll.question, JSON.stringify(poll.options)]
    ).catch(err => {
      logger.error('Failed to save poll:', err);
    });
  });
}

function initRealtime(app: Express, server: http.Server) {
  io = new Server(server, {
    cors: {
      origin: config.NODE_ENV === 'production' ? allowedOrigins : '*',
      methods: ['GET', 'POST']
    },
    pingInterval: 10000,
    pingTimeout: 5000,
    maxHttpBufferSize: 1e6 // 1MB maximum payload check
  });

  app.set('io', io);

  const isRedisLocalhost = !config.REDIS_URL || 
                           config.REDIS_URL.includes('localhost') || 
                           config.REDIS_URL.includes('127.0.0.1') ||
                           config.REDIS_URL === '';

  // Support Socket.IO scaling with Redis adapter if REDIS_URL is provided and not localhost
  if (config.REDIS_URL && !isRedisLocalhost) {
    try {
      const redisOptions = {
        maxRetriesPerRequest: 3,
        enableOfflineQueue: true,
        connectTimeout: 5000,
        retryStrategy(times: number): number | null {
          if (times > 3) {
            return null; // stop retrying
          }
          return Math.min(times * 1000, 3000);
        }
      };

      const pubClient = new Redis(config.REDIS_URL, redisOptions);
      pubClient.on('error', (err) => {
        logger.warn(`Redis pubClient error (background scaling of Socket.io may be degraded): ${err.message}`);
      });
      const subClient = new Redis(config.REDIS_URL, redisOptions);
      subClient.on('error', (err) => {
        logger.warn(`Redis subClient error (background scaling of Socket.io may be degraded): ${err.message}`);
      });
      io.adapter(createAdapter(pubClient, subClient));
      logger.info('Connected Socket.io Redis adapter successfully.');
    } catch (e) {
      logger.warn('Failed to configure Socket.io Redis adapter, safely falling back to standard adapter:', e);
    }
  } else {
    logger.info('Redis URL is empty, localhost, or not supplied. Using standard in-memory Socket.io adapter.');
  }

  // Token cache with lru-cache to avoid verifying Firebase id Token on every single connection and prevent memory leaks
  const tokenCache = new LRUCache<string, any>({
    max: 1000,
    ttl: 300000 // 5 minutes (300,000 ms)
  });

  // Socket Auth Middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    
    if (tokenCache.has(token)) {
      socket.data.user = tokenCache.get(token);
      return next();
    }

    try {
      const decoded = await firebaseAuth.verifyIdToken(token);
      tokenCache.set(token, decoded);
      socket.data.user = decoded;
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  const rateLimiter = new RateLimiterMemory({
    points: 10, // max 10 events
    duration: 1, // per 1 second
  });

  const joinRoomSchema = z.string().min(1).max(100);
  const joinUserRoomSchema = z.string().min(1).max(100);
  const syncPlaybackSchema = z.object({
    roomId: z.string().min(1).max(100),
    track: z.any().optional(),
    position: z.number().nonnegative(),
    isPlaying: z.boolean()
  });
  const chatMessageSchema = z.object({
    roomId: z.string().min(1).max(100),
    message: z.string().min(1).max(2000),
    user: z.object({
      name: z.string().max(100).optional()
    }).optional()
  });
  const submitVoteSchema = z.object({
    roomId: z.string().min(1).max(100),
    optionId: z.string().min(1).max(50)
  });
  const createPollSchema = z.object({
    roomId: z.string().min(1).max(100),
    question: z.string().min(1).max(300),
    options: z.array(z.string().min(1).max(100)).min(2).max(10)
  });
  const sendReactionSchema = z.object({
    roomId: z.string().min(1).max(100),
    emoji: z.string().min(1).max(10)
  });
  const webrtcJoinSchema = z.object({
    roomId: z.string().min(1).max(100)
  });
  const webrtcOfferSchema = z.object({
    roomId: z.string().min(1).max(100).optional(),
    offer: z.any(),
    targetSocketId: z.string().max(100).optional()
  });
  const webrtcAnswerSchema = z.object({
    targetSocketId: z.string().max(100),
    answer: z.any(),
    roomId: z.string().min(1).max(100).optional()
  });
  const webrtcCandidateSchema = z.object({
    targetSocketId: z.string().max(100),
    candidate: z.any(),
    roomId: z.string().min(1).max(100).optional()
  });
  const webrtcDisconnectSchema = z.object({
    roomId: z.string().min(1).max(100).optional()
  });

  io.on('connection', (socket) => {
    logger.info(`🔌 Socket connected: ${socket.id} (User: ${socket.data.user?.uid || 'Unknown'})`);

    const isRateLimited = async (): Promise<boolean> => {
      try {
        await rateLimiter.consume(socket.id, 1);
        return false;
      } catch {
        logger.warn(`Rate limit exceeded for socket: ${socket.id}`);
        return true;
      }
    };

    const canSignal = (targetSocketId?: string, roomId?: string): boolean => {
      if (roomId && !socket.rooms.has(roomId)) {
        logger.warn(`Unauthorized WebRTC signaling attempt: socket ${socket.id} not in room ${roomId}`);
        return false;
      }
      if (targetSocketId) {
        const targetSocket = io.sockets.sockets.get(targetSocketId);
        if (!targetSocket) {
          return false;
        }
        const sharesRoom = Array.from(socket.rooms).some(r => r !== socket.id && targetSocket.rooms.has(r));
        if (!sharesRoom) {
          logger.warn(`Unauthorized WebRTC message: socket ${socket.id} does not share a room with target ${targetSocketId}`);
          return false;
        }
      }
      return true;
    };

    socket.on('join-room', async (roomId) => {
      try {
        const validation = joinRoomSchema.safeParse(roomId);
        if (!validation.success) {
          logger.warn(`Invalid join-room parameters from socket: ${socket.id}`);
          return;
        }
        const cleanRoomId = validation.data;
        socket.join(cleanRoomId);
        logger.info(`👤 Socket ${socket.id} joined room: ${cleanRoomId}`);
        
        // Push initial/current poll dynamically from database
        const poll = await getOrCreatePoll(cleanRoomId);
        socket.emit('poll-updated', poll);
      } catch (err) {
        logger.error(`Error in join-room socket handler:`, err);
      }
    });

    socket.on('join-user-room', async (userId) => {
      try {
        const validation = joinUserRoomSchema.safeParse(userId);
        if (!validation.success) {
          logger.warn(`Invalid join-user-room parameters from socket: ${socket.id}`);
          return;
        }
        const cleanUserId = validation.data;
        // Secure validation: check ownership of the user ID channel
        if (socket.data.user?.uid !== cleanUserId) {
          logger.warn(`Socket user ${socket.data.user?.uid} tried to join private room user-${cleanUserId}`);
          return;
        }
        socket.join(`user-${cleanUserId}`);
        logger.info(`👤 Socket ${socket.id} joined private room: user-${cleanUserId}`);
      } catch (err) {
        logger.error(`Error in join-user-room socket handler:`, err);
      }
    });

    socket.on('sync-playback', async (payload) => {
      try {
        if (await isRateLimited()) return;
        const validation = syncPlaybackSchema.safeParse(payload);
        if (!validation.success) {
          logger.warn(`Invalid sync-playback payload from socket: ${socket.id}`);
          return;
        }
        const { roomId, track, position, isPlaying } = validation.data;
        
        // Authorization verification: verify user exists in the room
        if (!socket.rooms.has(roomId)) {
          logger.warn(`Unauthorized playback sync attempt by socket ${socket.id} to room ${roomId}`);
          return;
        }
        
        socket.to(roomId).emit('playback-update', { track, position, isPlaying });
      } catch (err) {
        logger.error(`Error in sync-playback socket handler:`, err);
      }
    });

    socket.on('chat-message', async (payload) => {
      try {
        if (await isRateLimited()) return;
        const validation = chatMessageSchema.safeParse(payload);
        if (!validation.success) {
          logger.warn(`Invalid chat-message details from socket: ${socket.id}`);
          return;
        }
        const { roomId, message, user } = validation.data;

        // Room authentication check: user must be in the target channel to comment
        if (!socket.rooms.has(roomId)) {
          logger.warn(`Unauthorized chat message attempt by socket ${socket.id} to room ${roomId}`);
          return;
        }

        // Sanitization using sanitize-html, strip all tags completely for plain text chat
        const sanitizedMessage = sanitizeHtml(message, {
          allowedTags: [],
          allowedAttributes: {}
        });

        io.to(roomId).emit('new-message', { 
          message: sanitizedMessage, 
          user: {
            uid: socket.data.user?.uid,
            email: socket.data.user?.email,
            name: user?.name || socket.data.user?.name || 'Anonymous'
          }, 
          timestamp: new Date() 
        });

        // Inform highlight tracker of live crowd activity
        highlightWorker.recordActivity(roomId, 1);
      } catch (err) {
        logger.error(`Error in chat-message socket handler:`, err);
      }
    });

    socket.on('submit-vote', async (payload) => {
      try {
        const validation = submitVoteSchema.safeParse(payload);
        if (!validation.success) {
          logger.warn(`Invalid submit-vote metadata from socket: ${socket.id}`);
          return;
        }
        const { roomId, optionId } = validation.data;
        const poll = await getOrCreatePoll(roomId);
        const option = poll.options.find(o => o.id === optionId);
        if (option) {
          option.votes += 1;
          await savePoll(roomId, poll);
          io.to(roomId).emit('poll-updated', poll);
          highlightWorker.recordActivity(roomId, 1.5);
        }
      } catch (err) {
        logger.error('Error in submit-vote socket handler:', err);
      }
    });

    socket.on('vote', async (payload) => {
      try {
        const validation = submitVoteSchema.safeParse(payload);
        if (!validation.success) {
          logger.warn(`Invalid vote metadata from socket: ${socket.id}`);
          return;
        }
        const { roomId, optionId } = validation.data;
        const poll = await getOrCreatePoll(roomId);
        const option = poll.options.find(o => o.id === optionId);
        if (option) {
          option.votes += 1;
          await savePoll(roomId, poll);
          io.to(roomId).emit('poll-updated', poll);
          highlightWorker.recordActivity(roomId, 1.5);
        }
      } catch (err) {
        logger.error('Error in vote socket handler:', err);
      }
    });

    socket.on('create-poll', async (payload) => {
      try {
        const validation = createPollSchema.safeParse(payload);
        if (!validation.success) {
          logger.warn(`Invalid create-poll parameters from socket: ${socket.id}`);
          return;
        }
        const { roomId, question, options } = validation.data;
        const poll: LivePoll = {
          id: `poll-${Date.now()}`,
          question,
          options: options.map((txt, i) => ({ id: String(i + 1), text: txt, votes: 0 }))
        };
        await savePoll(roomId, poll);
        io.to(roomId).emit('poll-updated', poll);
      } catch (err) {
        logger.error('Error in create-poll socket handler:', err);
      }
    });

    socket.on('send-reaction', async (payload) => {
      try {
        const validation = sendReactionSchema.safeParse(payload);
        if (!validation.success) {
          logger.warn(`Invalid send-reaction from socket: ${socket.id}`);
          return;
        }
        const { roomId, emoji } = validation.data;
        highlightWorker.recordActivity(roomId, 2);
        io.to(roomId).emit('new-reaction', { emoji });
      } catch (err) {
        logger.error('Error in send-reaction socket handler:', err);
      }
    });

    socket.on('reaction', async (payload) => {
      try {
        const validation = sendReactionSchema.safeParse(payload);
        if (!validation.success) {
          logger.warn(`Invalid reaction from socket: ${socket.id}`);
          return;
        }
        const { roomId, emoji } = validation.data;
        highlightWorker.recordActivity(roomId, 2);
        io.to(roomId).emit('new-reaction', { emoji });
      } catch (err) {
        logger.error('Error in reaction socket handler:', err);
      }
    });

    // WebRTC Live Stream low-latency P2P broadcast signaling logic with strict authorization check
    socket.on('webrtc-join-as-viewer', async (payload) => {
      try {
        const validation = webrtcJoinSchema.safeParse(payload);
        if (!validation.success) {
          logger.warn(`Invalid webrtc-join session from socket: ${socket.id}`);
          return;
        }
        const { roomId } = validation.data;
        socket.join(roomId);
        logger.info(`📺 Viewer ${socket.id} joined WebRTC channel for room ${roomId}`);
        // Notify the broadcaster(s) in this room that a new viewer is ready
        socket.to(roomId).emit('webrtc-new-viewer', { viewerSocketId: socket.id });
      } catch (err) {
        logger.error('Error in webrtc-join-as-viewer:', err);
      }
    });

    socket.on('webrtc-offer', async (payload) => {
      try {
        const validation = webrtcOfferSchema.safeParse(payload);
        if (!validation.success) return;
        
        const { roomId, offer, targetSocketId } = validation.data;
        if (!canSignal(targetSocketId, roomId)) return;

        if (targetSocketId) {
          socket.to(targetSocketId).emit('webrtc-offer', { offer, senderSocketId: socket.id });
        } else if (roomId) {
          socket.to(roomId).emit('webrtc-offer', { offer, senderSocketId: socket.id });
        }
      } catch (err) {
        logger.error('Error in webrtc-offer:', err);
      }
    });

    socket.on('webrtc-answer', async (payload) => {
      try {
        const validation = webrtcAnswerSchema.safeParse(payload);
        if (!validation.success) return;
        
        const { targetSocketId, answer, roomId } = validation.data;
        if (!canSignal(targetSocketId, roomId)) return;

        socket.to(targetSocketId).emit('webrtc-answer', { answer, senderSocketId: socket.id });
      } catch (err) {
        logger.error('Error in webrtc-answer:', err);
      }
    });

    socket.on('webrtc-candidate', async (payload) => {
      try {
        const validation = webrtcCandidateSchema.safeParse(payload);
        if (!validation.success) return;
        
        const { targetSocketId, candidate, roomId } = validation.data;
        if (!canSignal(targetSocketId, roomId)) return;

        socket.to(targetSocketId).emit('webrtc-candidate', { candidate, senderSocketId: socket.id });
      } catch (err) {
        logger.error('Error in webrtc-candidate:', err);
      }
    });

    socket.on('webrtc-disconnect-stream', async (payload) => {
      try {
        const validation = webrtcDisconnectSchema.safeParse(payload);
        if (!validation.success) return;
        
        const { roomId } = validation.data;
        if (!canSignal(undefined, roomId)) return;

        if (roomId) {
          socket.to(roomId).emit('webrtc-streamer-disconnected', { streamerSocketId: socket.id });
        }
      } catch (err) {
        logger.error('Error in webrtc-disconnect-stream:', err);
      }
    });

    socket.on('disconnecting', (reason) => {
      logger.info(`🔌 Socket disconnecting: ${socket.id} (Rooms count: ${socket.rooms.size}, Reason: ${reason})`);
    });

    socket.on('disconnect', (reason) => {
      logger.info(`🔌 Socket disconnected: ${socket.id} (Reason: ${reason})`);
    });
    
    socket.on('error', (err) => {
      logger.error(`Socket connection error on ${socket.id}:`, err);
    });
  });
}



const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received — shutting down...`);
  const forceTimer = setTimeout(() => { process.exit(1); }, 10_000);
  forceTimer.unref();

  if (io) io.close();
  try { highlightWorker.stop(); } catch { /* non-fatal */ }

  httpServer!.close(async () => {
    clearTimeout(forceTimer);
    try { await closeDB(); } catch { /* ignore */ }
    process.exit(0);
  });
};

/**
 * Run worker logic in-process rather than spawning a child process.
 * Cloud Run is a single-container env — child_process.spawn with shell:true
 * is unreliable when the minimal image has no /bin/sh, and CPU throttling
 * can starve the child before it binds. In-process is simpler + observable.
 */
/**
 * Run worker logic in-process rather than spawning a child process.
 * Cloud Run is a single-container env — child_process.spawn with shell:true
 * is unreliable when the minimal image has no /bin/sh, and CPU throttling
 * can starve the child before it binds. In-process is simpler + observable.
 */
async function startWorkerInProcess(): Promise<void> {
  if (config.ENABLE_AI_WORKERS) {
    try {
      initWorker();
      logger.info('[Worker] BullMQ background jobs initialised.');
    } catch (err: any) {
      logger.error('[Worker] BullMQ init failed (non-fatal):', err.message);
    }
  }

  if (config.ENABLE_RSS_AUTOMATION) {
    try {
      await startRSSAutomation();
      logger.info('[Worker] RSS automation started.');
    } catch (err: any) {
      logger.error('[Worker] RSS automation failed (non-fatal):', err.message);
    }
  }

  if (config.ENABLE_PLATFORM_BRAIN) {
    try {
      await PlatformBrain.init();
      logger.info('[Worker] PlatformBrain initialised.');
    } catch (err: any) {
      logger.error('[Worker] PlatformBrain init failed (non-fatal):', err.message);
    }
  }

  if (config.ENABLE_RECOMMENDATIONS) {
    try {
      await RecommendationEngine.start();
      logger.info('[Worker] RecommendationEngine started.');
    } catch (err: any) {
      logger.error('[Worker] RecommendationEngine failed (non-fatal):', err.message);
    }
  }
}

async function initializeServices(): Promise<void> {
  // 1. Firebase Initialisation
  try {
    await initializeFirebase();
  } catch (err: any) {
    logger.error(
      '[Firebase] Init failed — auth unavailable. ' +
      'Set GOOGLE_APPLICATION_CREDENTIALS to allow fallback initialization. ' +
      `Reason: ${err.message}`
    );
  }

  // 2. Database
  try {
    await initDB();
    logger.info('[DB] Database connected.');
    // Run schema migrations in non-production environments to ensure local DB files are fully hydrated.
    if (config.NODE_ENV !== 'production' || process.env.RUN_BOOTSTRAP) {
      logger.info('[DB] Running schema migrations...');
      await runMigrations();
    }
  } catch (err: any) {
    logger.error('[DB] initDB failed (server still running):', err.message);
  }

  // 3. Background Workers
  try {
    await startWorkerInProcess();
  } catch (err: any) {
    logger.error('[Worker] Background workers startup error:', err.message);
  }
}

async function startServer(): Promise<void> {
  // V12 Constitution, Art. I §1.2–1.3: verify the cryptographic anchor before
  // anything else. In production a defect refuses start — no bypass exists.
  await initConstitution();

  // Ecosystem feed syndication: track approvals / posts / sales fan out to
  // every peer configured in V12_FEED_PEERS (Sociofy, CEOS, Orion, Apex, ...).
  initEcosystemPublisher();

  registry.resetStateFile();

  registry.register('stripe', {
    ready: () => !process.env.ENABLE_PAYMENTS || !!process.env.STRIPE_SECRET_KEY,
    verify: async () => !process.env.ENABLE_PAYMENTS || !!process.env.STRIPE_SECRET_KEY,
  });
  registry.register('gemini', {
    ready: () => !!process.env.GEMINI_API_KEY,
    verify: async () => !!process.env.GEMINI_API_KEY,
  });
  registry.register('openai', {
    ready: () => !!process.env.OPENAI_API_KEY,
    verify: async () => !!process.env.OPENAI_API_KEY,
  });

  const app    = express();
  const server = http.createServer(app);

  initApp(app);
  initSecurity(app);
  initRoutes(app);
  initRealtime(app, server);

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : (config.NODE_ENV === 'production' ? 8080 : 3000);

  if (config.NODE_ENV !== 'production') {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
      app.use(vite.middlewares);
    } catch {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { maxAge: '1y', immutable: true }));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.use(sentryErrorHandler);
  app.use(errorHandler);

  httpServer = server;

  const role = process.env.SONIC_ROLE || 'all';

  httpServer.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server listening on port ${PORT} [${config.NODE_ENV}] (Active Role: "${role}")`);
    
    // Asynchronously perform background bootstrapping depending on active role:
    if (role === 'all') {
      void initializeServices();
    } else if (role === 'worker' || role === 'sonic-worker') {
      logger.info('[Worker Startup] Asynchronously initializing Background Queue Runner Node...');
      void (async () => {
        try {
          await initDB();
          const { initRedis } = await import('./server/jobs.js');
          await initRedis();
          
          if (config.ENABLE_AI_WORKERS) {
            initWorker();
            logger.info('[Worker] BullMQ queue processing started asynchronously.');
          }
          if (config.ENABLE_RSS_AUTOMATION) {
            await startRSSAutomation();
            logger.info('[Worker] RSS subscription ingestion polling armed.');
          }
          logger.info('[Worker Startup] Worker polling process is fully active in background.');
        } catch (err: any) {
          logger.error('[Worker Startup] Async bootstrap failed:', err.message);
        }
      })();
    } else if (role === 'ai' || role === 'sonic-ai') {
      logger.info('[AI Startup] Asynchronously initializing AI Engine and Platform Brain...');
      void (async () => {
        try {
          await initDB();
          const { initRedis } = await import('./server/jobs.js');
          await initRedis();
          
          registry.register('ai_models_loaded', { loaded: true, timestamp: Date.now() });
          
          await PlatformBrain.init();
          logger.info('[AI Startup] PlatformBrain Core awake asynchronously.');
          
          await RecommendationEngine.start();
          logger.info('[AI Startup] RecommendationEngine live.');
        } catch (err: any) {
          logger.error('[AI Startup] Async AI bootstrap failed:', err.message);
        }
      })();
    } else {
      logger.info(`[API Startup] Decoupled rapid boot active/healthy for standalone service: "${role}"`);
      registry.register('health', {
        status: 'healthy',
        latency: 5,
        version: 'v12',
        role
      });
      // Warm connections concurrently/asynchronously in background for general API services
      initDB().then(() => logger.info('[API Startup] Asynchronous DB pool connected.')).catch(err => logger.error('[API Startup] Async DB failed:', err.message));
      import('./server/jobs.js').then(({ initRedis }) => initRedis()).then(() => logger.info('[API Startup] Asynchronous Redis pool connected.')).catch(err => logger.error('[API Startup] Async Redis failed:', err.message));
      initializeFirebase().then(() => logger.info('[API Startup] Asynchronous Firebase client online.')).catch(err => logger.error('[API Startup] Async Firebase failed:', err.message));
    }
  });

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
}

/**
 * Sonic OS Startup Coordinator
 * Runs role-appropriate startup pipelines to ensure rapid, highly segregated cloud native operations
 */
async function bootstrapSonicRole(): Promise<void> {
  const role = process.env.SONIC_ROLE || 'all';
  logger.info(`[Bootstrap] Bootstrapping node instance role: "${role}"`);

  // Role 1. Database Migration Job (Deploy Pipeline Step)
  if (role === 'migration') {
    logger.info('[Migration Startup] Starting isolated database schema migration job...');
    try {
      await initDB();
      await runMigrations();
      logger.info('[Migration Startup] Database migration completed successfully. Exiting clean.');
      process.exit(0);
    } catch (migErr) {
      logger.error('[Migration Startup] Fatal migration failure:', migErr);
      process.exit(1);
    }
  }

  // Any other role starts the Express Server (API Gateway/Microservice) immediately for high liveness score!
  await startServer();
}

// ── Global safety net ─────────────────────────────────────────────────────────
// NEVER throw inside uncaughtException — causes double-fault exit(7).
// Always process.exit(1) so Cloud Run gets a clean restart signal.

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason instanceof Error ? reason : new Error(String(reason)) }, 'Unhandled Promise Rejection:');
  // Don't exit — often isolated to a background task
});

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught Exception — exiting:');
  process.exit(1);
});

bootstrapSonicRole().catch((err) => {
  logger.error('Fatal: server failed to start:', err);
  process.exit(1);
});
