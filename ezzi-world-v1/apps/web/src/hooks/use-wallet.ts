'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Phantom wallet types
declare global {
  interface Window {
    phantom?: {
      solana?: {
        isPhantom?: boolean;
        publicKey?: { toString(): string };
        connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString(): string } }>;
        disconnect: () => Promise<void>;
        signMessage: (message: Uint8Array, encoding: string) => Promise<{ signature: Uint8Array }>;
        on: (event: string, callback: (args: any) => void) => void;
      };
    };
  }
}

interface WalletState {
  connected: boolean;
  publicKey: string | null;
  connecting: boolean;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    connected: false,
    publicKey: null,
    connecting: false,
  });

  const queryClient = useQueryClient();

  // Check if wallet is installed
  const isPhantomInstalled = typeof window !== 'undefined' && !!window.phantom?.solana?.isPhantom;

  // Connect wallet mutation
  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!isPhantomInstalled) {
        throw new Error('Phantom wallet not installed');
      }

      const provider = window.phantom!.solana!;
      const response = await provider.connect();
      const publicKey = response.publicKey.toString();

      // Sign message to verify ownership
      const message = new TextEncoder().encode(
        `Sign this message to authenticate with EZZI World: ${Date.now()}`
      );
      const signed = await provider.signMessage(message, 'utf8');

      // Send to backend
      const res = await api.post('/users/connect-wallet', {
        address: publicKey,
        chain: 'solana',
        signature: Buffer.from(signed.signature).toString('base64'),
        message: Buffer.from(message).toString('base64'),
      });

      return { publicKey, ...res.data };
    },
    onSuccess: (data) => {
      setState({
        connected: true,
        publicKey: data.publicKey,
        connecting: false,
      });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: () => {
      setState((prev) => ({ ...prev, connecting: false }));
    },
  });

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    if (window.phantom?.solana) {
      await window.phantom.solana.disconnect();
    }
    setState({
      connected: false,
      publicKey: null,
      connecting: false,
    });
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    const autoConnect = async () => {
      if (!isPhantomInstalled) return;

      try {
        setState((prev) => ({ ...prev, connecting: true }));
        const provider = window.phantom!.solana!;

        // Check if already connected
        if (provider.publicKey) {
          setState({
            connected: true,
            publicKey: provider.publicKey.toString(),
            connecting: false,
          });
          return;
        }

        // Try silent connect
        const response = await provider.connect({ onlyIfTrusted: true });
        setState({
          connected: true,
          publicKey: response.publicKey.toString(),
          connecting: false,
        });
      } catch (error) {
        // Silent fail - user needs to manually connect
        setState((prev) => ({ ...prev, connecting: false }));
      }
    };

    autoConnect();
  }, [isPhantomInstalled]);

  // Listen for account changes
  useEffect(() => {
    if (!isPhantomInstalled || !window.phantom?.solana) return;

    const provider = window.phantom.solana;

    const handleAccountChange = (publicKey: { toString(): string } | null) => {
      if (publicKey) {
        setState({
          connected: true,
          publicKey: publicKey.toString(),
          connecting: false,
        });
      } else {
        setState({
          connected: false,
          publicKey: null,
          connecting: false,
        });
      }
    };

    provider.on('accountChanged', handleAccountChange);

    return () => {
      // Cleanup not needed for Phantom
    };
  }, [isPhantomInstalled]);

  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, connecting: true }));
    await connectMutation.mutateAsync();
  }, [connectMutation]);

  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return {
    ...state,
    isPhantomInstalled,
    connect,
    disconnect,
    truncateAddress,
    isLoading: connectMutation.isPending,
    error: connectMutation.error,
  };
}
