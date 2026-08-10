import admin from 'firebase-admin';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { registry } from './ServiceRegistry.js';
import { logger } from '../middleware/error.js';

let app: admin.app.App | null = null;
let firebaseReady = false;

const configSchema = z.object({
  projectId: z.string(),
  type: z.string().optional(),
  private_key: z.string().optional(),
  client_email: z.string().optional(),
}).passthrough();

/**
 * Service account loader utility checking GOOGLE_APPLICATION_CREDENTIALS path
 * and safely initializing the Firebase Admin SDK.
 */
async function loadFromGoogleApplicationCredentials(): Promise<boolean> {
  const gacPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!gacPath) return false;

  try {
    const resolvedPath = path.isAbsolute(gacPath) ? gacPath : path.resolve(process.cwd(), gacPath);
    await fs.access(resolvedPath);
    const content = await fs.readFile(resolvedPath, 'utf8');
    const parsed = configSchema.parse(JSON.parse(content));
    if (parsed.type === 'service_account' && parsed.private_key) {
      app = admin.initializeApp({
        credential: admin.credential.cert(parsed as admin.ServiceAccount)
      });
      firebaseReady = true;
      logger.info(`[Firebase] Initialised via GOOGLE_APPLICATION_CREDENTIALS path: ${resolvedPath}`);
      return true;
    }
  } catch (e: any) {
    if (process.env.NODE_ENV === 'production') {
      logger.warn(`[Firebase] Service-account-loader failed on GOOGLE_APPLICATION_CREDENTIALS path "${gacPath}": ${e.message}`);
    } else {
      logger.info(`[Firebase] Service-account-loader bypassed in development (credentials file "${gacPath}" not found or invalid)`);
    }
  }
  return false;
}

export async function initializeFirebase(): Promise<void> {
  if (app || admin.apps.length > 0) {
    app = admin.apps[0] ?? null;
    firebaseReady = true;
    return;
  }

  // Clean or bypass invalid/absent GOOGLE_APPLICATION_CREDENTIALS paths
  const gacPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (gacPath) {
    try {
      const resolvedPath = path.isAbsolute(gacPath) ? gacPath : path.resolve(process.cwd(), gacPath);
      await fs.access(resolvedPath);
    } catch {
      if (process.env.NODE_ENV === 'production') {
        logger.warn(`[Firebase] GOOGLE_APPLICATION_CREDENTIALS file "${gacPath}" does not exist. Clearing env var to allow metadata / fallback initialization.`);
      } else {
        logger.info(`[Firebase] GOOGLE_APPLICATION_CREDENTIALS file "${gacPath}" not found in development. Clearing env var to bypass ADC warnings.`);
      }
      delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    }
  }

  // ── Production Mode (Cloud Run / standard production env) ────────────────
  // Strictly use Application Default Credentials to adhere to best security practices
  if (process.env.NODE_ENV === 'production') {
    try {
      app = admin.initializeApp({ credential: admin.credential.applicationDefault() });
      firebaseReady = true;
      logger.info('[Firebase] Initialised in production via standard Application Default Credentials (ADC).');
      return;
    } catch (e: any) {
      logger.error(`[Firebase] ADC initialization failed in production: ${e.message}`);
      // Fall through to error logs rather than crashing server completely, keeping api resilient
    }
  }

  // ── Local Development / Offline Fallback Strategies ─────────────────────
  // ── Strategy 0: GOOGLE_APPLICATION_CREDENTIALS Path Loader ────────────────
  if (await loadFromGoogleApplicationCredentials()) {
    return;
  }

  // ── Strategy 1: Application Default Credentials ─────────────────────────
  // Works automatically on Cloud Run when Workload Identity is configured,
  // or when GOOGLE_APPLICATION_CREDENTIALS points to a service account JSON.
  try {
    app = admin.initializeApp({ credential: admin.credential.applicationDefault() });
    firebaseReady = true;
    logger.info('[Firebase] Initialised via Application Default Credentials.');
    return;
  } catch (e: any) {
    logger.info(`[Firebase] ADC unavailable (${e.message}) — trying client config fallback.`);
  }

  // ── Strategy 2: firebase-applet-config.json (client config, limited) ────
  // Gives Admin SDK a projectId so Firestore paths resolve, but cannot verify
  // ID tokens. Auth middleware will return 503 for token-protected routes.
  const clientPath = path.join(process.cwd(), 'firebase-applet-config.json');
  try {
    await fs.access(clientPath);
    const parsed = configSchema.parse(JSON.parse(await fs.readFile(clientPath, 'utf8')));
    app = admin.initializeApp({ projectId: parsed.projectId });
    firebaseReady = false; // partial — Firestore paths work, auth verification won't
    logger.warn(
      '[Firebase] Initialised with client config only (no auth verification).'
    );
    return;
  } catch { /* file absent */ }

  // ── All strategies failed ────────────────────────────────────────────────
  if (process.env.NODE_ENV === 'production') {
    logger.error(
      '[Firebase] All init strategies failed. Firebase will be unavailable. ' +
      'To fix: check Workload Identity settings or supply a valid GOOGLE_APPLICATION_CREDENTIALS config.'
    );
  } else {
    logger.info(
      '[Firebase] All init strategies bypassed in non-production. Firebase features will run with fallback rules.'
    );
  }
  // Do NOT throw — the server starts without Firebase. Routes guard themselves.
}

export function isFirebaseAvailable(): boolean {
  return firebaseReady && app !== null;
}

export function getApp(): admin.app.App {
  if (!app) throw new Error('Firebase Admin not initialised.');
  return app;
}

// Safe proxy — throws a clear error when Firebase is unavailable,
// so callers can catch and return 503 rather than crashing the process.
export const auth = new Proxy({} as admin.auth.Auth, {
  get(_t, prop, receiver) {
    if (!app) {
      if (admin.apps.length > 0) { app = admin.app(); }
      else throw new Error('Firebase Auth unavailable — no credentials configured.');
    }
    const instance = admin.auth(app!);
    const val = Reflect.get(instance, prop, receiver);
    return typeof val === 'function' ? val.bind(instance) : val;
  },
});

export const db = new Proxy({} as admin.firestore.Firestore, {
  get(_t, prop, receiver) {
    if (!app) {
      if (admin.apps.length > 0) { app = admin.app(); }
      else throw new Error('Firebase Firestore unavailable — no credentials configured.');
    }
    const instance = admin.firestore(app!);
    const val = Reflect.get(instance, prop, receiver);
    return typeof val === 'function' ? val.bind(instance) : val;
  },
});

export async function verifyFirebase(): Promise<boolean> {
  if (!app) return false;
  try {
    await admin.firestore(app).collection('_health').limit(1).get();
    return true;
  } catch {
    return false;
  }
}

process.on('SIGTERM', async () => {
  if (admin.apps.length > 0) {
    await Promise.all(admin.apps.map(a =>
      a.delete().catch(e => logger.error('[Firebase] Shutdown error:', e))
    ));
  }
});

registry.register('firebase', { ready: () => firebaseReady, verify: verifyFirebase });
