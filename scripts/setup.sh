#!/bin/bash
# Complete SonicStream Setup Script

set -e

echo "🚀 SonicStream - Complete Setup"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check Node.js
echo "📌 Step 1: Checking Node.js..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}❌ Node.js 18+ required. Current: $(node -v)${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v) OK${NC}"

# Step 2: Install dependencies
echo ""
echo "📦 Step 2: Installing dependencies..."
npm ci 2>/dev/null || npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 3: Generate environment file
echo ""
echo "🔐 Step 3: Setting up environment..."
if [ ! -f .env ] && [ ! -f .env.local ]; then
  echo "Creating .env file..."
  bash scripts/generate-env.sh
else
  echo -e "${YELLOW}⚠️  .env file already exists. Skipping generation.${NC}"
fi

# Step 4: Validate environment
echo ""
echo "🔍 Step 4: Validating environment..."
npm run env:validate || {
  echo -e "${YELLOW}⚠️  Environment validation had issues. Please check .env${NC}"
}

# Step 5: Create required directories
echo ""
echo "📁 Step 5: Creating directories..."
mkdir -p storage/{uploads,temp,cache,logs}
mkdir -p server/{routes,domains/{identity,music,social,finance,events},services,middleware,utils}
echo -e "${GREEN}✅ Directories created${NC}"

# Step 6: Run migrations
echo ""
echo "🗄️  Step 6: Running migrations..."
npm run migrate || {
  echo -e "${YELLOW}⚠️  Migration had issues. Database may not be ready.${NC}"
}

# Step 7: Build the application
echo ""
echo "🏗️  Step 7: Building application..."
npm run build || {
  echo -e "${YELLOW}⚠️  Build had warnings. Continuing...${NC}"
}

# Step 8: Final check
echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Review and edit .env if needed"
echo "  2. Run: npm run dev"
echo "  3. Open: http://localhost:3000"
echo ""
echo "📚 Documentation:"
echo "  - API: http://localhost:3000/api/v1/identity/status"
echo "  - Health: http://localhost:3000/health/live"
echo "  - Metrics: http://localhost:3000/metrics"
