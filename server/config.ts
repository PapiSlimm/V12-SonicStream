import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Load environment files
const envPath = path.join(process.cwd(), '.env');
const envLocalPath = path.join(process.cwd(), '.env.local');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Validate required variables
function validateEnvVar(name: string, minLength: number = 1): string {
  const value = process.env[name];
  if (!value || value.length < minLength) {
    console.warn(`⚠️  Warning: Required environment variable ${name} is not set or is too short. using fallback.`);
    if (name.includes('SECRET')) {
      const fallback = crypto.randomBytes(32).toString('hex');
      console.warn(`   Using temporary secure fallback for ${name}`);
      return fallback;
    }
    return '';
  }
  return value;
}

// Parse boolean with default
function parseBool(name: string, defaultValue: boolean = false): boolean {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
}

export const config = {
  // App
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  SONIC_ROLE: process.env.SONIC_ROLE || 'all',
  
  // Security
  JWT_SECRET: validateEnvVar('JWT_SECRET', 32),
  JWT_REFRESH_SECRET: validateEnvVar('JWT_REFRESH_SECRET', 32),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  COOKIE_SECRET: validateEnvVar('COOKIE_SECRET', 64),
  
  // Database
  DATABASE_URL: validateEnvVar('DATABASE_URL'),
  DATABASE_READ_URL: process.env.DATABASE_READ_URL || '',
  
  // Redis
  REDIS_URL: process.env.REDIS_URL || '',
  
  // Firebase
  GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
  
  // Google Cloud
  GCS_BUCKET: process.env.GCS_BUCKET || '',
  GOOGLE_CLOUD_BUCKET: process.env.GOOGLE_CLOUD_BUCKET || '',
  GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT || '',
  GOOGLE_CLOUD_REGION: process.env.GOOGLE_CLOUD_REGION || 'us-central1',
  GCS_CUSTOM_DOMAIN: process.env.GCS_CUSTOM_DOMAIN || '',
  
  // Stripe
  ENABLE_PAYMENTS: parseBool('ENABLE_PAYMENTS', false),
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || '',
  STRIPE_PRICE_PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
  STRIPE_PRICE_PRO_ANNUAL: process.env.STRIPE_PRICE_PRO_ANNUAL || '',
  STRIPE_PRICE_ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE || '',
  
  // AI
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN || '',
  RUNWAY_API_KEY: process.env.RUNWAY_API_KEY || '',
  
  // Email
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'SonicStream <noreply@sonicstream.io>',
  
  // SMS
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_FROM_NUMBER: process.env.TWILIO_FROM_NUMBER || '',
  
  // ISRC + UPC
  ISRC_COUNTRY_CODE: process.env.ISRC_COUNTRY_CODE || 'US',
  ISRC_REGISTRANT_CODE: process.env.ISRC_REGISTRANT_CODE || 'SS1',
  GS1_COMPANY_PREFIX: process.env.GS1_COMPANY_PREFIX || '',
  
  // Observability
  SENTRY_DSN: process.env.SENTRY_DSN || '',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // Feature Flags
  ENABLE_RSS_AUTOMATION: parseBool('ENABLE_RSS_AUTOMATION', true),
  ENABLE_AI_WORKERS: parseBool('ENABLE_AI_WORKERS', true),
  ENABLE_PLATFORM_BRAIN: parseBool('ENABLE_PLATFORM_BRAIN', true),
  ENABLE_RECOMMENDATIONS: parseBool('ENABLE_RECOMMENDATIONS', true),
  // AutoPilot: default OFF - at 10 cycles/hour it makes ~480 real Gemini calls/day
  // (text + image per cycle). Turning it on is a deliberate cost decision.
  ENABLE_AUTOPILOT: parseBool('ENABLE_AUTOPILOT', false),
  AUTOPILOT_RUNS_PER_HOUR: parseInt(process.env.AUTOPILOT_RUNS_PER_HOUR || '10', 10),
  PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL || '',
  RUN_BOOTSTRAP: parseBool('RUN_BOOTSTRAP', true),
  
  // Performance
  SLOW_QUERY_THRESHOLD_MS: parseInt(process.env.SLOW_QUERY_THRESHOLD_MS || '200', 10),
  MIN_BITRATE_KBPS: parseInt(process.env.MIN_BITRATE_KBPS || '128', 10),
  MIN_DYNAMIC_RANGE: parseInt(process.env.MIN_DYNAMIC_RANGE || '2', 10),
  HIGHLIGHT_ACTIVITY_THRESHOLD: parseInt(process.env.HIGHLIGHT_ACTIVITY_THRESHOLD || '10', 10),
  MAX_UPLOAD_SIZE_MB: parseInt(process.env.MAX_UPLOAD_SIZE_MB || '100', 10),
  
  // CORS
  CORS_ALLOWED_ORIGINS: (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .filter(Boolean),

  // V12 Ecosystem interconnect (see ECOSYSTEM.md)
  // NOTE: deliberately NOT using validateEnvVar for ECOSYSTEM_SECRET — a random
  // per-boot fallback would silently break cross-app auth. Empty = bus disabled.
  APP_ID: process.env.APP_ID || 'sonicstream',
  ECOSYSTEM_SECRET: process.env.ECOSYSTEM_SECRET || '',
  V12_PEERS: process.env.V12_PEERS || ''
};

// Fail-closed (ECOSYSTEM.md): in production, configuring peers without a
// shared secret is a boot error, not a silent no-op.
if (config.NODE_ENV === 'production' && config.V12_PEERS && (!config.ECOSYSTEM_SECRET || config.ECOSYSTEM_SECRET.length < 32)) {
  throw new Error(
    'V12_PEERS is configured but ECOSYSTEM_SECRET is missing or shorter than 32 chars. ' +
    'Set the shared secret (openssl rand -hex 64) in every ecosystem app, or clear V12_PEERS.'
  );
}

// Log configuration (without secrets)
export function logConfig(): void {
  const safeConfig = { ...config };
  // Redact secrets
  const secretKeys = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'COOKIE_SECRET', 'STRIPE_SECRET_KEY', 'TWILIO_AUTH_TOKEN'];
  for (const key of secretKeys) {
    if (safeConfig[key as keyof typeof safeConfig]) {
      (safeConfig as any)[key] = '***REDACTED***';
    }
  }
  console.log('📋 SonicStream Configuration:');
  console.log(JSON.stringify(safeConfig, null, 2));
}

export const allowedOrigins = config.CORS_ALLOWED_ORIGINS;
export default config;
