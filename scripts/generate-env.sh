#!/bin/bash
# Generate secure .env file with all required variables

echo "🔐 Generating SonicStream .env file..."

# Generate secrets
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
COOKIE_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Ask for environment
read -p "Environment (development/production): " ENV_TYPE
ENV_TYPE=${ENV_TYPE:-development}

# Ask for database type
read -p "Database (sqlite/postgres): " DB_TYPE
DB_TYPE=${DB_TYPE:-sqlite}

# Set database URL
if [ "$DB_TYPE" = "postgres" ]; then
  read -p "PostgreSQL URL (postgresql://user:password@host:5432/db): " DB_URL
else
  DB_URL="sqlite:./sonicstream.db"
fi

# Ask for Redis
read -p "Redis URL (redis://localhost:6379): " REDIS_URL
REDIS_URL=${REDIS_URL:-redis://localhost:6379}

# Generate .env file
cat > .env << EOF
# ─── SonicStream Environment ────────────────────────────────────────────────
# Generated: $(date)
# Environment: ${ENV_TYPE}

NODE_ENV=${ENV_TYPE}
PORT=3000
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
CORS_ALLOWED_ORIGINS=http://localhost:3000
SONIC_ROLE=all

# ── Security ──────────────────────────────────────────────────────────────────
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
BCRYPT_ROUNDS=12
COOKIE_SECRET=${COOKIE_SECRET}

# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL=${DB_URL}

# ── Redis ─────────────────────────────────────────────────────────────────────
REDIS_URL=${REDIS_URL}

# ── Feature Flags (Default: disabled) ──────────────────────────────────────
ENABLE_AI_WORKERS=false
ENABLE_PLATFORM_BRAIN=false
ENABLE_RECOMMENDATIONS=false
ENABLE_RSS_AUTOMATION=false
ENABLE_PAYMENTS=false
EOF

echo "✅ .env file created successfully!"
echo ""
echo "📋 Next steps:"
echo "  1. Review and edit .env if needed"
echo "  2. Run: npm run env:validate"
echo "  3. Run: npm run dev"
