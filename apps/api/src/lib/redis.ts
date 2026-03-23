import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export { redis };
export default redis;

export async function getCachedKey(key: string): Promise<string | null> {
  return redis.get(key);
}

export async function setCachedKey(
  key: string,
  value: string,
  ttlSeconds = 300
): Promise<void> {
  await redis.setex(key, ttlSeconds, value);
}

export async function deleteCachedKey(key: string): Promise<void> {
  await redis.del(key);
}
