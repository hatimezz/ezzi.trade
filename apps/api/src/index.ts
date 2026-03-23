import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createServer } from 'http';

dotenv.config();

import { healthRouter } from './routes/health';
import { nftRouter } from './routes/nft';
import { marketplaceRouter } from './routes/marketplace';
import { miningRouter } from './routes/mining';
import { capsuleRouter } from './routes/capsule';
import { userRouter } from './routes/user';
import { authRouter } from './routes/auth';
import { adminRouter } from './routes/admin';
import { solanaNftRouter } from './routes/solana-nfts';
import { solanaMarketplaceRouter } from './routes/solana-marketplace';
import { webhookRouter } from './routes/webhooks';
import { escrowRouter } from './routes/escrow';
import { initializeSocket } from './lib/socket';
import { logError, logInfo } from './lib/logger';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// Initialize Socket.io
initializeSocket(server);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
    ],
    credentials: true,
  })
);
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('combined'));

// Routes
app.use('/api/health', healthRouter);
app.use('/api/nfts', nftRouter);
app.use('/api/marketplace', marketplaceRouter);
app.use('/api/mining', miningRouter);
app.use('/api/capsules', capsuleRouter);
app.use('/api/users', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/solana/nfts', solanaNftRouter);
app.use('/api/solana/marketplace', solanaMarketplaceRouter);
app.use('/api/webhooks', webhookRouter);
app.use('/api/escrow', escrowRouter);

// 404 handler
app.use((_req: express.Request, res: express.Response): void => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ): void => {
    logError('INTERNAL_SERVER_ERROR', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
);

// Start server
server.listen(PORT, '0.0.0.0', () => {
  logInfo('SERVER_STARTED', { port: PORT, environment: process.env.NODE_ENV });
});

export default app;
