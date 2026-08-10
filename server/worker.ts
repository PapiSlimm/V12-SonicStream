import { initDB, closeDB } from './db.js';
import { initWorker, initRedis, closeRedis } from './jobs.js';
import { PlatformBrain } from './services/PlatformBrain.js';
import { RecommendationEngine } from './services/RecommendationEngine.js';
import { logger } from './middleware/error.js';
import { config } from './config.js';
import { registry } from './services/ServiceRegistry.js';
import { runMigrations } from './services/MigrationService.js';

// ---------------------------------------------------------------------------
// Cloud Run requires every deployed service to listen on $PORT, even
// background-only roles. This minimal listener serves /health/live and nothing
// else; without it, Cloud Run kills the container at startup.
// ---------------------------------------------------------------------------
import http from 'http';
const healthPort = Number(process.env.PORT || 8080);
http.createServer((req, res) => {
  if (req.url === '/health/live' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'alive', role: process.env.SONIC_ROLE || 'unknown' }));
  } else {
    res.writeHead(404); res.end();
  }
}).listen(healthPort, () => console.log(`[health] listening on :${healthPort}`));


logger.info('[WorkerService] Starting Worker Service...');

const startWorkerService = async () => {
  try {
    // 1. Initialize and validate critical Redis connection first (Issue #4)
    logger.info('[WorkerService] Initializing Redis...');
    await initRedis();
    await registry.waitFor('redis');

    // 2. Initialize critical Database connection (Issue #2)
    logger.info('[WorkerService] Initializing Database...');
    await initDB();
    await registry.waitFor('database');
    logger.info('[WorkerService] Database connection initialized.');

    // 3. Run database migrations statically
    logger.info('[WorkerService] Running Database Migrations...');
    await runMigrations(); // If migrations fail, we throw and let the worker fail fast.

    // 4. Initialize optional background jobs worker (BullMQ / Redis / Memory simulation)
    if (config.ENABLE_AI_WORKERS) {
      try {
        initWorker();
        logger.info('[WorkerService] Background jobs worker initialized.');
      } catch (err: any) {
        logger.error('[WorkerService] Failed to initialize worker (optional): ' + err.message);
      }
    } else {
      logger.info('[WorkerService] Background jobs worker is disabled via environment configuration.');
    }

    // 5. RSS Automation is now separated into a standalone sonicstream-scheduler service

    // 6. Concurrently initialize PlatformBrain and RecommendationEngine (Issue #6)
    const initPromises: Promise<any>[] = [];

    if (config.ENABLE_PLATFORM_BRAIN) {
      initPromises.push(
        PlatformBrain.init()
          .then(() => logger.info('[WorkerService] PlatformBrain initialized successfully.'))
          .catch((err) => logger.error('[WorkerService] Optional PlatformBrain initialization failed: ' + err.message))
      );
    } else {
      logger.info('[WorkerService] PlatformBrain is disabled via environment configuration.');
    }

    if (config.ENABLE_RECOMMENDATIONS) {
      initPromises.push(
        RecommendationEngine.init()
          .then(() => logger.info('[WorkerService] RecommendationEngine initialized successfully.'))
          .catch((err) => logger.error('[WorkerService] Optional RecommendationEngine initialization failed: ' + err.message))
      );
    } else {
      logger.info('[WorkerService] RecommendationEngine is disabled via environment configuration.');
    }

    await Promise.all(initPromises);

    logger.info('[WorkerService] Background worker services ready.');
  } catch (err: any) {
    logger.error('[WorkerService] CRITICAL: Worker startup failed:', err);
    process.exitCode = 1;
    process.exit(1);
  }
};

startWorkerService();

// Handle graceful shutdown/signals
const gracefulShutdown = async (signal?: string) => {
  logger.info(`[WorkerService] Received ${signal || 'shutdown'} signal. Shutting down worker service gracefully...`);
  
  const forceTimeout = setTimeout(() => {
    logger.error('[WorkerService] Forcefully exiting after shutdown timeout...');
    process.exit(1);
  }, 10000);

  const shutdownPromises: Promise<any>[] = [];

  // PlatformBrain
  try {
    shutdownPromises.push(
      PlatformBrain.shutdown()
        .then(() => logger.info('[WorkerService] PlatformBrain shutdown completed.'))
        .catch((err) => logger.error('[WorkerService] Error during PlatformBrain shutdown:', err))
    );
  } catch (err: any) {
    logger.warn('[WorkerService] PlatformBrain shutdown method missing or failed: ' + (err.message || err));
  }

  // RecommendationEngine
  try {
    shutdownPromises.push(
      RecommendationEngine.shutdown()
        .then(() => logger.info('[WorkerService] RecommendationEngine shutdown completed.'))
        .catch((err) => logger.error('[WorkerService] Error during RecommendationEngine shutdown:', err))
    );
  } catch (err: any) {
    logger.warn('[WorkerService] RecommendationEngine shutdown method missing or failed: ' + (err.message || err));
  }

  // Redis and Workers shutdown
  try {
    shutdownPromises.push(
      closeRedis()
        .then(() => logger.info('[WorkerService] Redis / Workers connection closed.'))
        .catch((err) => logger.error('[WorkerService] Error closing Redis:', err))
    );
  } catch (err: any) {
    logger.warn('[WorkerService] jobs module close contact failed during shutdown: ' + (err.message || err));
  }

  await Promise.all(shutdownPromises);

  // Close Database connections
  try {
    await closeDB();
    logger.info('[WorkerService] Database connection closed.');
  } catch (err) {
    logger.error('[WorkerService] Error closing database pool:', err);
  }

  clearTimeout(forceTimeout);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Global exception handling
process.on('unhandledRejection', async (reason) => {
  logger.fatal({ err: reason }, '[WorkerService] Unhandled Rejection detected, shutting down...');
  await gracefulShutdown('unhandledRejection');
});

process.on('uncaughtException', (err) => {
  logger.error(err, '[WorkerService] Uncaught Exception detected');
  process.exit(1);
});
