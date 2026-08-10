import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Public web-client configuration, sourced strictly from environment variables.
// IMPORTANT: this used to silently fall back to a real, hardcoded project (apiKey/projectId/
// appId literals) whenever env vars were missing. That meant anyone who built this app without
// configuring their own .env was transparently wired into the original developer's live
// Firebase project. There is now no fallback for identifying values - if they're missing, we
// warn loudly (dev) so it's caught immediately instead of silently "working" against the wrong backend.
const requiredFirebaseEnvVars = [
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
] as const;

if (import.meta.env.DEV) {
  const missing = requiredFirebaseEnvVars.filter((key) => !import.meta.env[key]);
  if (missing.length > 0) {
    console.error(
      `🔥 Missing required Firebase env var(s): ${missing.join(', ')}. ` +
      `Set these in .env.local (see .env.example). Firebase will not initialize correctly without them.`
    );
  }
}

const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? '',
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)'
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Initialize Firestore with a fallback to (default) if the specific database ID is missing
const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId.trim() !== "" 
  ? firebaseConfig.firestoreDatabaseId 
  : '(default)';

// If the database ID is (default), we don't need to pass it to getFirestore
export const db = dbId === '(default)' ? getFirestore(app) : getFirestore(app, dbId);
export const storage = getStorage(app); // 🎵 Critical for tracks

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function safeJsonStringify(obj: any): string {
  const seen = new Set();
  return JSON.stringify(obj, (_key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  });
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', safeJsonStringify(errInfo));
  throw new Error(safeJsonStringify(errInfo));
}

// Development emulators - only connect on actual local development machines
if (import.meta.env.DEV && typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  // Use a try-catch for emulators as they might fail in some environments
  try {
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "localhost", 8080);
  } catch (e) {
    console.warn("Firebase emulators failed to connect:", e);
  }
}

// Test connection
export const testConnection = async () => {
  try {
    // We use a small timeout to avoid hanging if the backend is unreachable
    const connectionDoc = doc(db, '_test_connection_', 'ping');
    await getDocFromServer(connectionDoc);
    console.log("✅ Firebase ready");
  } catch (error) {
    if (error instanceof Error) {
      const isOffline = error.message.includes('the client is offline') || 
                        error.message.includes('Could not reach Cloud Firestore backend') ||
                        error.message.includes('failed to connect to all addresses');
      
      if (isOffline) {
        console.error("❌ Firebase connection failed: The client is offline or the database ID is incorrect.");
        console.error("Current Project ID:", firebaseConfig.projectId);
        console.error("Current Database ID:", dbId);
      } else {
        console.warn("Firestore connection test warning (this may be normal if the collection doesn't exist):", error.message);
      }
    }
  }
};

testConnection();
