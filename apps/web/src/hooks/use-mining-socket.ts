import { useEffect, useCallback, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface MiningUpdate {
  sessionId: string;
  nftId: string;
  zone: string;
  totalEarnings: number;
  sessionTimeSeconds: number;
  earningsPerSecond: number;
  timestamp: number;
}

interface MiningStartedEvent {
  sessionId: string;
  nftId: string;
  zone: string;
  startedAt: string;
  timestamp: number;
}

interface MiningEndedEvent {
  sessionId: string;
  earnings: number;
  hours: number;
  timestamp: number;
}

export function useMiningSocket(userId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentEarnings, setCurrentEarnings] = useState<Record<string, MiningUpdate>>({});
  const [lastEvent, setLastEvent] = useState<{
    type: 'started' | 'ended' | 'update';
    data: unknown;
  } | null>(null);

  useEffect(() => {
    if (!userId) return;

    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const socket = io(socketUrl, {
      transports: ['websocket'],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Join mining room for this user
      socket.emit('mining:join', { userId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for mining updates
    socket.on('mining:update', (data: MiningUpdate) => {
      setCurrentEarnings((prev) => ({
        ...prev,
        [data.sessionId]: data,
      }));
      setLastEvent({ type: 'update', data });
    });

    // Listen for mining started
    socket.on('mining:started', (data: MiningStartedEvent) => {
      setLastEvent({ type: 'started', data });
      // Clear old earnings for this session
      setCurrentEarnings((prev) => {
        const updated = { ...prev };
        delete updated[data.sessionId];
        return updated;
      });
    });

    // Listen for mining ended
    socket.on('mining:ended', (data: MiningEndedEvent) => {
      setLastEvent({ type: 'ended', data });
      // Remove this session from earnings
      setCurrentEarnings((prev) => {
        const updated = { ...prev };
        delete updated[data.sessionId];
        return updated;
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  const getSessionEarnings = useCallback((sessionId: string): MiningUpdate | null => {
    return currentEarnings[sessionId] || null;
  }, [currentEarnings]);

  const getTotalEarnings = useCallback((): number => {
    return Object.values(currentEarnings).reduce(
      (total, session) => total + session.totalEarnings,
      0
    );
  }, [currentEarnings]);

  return {
    isConnected,
    currentEarnings,
    lastEvent,
    getSessionEarnings,
    getTotalEarnings,
  };
}

export type { MiningUpdate, MiningStartedEvent, MiningEndedEvent };
