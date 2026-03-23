'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export function useSocket(): { socket: Socket | null; connected: boolean } {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      setConnected(true);
      newSocket.emit('join-room', 'public-feed');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    // Listen for live events
    newSocket.on('live-event', (_event) => {
      // Live event received - UI updates via query invalidation
    });

    // Listen for capsule opens
    newSocket.on('capsule-opened', () => {
      queryClient.invalidateQueries({ queryKey: ['recent-openings'] });
      queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
    });

    // Listen for NFT purchases
    newSocket.on('nft-purchased', () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
    });

    // Listen for mining claims
    newSocket.on('mining-claimed', () => {
      queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [queryClient]);

  return { socket, connected };
}
