import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment
const envPath = path.join(process.cwd(), '.env');
const envLocalPath = path.join(process.cwd(), '.env.local');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

console.log('🔍 Validating SonicStream Environment...\n');

const required = {
  development: ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'COOKIE_SECRET', 'DATABASE_URL'],
  production: ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'COOKIE_SECRET', 'DATABASE_URL', 'REDIS_URL']
};

const optional = [
  'GEMINI_API_KEY', 'OPENAI_API_KEY', 'STRIPE_SECRET_KEY', 
  'TWILIO_ACCOUNT_SID', 'SMTP_HOST', 'SENTRY_DSN'
];

const env = process.env.NODE_ENV || 'development';
const requiredVars = required[env as keyof typeof required] || required.development;

let hasErrors = false;

// Check required variables
console.log('📋 Required Variables:');
for (const varName of requiredVars) {
  const value = process.env[varName];
  const isValid = value && value.length > 0 && !value.includes('your-');
  const status = isValid ? '✅' : '❌';
  console.log(`  ${status} ${varName}${isValid ? '' : ' (MISSING or invalid)'}`);
  if (!isValid) hasErrors = true;
}

// Check optional variables
console.log('\n📋 Optional Variables (warnings only):');
for (const varName of optional) {
  const value = process.env[varName];
  if (value && !value.includes('your-')) {
    console.log(`  ✅ ${varName} (set)`);
  } else if (value) {
    console.log(`  ⚠️  ${varName} (placeholder value)`);
  } else {
    console.log(`  ⚠️  ${varName} (not set)`);
  }
}

// Check database URL
console.log('\n📋 Database Configuration:');
const dbUrl = process.env.DATABASE_URL || '';
if (dbUrl.startsWith('postgresql:') || dbUrl.startsWith('postgres:')) {
  console.log('  ✅ PostgreSQL configured');
} else if (dbUrl.startsWith('sqlite:')) {
  console.log('  ℹ️  SQLite configured (development only)');
} else {
  console.log('  ❌ Invalid DATABASE_URL format');
  hasErrors = true;
}

// Validate secret lengths
console.log('\n🔐 Secret Validation:');
const jwtSecret = process.env.JWT_SECRET || '';
const cookieSecret = process.env.COOKIE_SECRET || '';

if (jwtSecret.length >= 32) {
  console.log('  ✅ JWT_SECRET length: ' + jwtSecret.length + ' characters (good)');
} else {
  console.log('  ❌ JWT_SECRET too short (min 32 chars)');
  hasErrors = true;
}

if (cookieSecret.length >= 64) {
  console.log('  ✅ COOKIE_SECRET length: ' + cookieSecret.length + ' characters (good)');
} else {
  console.log('  ❌ COOKIE_SECRET too short (min 64 chars)');
  hasErrors = true;
}

console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.error('❌ Environment validation failed! Please fix the issues above.');
  console.log('\n💡 Run: npm run env:generate to create a new .env file');
  process.exit(1);
} else {
  console.log('✅ Environment validation passed!');
  process.exit(0);
}
