# EZZI World v1.0

The #1 Web3 gaming platform of 2026 - Complete NFT Marketplace + Mining Platform

## Features

- 2,300 NFT Warriors with 8 unique designs
- 23,000 Capsules with cinematic opening
- Marketplace (Buy/Sell NFTs with auto-increasing prices)
- Mining System (Earn EZZI coins with your NFTs)
- Telegram Mini App
- Live Activity Feed
- Admin Dashboard

## Stack

- Frontend: Next.js 15 + TypeScript + Tailwind CSS v4
- Backend: Express + Prisma + PostgreSQL
- Blockchain: Solana + Anchor
- Real-time: Socket.io + Redis
- Hosting: Vercel (frontend) + Fly.io (API)

## Monorepo Structure

```
apps/
  api/         → Express backend + Prisma
  web/         → Next.js frontend
  telegram/    → Telegram Mini App
packages/
  shared/      → Shared types and utilities
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Set up environment
cp apps/api/.env.example apps/api/.env
# Edit .env with your credentials

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Start development
pnpm dev
```

## License

Private - All rights reserved.
