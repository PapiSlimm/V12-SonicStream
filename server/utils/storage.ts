import path from 'path';
import { Storage } from '@google-cloud/storage';
import { config } from '../config.js';
import { logger } from '../middleware/error.js';

const isProd = config.NODE_ENV === 'production' || !!process.env.K_SERVICE;

// In production on Cloud Run, /tmp is the only writable path.
// In development use the project root so uploads are visible during dev.
export const STORAGE_BASE_DIR = isProd ? '/tmp' : process.cwd();

export function getWritablePath(relativePath: string): string {
  return path.resolve(STORAGE_BASE_DIR, relativePath);
}

let _storageClient: Storage | null = null;

function getStorageClient(): Storage {
  if (!_storageClient) {
    // Uses ADC automatically on Cloud Run (Workload Identity or
    // GOOGLE_APPLICATION_CREDENTIALS env var)
    _storageClient = new Storage();
  }
  return _storageClient;
}

/**
 * Returns the GCS bucket name from environment.
 * Accepts both GCS_BUCKET (preferred) and GOOGLE_CLOUD_BUCKET (legacy).
 */
export function getGCSBucket(): string | undefined {
  return process.env.GCS_BUCKET || process.env.GOOGLE_CLOUD_BUCKET || undefined;
}

/**
 * Upload a local file to Google Cloud Storage.
 * Falls back to a local URL when GCS is not configured (dev / no-bucket).
 */
export async function uploadToGCS(localFilePath: string, destinationPath: string): Promise<string> {
  const bucketName = getGCSBucket();

  if (!bucketName) {
    logger.debug('[GCS] No bucket configured — returning local path.');
    return `/uploads/${destinationPath.replace(/\\/g, '/')}`;
  }

  try {
    const storage = getStorageClient();
    const gcsDest = destinationPath.replace(/\\/g, '/');

    logger.info(`[GCS] Uploading ${localFilePath} → gs://${bucketName}/${gcsDest}`);

    await storage.bucket(bucketName).upload(localFilePath, {
      destination: gcsDest,
      resumable: false,
      metadata: { cacheControl: 'public, max-age=31536000' },
    });

    const customDomain = process.env.GCS_CUSTOM_DOMAIN;
    return customDomain
      ? `${customDomain}/${gcsDest}`
      : `https://storage.googleapis.com/${bucketName}/${gcsDest}`;
  } catch (err) {
    logger.error('[GCS] Upload failed:', err);
    throw err;
  }
}

/**
 * Generate a signed URL for private assets (e.g. unreleased tracks).
 * Expires in 1 hour by default.
 */
export async function getSignedUrl(
  gcsPath: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const bucketName = getGCSBucket();
  if (!bucketName) throw new Error('GCS_BUCKET not configured');

  const [url] = await getStorageClient()
    .bucket(bucketName)
    .file(gcsPath)
    .getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresInSeconds * 1000,
    });

  return url;
}
