import { Router } from 'express';
import type { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { escrowService } from '../services/escrow.service';
import { marketplaceService } from '../services/marketplace.service';
import { nftService } from '../services/nft.service';
import { logError, logInfo } from '../lib/logger';
import { emitNFTPurchase } from '../lib/socket';

export const runtime = 'nodejs';

const router = Router();

/**
 * POST /escrow/create - Create escrow transaction
 * Creates an unsigned transaction for the buyer to sign
 */
router.post('/create', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as unknown as { user: { id: string } }).user?.id;
    const { listingId } = req.body;

    if (!listingId) {
      res.status(400).json({
        success: false,
        error: 'Listing ID required',
      });
      return;
    }

    // Get listing details
    const listing = await marketplaceService.getListingById(listingId);
    if (!listing || listing.status !== 'active') {
      res.status(404).json({
        success: false,
        error: 'Listing not found or not active',
      });
      return;
    }

    // Verify buyer is not the seller
    if (listing.sellerId === userId) {
      res.status(400).json({
        success: false,
        error: 'Cannot buy your own NFT',
      });
      return;
    }

    // Create escrow transaction
    const escrow = await escrowService.createEscrowTransaction({
      listingId,
      buyerId: userId,
      sellerId: listing.sellerId,
      price: listing.price,
      nftId: listing.nftId,
    });

    logInfo('ESCROW_CREATED', {
      userId,
      listingId,
      escrowId: escrow.escrowId,
    });

    res.json({
      success: true,
      data: escrow,
    });
  } catch (error) {
    logError('CREATE_ESCROW_ROUTE_ERROR', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create escrow',
    });
  }
});

/**
 * POST /escrow/confirm - Confirm escrow after blockchain transaction
 */
router.post('/confirm', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as unknown as { user: { id: string } }).user?.id;
    const { escrowId, signature, listingId } = req.body;

    if (!escrowId || !signature || !listingId) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
      return;
    }

    // Confirm escrow on blockchain
    const confirmed = await escrowService.confirmEscrow(escrowId, signature);

    if (!confirmed) {
      res.status(400).json({
        success: false,
        error: 'Failed to confirm escrow',
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

    logInfo('ESCROW_CONFIRMED_ROUTE', {
      userId,
      escrowId,
      listingId,
      signature,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logError('CONFIRM_ESCROW_ROUTE_ERROR', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm escrow',
    });
  }
});

/**
 * POST /escrow/cancel - Cancel escrow
 */
router.post('/cancel', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { escrowId } = req.body;

    if (!escrowId) {
      res.status(400).json({
        success: false,
        error: 'Escrow ID required',
      });
      return;
    }

    const cancelled = await escrowService.cancelEscrow(escrowId);

    if (!cancelled) {
      res.status(400).json({
        success: false,
        error: 'Failed to cancel escrow',
      });
      return;
    }

    res.json({
      success: true,
      data: { cancelled: true },
    });
  } catch (error) {
    logError('CANCEL_ESCROW_ROUTE_ERROR', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel escrow',
    });
  }
});

/**
 * GET /escrow/:id - Get escrow details
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const escrow = await escrowService.getEscrow(id);

    if (!escrow) {
      res.status(404).json({
        success: false,
        error: 'Escrow not found',
      });
      return;
    }

    res.json({
      success: true,
      data: escrow,
    });
  } catch (error) {
    logError('GET_ESCROW_ROUTE_ERROR', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get escrow',
    });
  }
});

export { router as escrowRouter };
