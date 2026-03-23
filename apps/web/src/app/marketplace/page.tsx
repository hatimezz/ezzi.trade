'use client';

import { useState } from 'react';
import { useMarketplaceListings, useBuyNFT, useWallet } from '@/hooks/use-api';
import { motion } from 'framer-motion';
import { ShoppingBag, Filter, Loader2 } from 'lucide-react';
import { solana } from '@/lib/solana';
import type { MarketplaceListing } from '@ezzi/shared';

const rarityColors: Record<string, string> = {
  common: 'border-gray-500/30',
  rare: 'border-cyan-500/50',
  epic: 'border-purple-500/50',
  legendary: 'border-amber-500/50',
  mythic: 'border-pink-500/50',
};

const rarityBadge: Record<string, string> = {
  common: 'bg-gray-500/20 text-gray-300',
  rare: 'bg-cyan-500/20 text-cyan-300',
  epic: 'bg-purple-500/20 text-purple-300',
  legendary: 'bg-amber-500/20 text-amber-300',
  mythic: 'bg-pink-500/20 text-pink-300',
};

export const runtime = 'nodejs';

export default function MarketplacePage() {
  const [filters, setFilters] = useState({
    rarity: '',
    zone: '',
    minPrice: '',
    maxPrice: '',
    page: 1,
  });

  const { data: listings, isLoading } = useMarketplaceListings({
    rarity: filters.rarity || undefined,
    zone: filters.zone || undefined,
    minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
    page: filters.page,
  });

  const buyNFT = useBuyNFT();
  const { connected } = useWallet();

  const handleBuy = async (listingId: string) => {
    if (!connected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      // Get transaction hash from Solana wallet
      const txHash = await solana.buyNFT({ listingId });
      await buyNFT.mutateAsync({ listingId, txHash: txHash.signature });
      alert('Purchase successful!');
    } catch (error) {
      alert('Purchase failed: ' + (error as Error).message);
    }
  };

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center space-x-3 mb-4">
            <ShoppingBag className="w-8 h-8 text-[#00d4ff]" />
            <h1 className="text-4xl md:text-5xl font-bold font-['Rajdhani'] uppercase">
              Marketplace
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Buy and sell NFT warriors. Prices increase with each sale.
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center gap-4 mb-8 p-4 bg-[#0a0a1a] rounded-xl border border-white/10"
        >
          <Filter className="w-5 h-5 text-gray-400" />
          <span className="text-gray-400">Filters:</span>

          <select
            value={filters.rarity}
            onChange={(e) => setFilters({ ...filters, rarity: e.target.value })}
            className="bg-[#0d0d1a] border border-white/20 rounded-lg px-4 py-2 text-sm"
          >
            <option value="">All Rarities</option>
            <option value="common">Common</option>
            <option value="rare">Rare</option>
            <option value="epic">Epic</option>
            <option value="legendary">Legendary</option>
            <option value="mythic">Mythic</option>
          </select>

          <select
            value={filters.zone}
            onChange={(e) => setFilters({ ...filters, zone: e.target.value })}
            className="bg-[#0d0d1a] border border-white/20 rounded-lg px-4 py-2 text-sm"
          >
            <option value="">All Zones</option>
            <option value="NEON_CITY">Neon City</option>
            <option value="DESERT_STORM">Desert Storm</option>
            <option value="DEEP_OCEAN">Deep Ocean</option>
            <option value="VOLCANO">Volcano</option>
            <option value="TUNDRA">Tundra</option>
            <option value="THE_VOID">The Void</option>
          </select>

          <input
            type="number"
            placeholder="Min Price"
            value={filters.minPrice}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            className="bg-[#0d0d1a] border border-white/20 rounded-lg px-4 py-2 text-sm w-32"
          />

          <input
            type="number"
            placeholder="Max Price"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            className="bg-[#0d0d1a] border border-white/20 rounded-lg px-4 py-2 text-sm w-32"
          />
        </motion.div>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#00d4ff] animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {listings?.items?.map((listing: MarketplaceListing, index: number) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className={`bg-[#0a0a1a] rounded-2xl overflow-hidden border-2 ${rarityColors[listing.nft?.warrior?.rarity]} hover:border-[#00d4ff]/50 transition-all`}>
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] via-transparent to-transparent z-10" />
                      <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d1a]">
                        <span className="text-6xl">🎮</span>
                      </div>

                      <div className={`absolute top-3 right-3 z-20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${rarityBadge[listing.nft?.warrior?.rarity]}`}>
                        {listing.nft?.warrior?.rarity}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-1 truncate">{listing.nft?.warrior?.displayName}</h3>
                      <p className="text-sm text-gray-400 mb-2">{listing.nft?.warrior?.zone}</p>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">Price</p>
                          <p className="text-xl font-bold text-[#ffd700]">
                            {listing.price} SOL
                          </p>
                        </div>
                        <button
                          onClick={() => handleBuy(listing.id)}
                          disabled={buyNFT.isPending}
                          className="px-4 py-2 bg-[#00d4ff] text-[#02020a] rounded-lg font-bold text-sm hover:bg-[#33e0ff] transition-colors disabled:opacity-50"
                        >
                          {buyNFT.isPending ? 'Buying...' : 'Buy'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {listings?.hasMore && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  className="px-8 py-3 bg-[#00d4ff]/10 border border-[#00d4ff]/30 rounded-lg text-[#00d4ff] font-bold hover:bg-[#00d4ff]/20 transition-colors"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
