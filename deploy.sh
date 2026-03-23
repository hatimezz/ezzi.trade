#!/bin/bash

# EZZI WORLD - Deployment Script
# This script deploys the entire application to production

set -e

echo "🚀 EZZI WORLD Deployment Script"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please copy .env.example to .env and configure it."
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

echo ""
echo "📦 Step 1: Installing dependencies..."
pnpm install

echo ""
echo "🔨 Step 2: Building shared package..."
cd packages/shared
pnpm build
cd ../..

echo ""
echo "🗄️  Step 3: Database setup..."
cd apps/api
pnpm prisma generate
pnpm prisma migrate deploy
pnpm prisma db seed
cd ../..

echo ""
echo "🔧 Step 4: Building API..."
cd apps/api
pnpm build
cd ../..

echo ""
echo "🎨 Step 5: Building Web frontend..."
cd apps/web
pnpm build
cd ../..

echo ""
echo "📱 Step 6: Building Telegram Mini App..."
cd apps/telegram
pnpm build
cd ../..

echo ""
echo "🐳 Step 7: Building Docker image..."
docker build -t ezzi-world-api:latest .

echo ""
echo "☁️  Step 8: Deploying to Fly.io..."
fly deploy --app ezzi-world-api --image ezzi-world-api:latest

echo ""
echo "🚀 Step 9: Deploying Web to Vercel..."
cd apps/web
vercel --prod --yes
cd ../..

echo ""
echo "🤖 Step 10: Setting up Telegram bot..."
echo "Please configure your Telegram bot webhook manually at:"
echo "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<API_URL>/api/telegram/webhook"

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "📊 Your app is now live at:"
echo "   API: https://ezzi-world-api.fly.dev"
echo "   Web: https://ezzi.vercel.app"
echo ""
echo "🔧 Next steps:"
echo "   1. Verify health: curl https://ezzi-world-api.fly.dev/api/health"
echo "   2. Check database: pnpm --filter api db:studio"
echo "   3. Monitor logs: fly logs --app ezzi-world-api"
echo ""
