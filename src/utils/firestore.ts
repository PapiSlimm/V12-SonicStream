/**
 * 2026-10-08 — Firebase removal phase 2: this error-reporting helper existed
 * only for Firestore operations, which no longer happen anywhere in the app.
 * Kept as an inert stub (no firebase imports) so nothing stale can revive the
 * dependency.
 */

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export const handleFirestoreError = (error: unknown, _op?: OperationType, _path?: string | null) => {
  console.error('[legacy firestore call]', error);
};
