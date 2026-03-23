import { Router } from 'express';
import type { Request, Response } from 'express';
import { PublicKey } from '@solana/web3.js';
import { authMiddleware } from '../middleware/auth';
import { solanaService } from '../services/solana.service';
import { marketplaceService } from '../services/marketplace.service';
import { nftService } from '../services/nft.service';
import { logError, logInfo } from '../lib/logger';
import { emitNFTPurchase } from '../lib/socket';

export const runtime = 'nodejs';

const router = Router();

/**
 * POST /marketplace/buy-tx - Create purchase transaction
 * Creates unsigned transaction for buyer to sign
 */
router.post('/buy-tx', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as unknown as { user: { id: string } }).user?.id;
    const { listingId, walletAddress } = req.body;

    if (!listingId || !walletAddress) {
      res.status(400).json({
        success: false,
        error: 'Missing listingId or walletAddress',
      });
      return;
    }

    // Get listing details
    const listing = await marketplaceService.getListingById(listingId);
    if (!listing) {
      res.status(404).json({
        success: false,
        error: 'Listing not found',
      });
      return;
    }

    if (listing.status !== 'active') {
      res.status(400).json({
        success: false,
        error: 'Listing not active',
      });
      return;
    }

    // Get seller's wallet address
    const sellerWallet = listing.seller?.wallets?.[0]?.address;
    if (!sellerWallet) {
      res.status(400).json({
        success: false,
        error: 'Seller wallet not found',
      });
      return;
    }

    // Create purchase transaction
    const transaction = await solanaService.createPurchaseTransaction({
      buyerAddress: new PublicKey(walletAddress),
      sellerAddress: new PublicKey(sellerWallet),
      priceLamports: listing.price * 1_000_000_000, // Convert SOL to lamports
      platformFeePercent: 5,
    });

    logInfo('PURCHASE_TX_CREATED', { userId, listingId, price: listing.price });

    res.json({
      success: true,
      data: {
        transaction: Buffer.from(transaction).toString('base64'),
        listing,
      },
    });
  } catch (error) {
    logError('CREATE_PURCHASE_TX_ERROR', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create purchase transaction',
    });
  }
});

/**
 * POST /marketplace/confirm - Confirm purchase on blockchain
 */
router.post('/confirm', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as unknown as { user: { id: string } }).user?.id;
    const { signature, listingId } = req.body;

    if (!signature || !listingId) {
      res.status(400).json({
        success: false,
        error: 'Missing signature or listingId',
      });
      return;
    }

    // Confirm transaction on blockchain
    const confirmation = await solanaService.confirmTransaction(signature);

    if (!confirmation.confirmed) {
      res.status(400).json({
        success: false,
        error: 'Transaction not confirmed on blockchain',
      });
      return;
    }

    // Complete the purchase in database
    const result = await marketplaceService.purchase({
      listingId,
      buyerId: userId,
      txHash: signature,
    });

    // Emit live feed event
    emitNFTPurchase({
      buyerId: userId,
      sellerId: result.listing.sellerId,
      nftId: result.listing.nftId,
      price: result.listing.price,
    });

    logInfo('PURCHASE_CONFIRMED', { userId, listingId, signature });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logError('CONFIRM_PURCHASE_ERROR', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm purchase',
    });
  }
});

/**
 * POST /marketplace/verify-ownership - Verify NFT ownership
 */
router.post('/verify-ownership', async (req: Request, res: Response): Promise<void> => {
  try {
    const { mintAddress, ownerAddress } = req.body;

    if (!mintAddress || !ownerAddress) {
      res.status(400).json({
        success: false,
        error: 'Missing mintAddress or ownerAddress',
      });
      return;
    }

    const isOwner = await solanaService.verifyNFTOwner(mintAddress, ownerAddress);

    res.json({
      success: true,
      data: { isOwner },
    });
  } catch (error) {
    logError('VERIFY_OWNERSHIP_ERROR', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify ownership',
    });
  }
});

/**
 * GET /marketplace/transaction/:signature - Get transaction details
 */
router.get('/transaction/:signature', async (req: Request, res: Response): Promise<void> => {
  try {
    const { signature } = req.params;
    const tx = await solanaService.getTransaction(signature);

    if (!tx) {
      res.status(404).json({
        success: false,
        error: 'Transaction not found',
      });
      return;
    }

    res.json({
      success: true,
      data: tx,
    });
  } catch (error) {
    logError('GET_TRANSACTION_ERROR', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction',
    });
  }
});

export { router as solanaMarketplaceRouter };
