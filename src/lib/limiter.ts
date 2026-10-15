import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const buckets = new Map<string, { count: number; reset: number }>();
export async function enforceRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
) {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    const limiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      prefix: "synchq:ratelimit",
    });
    const result = await limiter.limit(key);
    if (!result.success) throw new Error("RATE_LIMITED");
    return;
  }
  if (process.env.NODE_ENV === "production")
    throw new Error("RATE_LIMIT_NOT_CONFIGURED");
  const now = Date.now();
  const item = buckets.get(key);
  if (!item || item.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowSeconds * 1000 });
    return;
  }
  if (item.count >= limit) throw new Error("RATE_LIMITED");
  item.count++;
}
