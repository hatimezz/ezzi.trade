import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';

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
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join public feed room
    socket.join('public-feed');

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

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
