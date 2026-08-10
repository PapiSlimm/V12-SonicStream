// backend/db/client.ts
//
// Lazy, fault-isolated Prisma client. The original constructed PrismaClient at
// import time, which took the WHOLE server down (health checks, ecosystem bus,
// static site included) if the client wasn't generated or the engine was
// unavailable. Now the client initializes on first query; if the database
// layer is broken, only database-dependent routes fail — with a clear error —
// while the rest of the app stays up.
import { createRequire } from 'node:module';
import type { PrismaClient } from '@prisma/client';

const require = createRequire(import.meta.url);

let client: PrismaClient | null = null;
let initError: Error | null = null;

function getClient(): PrismaClient {
  if (client) return client;
  if (initError) throw initError;
  try {
    const { PrismaClient: PC } = require('@prisma/client');
    client = new PC() as PrismaClient;
    return client;
  } catch (err: any) {
    initError = new Error(
      `Database layer unavailable: ${err?.message ?? err}. ` +
        `Run "npm run db:setup" (prisma generate && prisma db push) and restart.`,
    );
    console.error('[db]', initError.message);
    throw initError;
  }
}

const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const c = getClient() as any;
    const value = c[prop];
    return typeof value === 'function' ? value.bind(c) : value;
  },
}) as PrismaClient;

export default prisma;
