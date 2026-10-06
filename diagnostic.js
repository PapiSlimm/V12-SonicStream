// diagnostic.js - Run with: node diagnostic.js
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

console.log('🔍 SONICSTREAM DIAGNOSTIC TOOL v1.0');
console.log('='.repeat(60));

// 1. Check Node.js version
console.log('\n📌 NODE VERSION:');
const nodeVersion = process.version;
console.log(`   ${nodeVersion}`);
if (parseInt(nodeVersion.slice(1).split('.')[0]) < 18) {
  console.log('   ❌ Node 18+ required');
} else {
  console.log('   ✅ OK');
}

// 2. Check environment file
console.log('\n📌 ENVIRONMENT FILES:');
const envFiles = ['.env', '.env.local', '.env.production'];
envFiles.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  console.log(`   ${file}: ${exists ? '✅' : '❌'}`);
});

// 3. Check critical files
console.log('\n📌 CRITICAL FILES:');
const criticalFiles = [
  'server/config.js',
  'server/db.js',
  'server/firebase-admin.js',
  'server/services/ServiceRegistry.js',
  'server/services/PlatformBrain.js',
  'server/services/RecommendationEngine.js',
  'server/services/HighlightWorker.js',
  'server/services/rssService.js',
  'server/monitoring.js',
  'server/jobs.js',
  'server/canary.js',
  'server/utils/storage.js',
  'server/middleware/error.js',
  'server/middleware/rateLimit.js',
  'server/middleware/sentry.js',
  'server/domains/identity/auth.js',
  'server/domains/identity/user.routes.js',
];

criticalFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  const exists = fs.existsSync(fullPath);
  console.log(`   ${file}: ${exists ? '✅' : '❌'}`);
});

// 4. Check for ESM vs CJS issues
console.log('\n📌 PACKAGE TYPE:');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
console.log(`   type: ${pkg.type || 'commonjs'}`);
if (pkg.type !== 'module') {
  console.log('   ⚠️  package.json missing "type": "module" - may cause import issues');
}

// 5. Check dependencies
console.log('\n📌 CRITICAL DEPENDENCIES:');
const deps = [
  'express', 'express-session', 'cors', 'helmet', 'compression',
  'socket.io', 'ioredis', 'sqlite3', 'pg', 'firebase-admin',
  'jsonwebtoken', 'dotenv', 'zod', 'bullmq'
];

deps.forEach(dep => {
  try {
    const pkgPath = require.resolve(dep, { paths: [process.cwd()] });
    const version = JSON.parse(fs.readFileSync(
      path.join(path.dirname(pkgPath), 'package.json'), 'utf8'
    )).version;
    console.log(`   ${dep}: ✅ ${version}`);
  } catch (e) {
    console.log(`   ${dep}: ❌ NOT FOUND`);
  }
});

// 6. Check for syntax errors in server.ts
console.log('\n📌 SERVER.TS SYNTAX CHECK:');
try {
  execSync('npx tsc --noEmit server.ts 2>&1', { 
    stdio: 'pipe', 
    encoding: 'utf8' 
  });
  console.log('   ✅ No TypeScript errors');
} catch (e) {
  console.log('   ❌ TypeScript errors found:');
  console.log(e.stdout || e.stderr || e.message);
}

// 7. Test database connectivity
console.log('\n📌 DATABASE TEST:');
const dbUrl = process.env.DATABASE_URL || 'sqlite:./sonicstream.db';
console.log(`   URL: ${dbUrl.replace(/:[^:@]*@/, ':****@')}`);
try {
  const { initDB } = await import('./server/db.js');
  await initDB();
  console.log('   ✅ Database connected');
} catch (e) {
  console.log(`   ❌ Database error: ${e.message}`);
}

// 8. Environment variables check
console.log('\n📌 REQUIRED ENV VARS:');
const required = ['NODE_ENV', 'JWT_SECRET', 'DATABASE_URL'];
required.forEach(v => {
  const val = process.env[v];
  console.log(`   ${v}: ${val ? '✅' + (v.includes('SECRET') ? ' [set]' : ` ${val}`) : '❌ MISSING'}`);
});

console.log('\n' + '='.repeat(60));
console.log('✅ Diagnostic complete. Check output above for issues.');
