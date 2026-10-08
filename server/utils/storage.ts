/**
 * Unified storage layer (2026-10-08).
 *
 * Priority: Cloudflare R2 → legacy GCS → local disk.
 *
 * WHY R2: the GCP project (and its GCS bucket) is suspended for billing, and
 * Render's container disk is EPHEMERAL — every deploy wipes uploaded music and
 * generated streams. R2 is S3-compatible, has a permanent free tier (10 GB)
 * and ZERO egress fees, which matters for a streaming product.
 *
 * To activate R2, set these env vars on the Render service:
 *   R2_ACCOUNT_ID        — Cloudflare account id
 *   R2_ACCESS_KEY_ID     — R2 API token key id
 *   R2_SECRET_ACCESS_KEY — R2 API token secret
 *   R2_BUCKET            — bucket name (e.g. sonicstream-media)
 *   R2_PUBLIC_URL        — the bucket's public base URL
 *                          (https://pub-xxxx.r2.dev or a custom domain)
 *
 * The exported names keep their historical spelling (uploadToGCS,
 * getGCSBucket) so all 14 call sites keep working — they now mean
 * "remote storage", whichever backend is live.
 */
import path from 'path';
import fs from 'fs';
import { Storage } from '@google-cloud/storage';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as s3GetSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config.js';
import { logger } from '../middleware/error.js';

const isProd = config.NODE_ENV === 'production' || !!process.env.K_SERVICE;

// In production the container disk is the only writable path.
// In development use the project root so uploads are visible during dev.
export const STORAGE_BASE_DIR = isProd ? '/tmp' : process.cwd();

export function getWritablePath(relativePath: string): string {
  return path.resolve(STORAGE_BASE_DIR, relativePath);
}

/* ── Cloudflare R2 (S3-compatible) ─────────────────────────────────────── */

function r2Config() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
  if (R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET) {
    return {
      accountId: R2_ACCOUNT_ID,
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
      bucket: R2_BUCKET,
      publicUrl: (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, ''),
    };
  }
  return null;
}

let _r2Client: S3Client | null = null;
function getR2Client(): S3Client {
  if (!_r2Client) {
    const r2 = r2Config()!;
    _r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${r2.accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: r2.accessKeyId, secretAccessKey: r2.secretAccessKey },
    });
  }
  return _r2Client;
}

const MIME: Record<string, string> = {
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.ts': 'video/mp2t',
  '.mp3': 'audio/mpeg',
  '.aac': 'audio/aac',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.json': 'application/json',
};

/* ── legacy GCS ────────────────────────────────────────────────────────── */

let _storageClient: Storage | null = null;
function getStorageClient(): Storage {
  if (!_storageClient) _storageClient = new Storage();
  return _storageClient;
}

/**
 * Remote-storage bucket accessor (historical name).
 * Truthy whenever ANY remote backend (R2 or GCS) is configured — every
 * call site gates its remote-vs-local branch on this.
 */
export function getGCSBucket(): string | undefined {
  const r2 = r2Config();
  if (r2) return r2.bucket;
  return process.env.GCS_BUCKET || process.env.GOOGLE_CLOUD_BUCKET || undefined;
}

/**
 * Upload a local file to remote storage (R2 preferred, GCS legacy).
 * Falls back to a local URL when nothing is configured (dev / no bucket).
 */
export async function uploadToGCS(localFilePath: string, destinationPath: string): Promise<string> {
  const dest = destinationPath.replace(/\\/g, '/');
  const r2 = r2Config();

  if (r2) {
    try {
      logger.info(`[R2] Uploading ${localFilePath} → r2://${r2.bucket}/${dest}`);
      await getR2Client().send(new PutObjectCommand({
        Bucket: r2.bucket,
        Key: dest,
        Body: fs.createReadStream(localFilePath),
        ContentType: MIME[path.extname(dest).toLowerCase()] || 'application/octet-stream',
        CacheControl: 'public, max-age=31536000',
      }));
      if (r2.publicUrl) return `${r2.publicUrl}/${dest}`;
      logger.warn('[R2] R2_PUBLIC_URL not set — object stored but URL will need a public bucket domain.');
      return `/${dest}`;
    } catch (err) {
      logger.error('[R2] Upload failed:', err);
      throw err;
    }
  }

  const bucketName = process.env.GCS_BUCKET || process.env.GOOGLE_CLOUD_BUCKET;
  if (!bucketName) {
    logger.debug('[Storage] No remote bucket configured — returning local path.');
    return `/uploads/${dest}`;
  }

  try {
    logger.info(`[GCS] Uploading ${localFilePath} → gs://${bucketName}/${dest}`);
    await getStorageClient().bucket(bucketName).upload(localFilePath, {
      destination: dest,
      resumable: false,
      metadata: { cacheControl: 'public, max-age=31536000' },
    });
    const customDomain = process.env.GCS_CUSTOM_DOMAIN;
    return customDomain
      ? `${customDomain}/${dest}`
      : `https://storage.googleapis.com/${bucketName}/${dest}`;
  } catch (err) {
    logger.error('[GCS] Upload failed:', err);
    throw err;
  }
}

/**
 * Signed URL for private assets (e.g. unreleased tracks). 1 h default.
 */
export async function getSignedUrl(
  objectPath: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const r2 = r2Config();
  if (r2) {
    return s3GetSignedUrl(
      getR2Client(),
      new GetObjectCommand({ Bucket: r2.bucket, Key: objectPath }),
      { expiresIn: expiresInSeconds },
    );
  }

  const bucketName = process.env.GCS_BUCKET || process.env.GOOGLE_CLOUD_BUCKET;
  if (!bucketName) throw new Error('No remote storage configured (set R2_* or GCS_BUCKET)');

  const [url] = await getStorageClient()
    .bucket(bucketName)
    .file(objectPath)
    .getSignedUrl({ action: 'read', expires: Date.now() + expiresInSeconds * 1000 });
  return url;
}
