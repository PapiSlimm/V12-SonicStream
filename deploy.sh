#!/bin/bash
# Deploy SonicStream V12 with role-based architecture

set -e

# Install dependencies
npm ci --only=production

# Build the application
npm run build

# Deploy based on role
case "$1" in
  migration)
    echo "Running database migration..."
    node dist/server.cjs
    ;;
  worker|ai|api|all)
    echo "Running migrations before starting..."
    npx tsx migrate_user_avatar.ts
    node dist/server.cjs
    ;;
  *)
    echo "Usage: $0 {migration|worker|ai|api|all}"
    exit 1
    ;;
esac
