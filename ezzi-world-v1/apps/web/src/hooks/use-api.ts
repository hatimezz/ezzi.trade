'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
export { useWallet } from './use-wallet';
export { useSocket } from './use-socket';

// NFT Hooks
export function useNFTs(filters?: {
  rarity?: string;
  zone?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['nfts', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.rarity) params.append('rarity', filters.rarity);
      if (filters?.zone) params.append('zone', filters.zone);
      if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
      if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const res = await api.get(`/nfts?${params}`);
      return res.data.data;
    },
  });
}

export function useNFT(id: string) {
  return useQuery({
    queryKey: ['nft', id],
    queryFn: async () => {
      const res = await api.get(`/nfts/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useWarriors() {
  return useQuery({
    queryKey: ['warriors'],
    queryFn: async () => {
      const res = await api.get('/nfts/warriors');
      return res.data.data;
    },
  });
}

// Marketplace Hooks
export function useMarketplaceListings(filters?: {
  rarity?: string;
  zone?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
}) {
  return useQuery({
    queryKey: ['marketplace-listings', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.rarity) params.append('rarity', filters.rarity);
      if (filters?.zone) params.append('zone', filters.zone);
      if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
      if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
      if (filters?.page) params.append('page', filters.page.toString());

      const res = await api.get(`/marketplace/listings?${params}`);
      return res.data.data;
    },
  });
}

export function useFloorPrices() {
  return useQuery({
    queryKey: ['floor-prices'],
    queryFn: async () => {
      const res = await api.get('/marketplace/floor-prices');
      return res.data.data;
    },
  });
}

export function useListNFT() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { nftId: string; price: number }) => {
      const res = await api.post('/marketplace/list', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      queryClient.invalidateQueries({ queryKey: ['user-nfts'] });
    },
  });
}

export function useBuyNFT() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { listingId: string; txHash: string }) => {
      const res = await api.post('/marketplace/buy', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      queryClient.invalidateQueries({ queryKey: ['user-nfts'] });
      queryClient.invalidateQueries({ queryKey: ['user-balance'] });
    },
  });
}

// Mining Hooks
export function useMiningSessions() {
  return useQuery({
    queryKey: ['mining-sessions'],
    queryFn: async () => {
      const res = await api.get('/mining/sessions');
      return res.data.data;
    },
  });
}

export function useMiningHistory() {
  return useQuery({
    queryKey: ['mining-history'],
    queryFn: async () => {
      const res = await api.get('/mining/history');
      return res.data.data;
    },
  });
}

export function useZones() {
  return useQuery({
    queryKey: ['zones'],
    queryFn: async () => {
      const res = await api.get('/mining/zones');
      return res.data.data;
    },
  });
}

export function useStartMining() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { nftId: string; zone: string }) => {
      const res = await api.post('/mining/start', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mining-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['user-nfts'] });
    },
  });
}

export function useEndMining() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { sessionId: string }) => {
      const res = await api.post('/mining/end', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mining-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['mining-history'] });
      queryClient.invalidateQueries({ queryKey: ['user-balance'] });
    },
  });
}

// Capsule Hooks
export function useCapsuleTiers() {
  return useQuery({
    queryKey: ['capsule-tiers'],
    queryFn: async () => {
      const res = await api.get('/capsules');
      return res.data.data;
    },
  });
}

export function useOpenCapsule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (capsuleTierId: string) => {
      const res = await api.post('/capsules/open', { capsuleTierId });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capsule-tiers'] });
      queryClient.invalidateQueries({ queryKey: ['user-capsule-openings'] });
      queryClient.invalidateQueries({ queryKey: ['user-nfts'] });
      queryClient.invalidateQueries({ queryKey: ['user-balance'] });
    },
  });
}

export function useRecentOpenings() {
  return useQuery({
    queryKey: ['recent-openings'],
    queryFn: async () => {
      const res = await api.get('/capsules/recent');
      return res.data.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// User Hooks
export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const res = await api.get('/users/profile');
      return res.data.data;
    },
  });
}

export function useUserNFTs() {
  return useQuery({
    queryKey: ['user-nfts'],
    queryFn: async () => {
      const res = await api.get('/users/nfts');
      return res.data.data;
    },
  });
}

export function useUserBalance() {
  return useQuery({
    queryKey: ['user-balance'],
    queryFn: async () => {
      const res = await api.get('/users/balance');
      return res.data.data;
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

export function usePlatformStats() {
  return useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const res = await api.get('/users/stats');
      return res.data.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
