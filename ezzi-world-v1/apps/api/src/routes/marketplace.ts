import { Router } from 'express';
import type { Request, Response } from 'express';
import { standardRateLimit } from '../middleware/rate-limit';
import { authMiddleware } from '../middleware/auth';
import { ListNFTSchema, MarketplaceFilterSchema } from '../lib/validation';
import { marketplaceService } from '../services/marketplace.service';

const router = Router();

// GET /api/marketplace/listings - Get all active listings
router.get('/listings', standardRateLimit, async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = MarketplaceFilterSchema.safeParse(req.query);

    const listings = await marketplaceService.getListings({
      rarity: filters.success ? filters.data.rarity : undefined,
      zone: filters.success ? filters.data.zone : undefined,
      minPrice: filters.success ? filters.data.minPrice : undefined,
      maxPrice: filters.success ? filters.data.maxPrice : undefined,
      skip: ((filters.success ? filters.data.page : 1) - 1) * 20,
      take: 20,
    });

    res.json({
      success: true,
      data: listings,
    });
  } catch (error) {
    console.error('[MARKETPLACE LIST ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to fetch listings' });
  }
});

// GET /api/marketplace/floor-prices - Get floor prices per rarity
router.get('/floor-prices', async (_req: Request, res: Response): Promise<void> => {
  try {
    const floorPrices = await marketplaceService.getFloorPrices();

    res.json({
      success: true,
      data: floorPrices,
    });
  } catch (error) {
    console.error('[FLOOR PRICES ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to fetch floor prices' });
  }
});

// POST /api/marketplace/list - List an NFT for sale
router.post('/list', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = ListNFTSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: 'Invalid input' });
      return;
    }

    const { nftId, price } = result.data;
    const sellerId = (req as any).user?.id;

    const listing = await marketplaceService.createListing({
      nftId,
      sellerId,
      price,
    });

    res.json({
      success: true,
      data: listing,
    });
  } catch (error) {
    console.error('[LIST NFT ERROR]', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list NFT',
    });
  }
});

// POST /api/marketplace/buy - Buy an NFT
router.post('/buy', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { listingId, txHash } = req.body;
    const buyerId = (req as any).user?.id;

    const purchase = await marketplaceService.purchase({
      listingId,
      buyerId,
      txHash,
    });

    res.json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    console.error('[BUY NFT ERROR]', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to purchase NFT',
    });
  }
});

// POST /api/marketplace/cancel - Cancel a listing
router.post('/cancel', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { listingId } = req.body;
    const sellerId = (req as any).user?.id;

    await marketplaceService.cancelListing(listingId, sellerId);

    res.json({
      success: true,
      data: { message: 'Listing cancelled' },
    });
  } catch (error) {
    console.error('[CANCEL LISTING ERROR]', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel listing',
    });
  }
});

export { router as marketplaceRouter };
