import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { logger } from '../middleware/error.js';

let client: SecretManagerServiceClient | null = null;

export async function getSecret(secretName: string, fallbackValue?: string): Promise<string | undefined> {
  // Safe environment verification inside Cloud Run
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId || !process.env.K_SERVICE) {
    logger.debug(`[SecretManager] Skipping Secret Manager for ${secretName} (not run in GCR or GOOGLE_CLOUD_PROJECT undefined). Falling back.`);
    return process.env[secretName] || fallbackValue;
  }

  try {
    if (!client) {
      client = new SecretManagerServiceClient();
    }
    const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
    logger.info(`[SecretManager] Fetching secret from Cloud Secret Manager: ${name}`);
    const [version] = await client.accessSecretVersion({ name });
    const payload = version.payload?.data?.toString();
    if (payload) {
      return payload;
    }
  } catch (err: any) {
    logger.warn(`[SecretManager] Failed to fetch secret ${secretName} from Google Secret Manager. falling back to env. Msg: ${err.message || err}`);
  }

  return process.env[secretName] || fallbackValue;
}
