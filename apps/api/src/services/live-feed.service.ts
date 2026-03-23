import crypto from 'crypto';
import redis from '../lib/redis';
import { getIO } from '../lib/socket';

const FEED_KEY = 'live_feed:events';
const MAX_EVENTS = 50;

export interface LiveFeedEvent {
  id: string;
  type: 'capsule_opened' | 'nft_purchased' | 'nft_minted' | 'mining_claimed';
  userId: string;
  displayName: string;
  avatarUrl?: string;
  rarity?: string;
  capsuleName?: string;
  warriorName?: string;
  amount?: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export type LiveFeedEventInput = Omit<LiveFeedEvent, 'id' | 'timestamp'>;

export class LiveFeedService {
  async pushEvent(input: LiveFeedEventInput): Promise<void> {
    const event: LiveFeedEvent = {
      ...input,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };

    const serialized = JSON.stringify(event);
    await redis.lpush(FEED_KEY, serialized);
    await redis.ltrim(FEED_KEY, 0, MAX_EVENTS - 1);

    try {
      getIO().to('public-feed').emit('live-feed', event);
    } catch {
      // Socket not yet initialized — event is still persisted in Redis
    }
  }

  async getRecentEvents(): Promise<LiveFeedEvent[]> {
    const raw = await redis.lrange(FEED_KEY, 0, MAX_EVENTS - 1);
    return raw.map((item) => JSON.parse(item) as LiveFeedEvent);
  }
}

export const liveFeedService = new LiveFeedService();
