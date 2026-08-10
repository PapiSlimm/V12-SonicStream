/**
 * Fail-closed configuration for V12 SonicStream.
 *
 * Replaces scattered `process.env.X || 'fallback'` reads. In production a
 * missing required variable throws at boot — the container dies loudly instead
 * of running with a guessable JWT secret or a hardcoded port.
 */
export interface SonicStreamConfig {
  nodeEnv: "development" | "production" | "test";
  isProduction: boolean;
  port: number;
  jwtSecret: string;
  corsOrigins: string[];
  geminiApiKey?: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  /** Ecosystem interconnect (see ecosystem/bus.ts). */
  appId: string;
  ecosystemSecret?: string;
  /** name=url pairs, e.g. "v12-core=https://v12multimedia.com" */
  peers: Record<string, string>;
}

let cached: SonicStreamConfig | null = null;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): SonicStreamConfig {
  const nodeEnv = (env.NODE_ENV === "production" || env.NODE_ENV === "test" ? env.NODE_ENV : "development") as SonicStreamConfig["nodeEnv"];
  const isProduction = nodeEnv === "production";

  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`[config] PORT must be a positive integer, got "${env.PORT}"`);
  }

  const jwtSecret = env.JWT_SECRET ?? "";
  if (isProduction && jwtSecret.length < 32) {
    throw new Error(
      "[config] JWT_SECRET (min 32 chars) is REQUIRED in production. " +
        "There is no fallback secret anymore — that was a critical hole.",
    );
  }

  const corsOrigins = (env.CORS_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (isProduction && corsOrigins.length === 0) {
    throw new Error("[config] CORS_ORIGINS must list explicit origins in production (no wildcard).");
  }

  const peers: Record<string, string> = {};
  for (const pair of (env.V12_PEERS ?? "").split(",").map((s) => s.trim()).filter(Boolean)) {
    const idx = pair.indexOf("=");
    if (idx <= 0) throw new Error(`[config] Bad V12_PEERS entry: "${pair}" (want name=url)`);
    peers[pair.slice(0, idx)] = pair.slice(idx + 1);
  }

  const ecosystemSecret = env.ECOSYSTEM_SECRET;
  if (isProduction && Object.keys(peers).length > 0 && (!ecosystemSecret || ecosystemSecret.length < 32)) {
    throw new Error("[config] ECOSYSTEM_SECRET (min 32 chars) is required when V12_PEERS is set in production.");
  }

  cached = {
    nodeEnv,
    isProduction,
    port,
    jwtSecret: jwtSecret || "dev-only-secret-do-not-use-in-production",
    corsOrigins,
    geminiApiKey: env.GEMINI_API_KEY || env.API_KEY,
    stripeSecretKey: env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
    appId: env.APP_ID || "sonicstream",
    ecosystemSecret,
    peers,
  };
  return cached;
}

export function config(): SonicStreamConfig {
  return cached ?? loadConfig();
}
