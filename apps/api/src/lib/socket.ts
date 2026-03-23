import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logInfo, logError } from './logger';
import { realtimeMiningService } from '../services/realtime-mining.service';

let io: SocketServer | null = null;

export function initializeSocket(server: HttpServer): SocketServer {
  io = new SocketServer(server, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:3000',
      ],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logInfo('SOCKET_CLIENT_CONNECTED', { socketId: socket.id });

    // Join public feed room
    socket.join('public-feed');

    // Handle mining room join
    socket.on('mining:join', ({ userId }: { userId: string }) => {
      if (userId) {
        realtimeMiningService.joinUserRoom(socket.id, userId);
      }
    });

    socket.on('disconnect', () => {
      logInfo('SOCKET_CLIENT_DISCONNECTED', { socketId: socket.id });
    });
  });

  // Start real-time mining service
  realtimeMiningService.start();

  return io;
}

export function getIO(): SocketServer {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

// Emit events
export function emitLiveEvent(event: {
  type: string;
  message: string;
  walletAddress: string;
  avatarUrl?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}) {
  if (io) {
    io.to('public-feed').emit('live-event', event);
  }
}

export function emitCapsuleOpen(data: {
  userId: string;
  capsuleName: string;
  result: string;
  rarity?: string;
}) {
  if (io) {
    io.to('public-feed').emit('capsule-opened', data);
  }
}

export function emitNFTPurchase(data: {
  buyerId: string;
  sellerId: string;
  nftId: string;
  price: number;
}) {
  if (io) {
    io.to('public-feed').emit('nft-purchased', data);
  }
}

export function emitMiningClaim(data: {
  userId: string;
  amount: number;
  hours: number;
}) {
  if (io) {
    io.to('public-feed').emit('mining-claimed', data);
  }
}
