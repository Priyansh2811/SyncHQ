import { Emitter } from "@socket.io/redis-emitter";
import Redis from "ioredis";

let emitter: Emitter | undefined;
export async function emitToRoom(
  room: string,
  event: string,
  payload: unknown,
) {
  if (!process.env.REDIS_URL) {
    if (process.env.NODE_ENV === "production")
      throw new Error("REDIS_URL is required for real-time events");
    return;
  }
  if (!emitter) {
    const redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
    emitter = new Emitter(redis);
  }
  emitter.to(room).emit(event, payload);
}
