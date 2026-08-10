import { initDB, closeDB } from './db.js';
import { initRedis, closeRedis } from './jobs.js';
import { startRSSAutomation, stopRSSAutomation } from './services/rssService.js';
import { startAutoPilot, stopAutoPilot } from './services/AutoPilot.js';
import { logger } from './middleware/error.js';
import { config } from './config.js';
import { registry } from './services/ServiceRegistry.js';

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


logger.info('[SchedulerService] Starting Scheduler/RSS Service...');

const startSchedulerService = async () => {
  try {
    // 1. Initialize and validate critical Redis connection first
    logger.info('[SchedulerService] Initializing Redis...');
    await initRedis();
    await registry.waitFor('redis');

    // 2. Initialize critical Database connection
    logger.info('[SchedulerService] Initializing Database...');
    await initDB();
    await registry.waitFor('database');
    logger.info('[SchedulerService] Database connection initialized.');

    // 3. Start RSS Automation loop
    if (config.ENABLE_RSS_AUTOMATION) {
      startRSSAutomation();
      logger.info('[SchedulerService] RSS Automation start triggered.');
    } else {
      logger.info('[SchedulerService] RSS Automation is disabled via environment configuration.');
    }

    // 4. Start V12 AutoPilot product-generation loop
    if (config.ENABLE_AUTOPILOT) {
      startAutoPilot();
      logger.info('[SchedulerService] V12 AutoPilot start triggered.');
    } else {
      logger.info('[SchedulerService] V12 AutoPilot is disabled (set ENABLE_AUTOPILOT=true to activate).');
    }

    logger.info('[SchedulerService] Scheduler Service ready.');
  } catch (err: any) {
    logger.error('[SchedulerService] CRITICAL: Scheduler startup failed:', err);
    process.exitCode = 1;
    process.exit(1);
  }
};

startSchedulerService();

// Handle graceful shutdown/signals
const gracefulShutdown = async (signal?: string) => {
  logger.info(`[SchedulerService] Received ${signal || 'shutdown'} signal. Shutting down gracefully...`);
  
  const forceTimeout = setTimeout(() => {
    logger.error('[SchedulerService] Forcefully exiting after shutdown timeout...');
    process.exit(1);
  }, 10000);

  const shutdownPromises: Promise<any>[] = [];

  // AutoPilot
  try {
    stopAutoPilot();
  } catch (err: any) {
    logger.error('[SchedulerService] Error stopping AutoPilot:', err.message || err);
  }

  // RSS Automation
  try {
    stopRSSAutomation();
    logger.info('[SchedulerService] RSS Automation stopped.');
  } catch (err: any) {
    logger.error('[SchedulerService] Error stopping RSS Automation:', err.message || err);
  }

  // Redis connection closure
  try {
    shutdownPromises.push(
      closeRedis()
        .then(() => logger.info('[SchedulerService] Redis connection closed.'))
        .catch((err) => logger.error('[SchedulerService] Error closing Redis:', err))
    );
  } catch (err: any) {
    logger.warn('[SchedulerService] jobs module import failed during shutdown: ' + (err.message || err));
  }

  await Promise.all(shutdownPromises);

  // Close Database connection
  try {
    await closeDB();
    logger.info('[SchedulerService] Database connection closed.');
  } catch (err) {
    logger.error('[SchedulerService] Error closing database pool:', err);
  }

  clearTimeout(forceTimeout);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Global exception handling
process.on('unhandledRejection', async (reason) => {
  logger.fatal({ err: reason }, '[SchedulerService] Unhandled Rejection detected, shutting down...');
  await gracefulShutdown('unhandledRejection');
});

process.on('uncaughtException', (err) => {
  logger.error(err, '[SchedulerService] Uncaught Exception detected');
  process.exit(1);
});
