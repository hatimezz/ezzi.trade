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
import { initializeSocket } from './lib/socket';

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
    console.error('[ERROR]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
);

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[API] Server running on port ${PORT}`);
  console.log(`[Socket.io] Initialized`);
});

export default app;
