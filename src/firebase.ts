/**
 * 2026-10-08 — Firebase removal phase 2 COMPLETE.
 *
 * This module used to initialize Firebase App / Auth / Firestore / Storage on
 * the suspended GCP project (gen-lang-client-0237733980) — the root cause of
 * the platform-wide loading loops. Every feature now runs on SONIC AUTH
 * (src/lib/sonicAuth.ts) and the platform's own /api endpoints.
 *
 * The file is kept as an inert stub so any stale import fails loudly in
 * development instead of silently re-introducing a dead dependency. No
 * `firebase/*` packages are imported here anymore, which also removes the
 * entire Firebase SDK from the production bundle.
 */

const GONE =
  'Firebase has been removed from SonicStream. Use src/lib/sonicAuth.ts and the /api endpoints instead.';

function gone(): never {
  throw new Error(GONE);
}

export const auth: any = new Proxy({}, { get: gone });
export const db: any = new Proxy({}, { get: gone });
export const storage: any = new Proxy({}, { get: gone });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export const handleFirestoreError = (error: unknown, _op?: unknown, _path?: unknown) => {
  console.error('[legacy firebase call]', error);
};
