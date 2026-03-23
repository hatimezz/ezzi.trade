import { Router } from 'express';
import type { Request, Response } from 'express';
import { standardRateLimit } from '../middleware/rate-limit';
import { authMiddleware } from '../middleware/auth';
import { nftService } from '../services/nft.service';

const router = Router();

// GET /api/nfts - List all NFTs with filters
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { rarity, zone, minPrice, maxPrice, page = '1', limit = '20', ownerId, isListed } = req.query;

    const nfts = await nftService.getNFTs({
      rarity: rarity as string | undefined,
      zone: zone as string | undefined,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      ownerId: ownerId as string | undefined,
      isListed: isListed === 'true' ? true : isListed === 'false' ? false : undefined,
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: nfts,
    });
  } catch (error) {
    console.error('[NFT LIST ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to fetch NFTs' });
  }
});

// GET /api/nfts/warriors - Get all warrior templates
router.get('/warriors', async (_req: Request, res: Response): Promise<void> => {
  try {
    const warriors = await nftService.getWarriors();

    res.json({
      success: true,
      data: warriors,
    });
  } catch (error) {
    console.error('[WARRIORS ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to fetch warriors' });
  }
});

// GET /api/nfts/:id - Get single NFT details
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const nft = await nftService.getNFTById(id);

    if (!nft) {
      res.status(404).json({ success: false, error: 'NFT not found' });
      return;
    }

    res.json({
      success: true,
      data: nft,
    });
  } catch (error) {
    console.error('[NFT DETAIL ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to fetch NFT' });
  }
});

// POST /api/nfts/:id/repair - Repair NFT durability
router.post('/:id/repair', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const { amount } = req.body;

    const repair = await nftService.repairNFT(id, userId, amount);

    res.json({
      success: true,
      data: repair,
    });
  } catch (error) {
    console.error('[REPAIR NFT ERROR]', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to repair NFT',
    });
  }
});

export { router as nftRouter };
