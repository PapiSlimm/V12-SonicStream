#!/bin/bash
# launch-check.sh

echo "🔍 Checking SonicStream V12 launch requirements..."

# 1. Check environment variables
required_vars=("JWT_SECRET" "DATABASE_URL" "REDIS_URL" "GEMINI_API_KEY")
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing $var"
    exit 1
  fi
done
echo "✅ Environment variables set"

# 2. Check all critical files exist
required_files=(
  "server/config.js"
  "server/db.js"
  "server/firebase-admin.js"
  "server/services/firebase.js"
  "server/services/ServiceRegistry.js"
  "server/services/PlatformBrain.js"
  "server/services/RecommendationEngine.js"
  "server/services/HighlightWorker.js"
  "server/services/rssService.js"
  "server/monitoring.js"
  "server/jobs.js"
  "server/canary.js"
)

for file in "${required_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Missing $file"
    exit 1
  fi
done
echo "✅ All required files exist"

# 3. Test database connectivity (using ESM-friendly dynamic imports)
echo "Testing database..."
node --input-type=module -e "
import('./server/db.js').then(({ get }) => {
  get('SELECT 1').then(() => {
    console.log('✅ Database connected');
    process.exit(0);
  }).catch((err) => {
    console.error('❌ Connection failed:', err);
    process.exit(1);
  });
}).catch((err) => {
  console.error('❌ Loading database module failed:', err);
  process.exit(1);
});
" || exit 1

# 4. Test Redis connectivity (optional)
if [ -n "$REDIS_URL" ]; then
  echo "Testing Redis..."
  node --input-type=module -e "
  import('ioredis').then(({ default: Redis }) => {
    const client = new Redis(process.env.REDIS_URL);
    client.ping().then(() => {
      console.log('✅ Redis connected');
      process.exit(0);
    }).catch(() => {
      console.log('⚠️ Redis connection failed (optional)');
      process.exit(0);
    });
  }).catch(() => {
    console.log('⚠️ Redis module missing or failed (optional)');
    process.exit(0);
  });
  "
fi

echo "✅ All checks passed! Ready to launch."
