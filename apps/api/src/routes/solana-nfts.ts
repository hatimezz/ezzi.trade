import { Router } from 'express';
import type { Request, Response } from 'express';
import { PublicKey } from '@solana/web3.js';
import { authMiddleware } from '../middleware/auth';
import { solanaService } from '../services/solana.service';
import { nftService } from '../services/nft.service';
import { logError, logInfo } from '../lib/logger';

export const runtime = 'nodejs';

const router = Router();

/**
 * POST /nfts/mint - Create NFT mint transaction
 * Returns unsigned transaction for user to sign
 */
router.post('/mint', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as unknown as { user: { id: string } }).user?.id;
    const { warriorId, rarity, metadataUri } = req.body;

    if (!warriorId || !metadataUri) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: warriorId, metadataUri',
      });
      return;
    }

    // Get user's wallet address
    // TODO: Get from user service or wallet connection
    const walletAddress = req.body.walletAddress;
    if (!walletAddress) {
      res.status(400).json({
        success: false,
        error: 'Wallet address required',
      });
      return;
    }

    // Create the NFT in database (pending status)
    const nft = await nftService.createNFT({
      warriorId,
      ownerId: userId,
    });

    // Create blockchain mint transaction
    const transaction = await solanaService.createNFTMintTransaction({
      ownerAddress: new PublicKey(walletAddress),
      metadataUri,
      name: nft.warrior?.displayName || `Warrior #${nft.id}`,
      symbol: 'EZZI',
    });

    // Serialize transaction for frontend
    const serializedTx = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    logInfo('NFT_MINT_TX_CREATED', { userId, nftId: nft.id });

    res.json({
      success: true,
      data: {
        nft,
        transaction: Buffer.from(serializedTx).toString('base64'),
      },
    });
  } catch (error) {
    logError('NFT_MINT_ERROR', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create mint transaction',
    });
  }
});

/**
 * POST /nfts/confirm - Confirm NFT mint on blockchain
 */
router.post('/confirm', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { signature, nftId } = req.body;

    if (!signature || !nftId) {
      res.status(400).json({
        success: false,
        error: 'Missing signature or nftId',
      });
      return;
    }

    // Confirm transaction on blockchain
    const confirmation = await solanaService.confirmTransaction(signature);

    if (!confirmation.confirmed) {
      res.status(400).json({
        success: false,
        error: 'Transaction not confirmed',
      });
      return;
    }

    // Update NFT with token ID
    // await nftService.updateNFTToken(nftId, signature);

    logInfo('NFT_MINT_CONFIRMED', { nftId, signature });

    res.json({
      success: true,
      data: { confirmed: true, signature },
    });
  } catch (error) {
    logError('NFT_CONFIRM_ERROR', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm mint',
    });
  }
});

/**
 * GET /nfts/metadata/:mint - Get NFT metadata from blockchain
 */
router.get('/metadata/:mint', async (req: Request, res: Response): Promise<void> => {
  try {
    const { mint } = req.params;
    const metadata = await solanaService.getNFTMetadata(mint);

    if (!metadata) {
      res.status(404).json({
        success: false,
        error: 'NFT not found on blockchain',
      });
      return;
    }

    res.json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    logError('NFT_METADATA_ERROR', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metadata',
    });
  }
});

/**
 * GET /nfts/balance/:address - Get SOL balance
 */
router.get('/balance/:address', async (req: Request, res: Response): Promise<void> => {
  try {
    const { address } = req.params;
    const balance = await solanaService.getBalance(address);

    res.json({
      success: true,
      data: { balance },
    });
  } catch (error) {
    logError('BALANCE_ERROR', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch balance',
    });
  }
});

/**
 * POST /nfts/airdrop - Request devnet airdrop
 */
router.post('/airdrop', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { address, amount = 1 } = req.body;

    if (!address) {
      res.status(400).json({
        success: false,
        error: 'Address required',
      });
      return;
    }

    const signature = await solanaService.requestAirdrop(address, amount);

    if (!signature) {
      res.status(500).json({
        success: false,
        error: 'Airdrop failed',
      });
      return;
    }

    res.json({
      success: true,
      data: { signature },
    });
  } catch (error) {
    logError('AIRDROP_ERROR', error);
    res.status(500).json({
      success: false,
      error: 'Airdrop failed',
    });
  }
});

export { router as solanaNftRouter };
