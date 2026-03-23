import { Router } from 'express';
import type { Request, Response } from 'express';
import { solanaService } from '../services/solana.service';
import { logError, logInfo } from '../lib/logger';

export const runtime = 'nodejs';

const router = Router();

// Helius webhook secret for verification
const HELIUS_WEBHOOK_SECRET = process.env.HELIUS_WEBHOOK_SECRET || '';

/**
 * POST /webhooks/helius - Handle Helius webhook events
 * Receives real-time blockchain events
 */
router.post('/helius', async (req: Request, res: Response): Promise<void> => {
  try {
    // Verify webhook secret
    const authHeader = req.headers.authorization;
    if (HELIUS_WEBHOOK_SECRET && authHeader !== `Bearer ${HELIUS_WEBHOOK_SECRET}`) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const events = req.body;

    if (!Array.isArray(events)) {
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }

    for (const event of events) {
      await processHeliusEvent(event);
    }

    res.json({ success: true });
  } catch (error) {
    logError('HELIUS_WEBHOOK_ERROR', error);
    res.status(500).json({ error: 'Internal error' });
  }
});

/**
 * Process individual Helius event
 */
async function processHeliusEvent(event: {
  type: string;
  signature: string;
  accountData?: Array<{ account: string; nativeBalanceChange: number }>;
  tokenTransfers?: Array<{ mint: string; fromUserAccount?: string; toUserAccount?: string; tokenAmount: number }>;
  description?: string;
  timestamp: number;
}): Promise<void> {
  switch (event.type) {
    case 'NFT_SALE':
      await processNFTSale(event);
      break;
    case 'NFT_MINT':
      await processNFTMint(event);
      break;
    case 'TOKEN_TRANSFER':
      await processTokenTransfer(event);
      break;
    default:
      logInfo('UNHANDLED_HELIUS_EVENT', { type: event.type, signature: event.signature });
  }
}

async function processNFTSale(event: {
  signature: string;
  accountData?: Array<{ account: string; nativeBalanceChange: number }>;
  description?: string;
}): Promise<void> {
  logInfo('NFT_SALE_CONFIRMED', {
    signature: event.signature,
    description: event.description,
  });
  // TODO: Update database with sale confirmation
}

async function processNFTMint(event: {
  signature: string;
  accountData?: Array<{ account: string; nativeBalanceChange: number }>;
}): Promise<void> {
  logInfo('NFT_MINT_CONFIRMED', { signature: event.signature });
  // TODO: Update NFT status in database
}

async function processTokenTransfer(event: {
  signature: string;
  tokenTransfers?: Array<{ mint: string; fromUserAccount?: string; toUserAccount?: string; tokenAmount: number }>;
}): Promise<void> {
  logInfo('TOKEN_TRANSFER', {
    signature: event.signature,
    transfers: event.tokenTransfers,
  });
  // TODO: Update balances in database
}

export { router as webhookRouter };
