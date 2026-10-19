import { createServer } from "node:http";
import { createHmac } from "node:crypto";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { db } from "../src/lib/db";
import { SESSION_COOKIE } from "../src/lib/auth";
import { withTenant } from "../src/lib/rbac";

// Render supplies PORT; fallback to SOCKET_PORT or 4001
const port = Number(process.env.PORT ?? process.env.SOCKET_PORT ?? 4001);
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const server = createServer();
const io = new Server(server, {
  cors: { origin: appUrl, credentials: true },
  maxHttpBufferSize: 1e6,
  connectionStateRecovery: { maxDisconnectionDuration: 120000 },
});

// Run with Redis adapter if REDIS_URL exists, otherwise run standalone in-memory
if (process.env.REDIS_URL) {
  const pub = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
  const sub = pub.duplicate();
  pub.on("error", (err) => console.error("Redis Pub error:", err.message));
  sub.on("error", (err) => console.error("Redis Sub error:", err.message));
  io.adapter(createAdapter(pub, sub));
  console.info("Socket.io: Connected to Redis adapter");
} else {
  console.info("Socket.io: Running in standalone mode without Redis");
}

io.use(async (socket, next) => {
  try {
    const cookie = socket.handshake.headers.cookie
      ?.split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith(`${SESSION_COOKIE}=`));
    const token = cookie?.slice(SESSION_COOKIE.length + 1);
    if (!token) return next(new Error("unauthorized"));
    const secret = process.env.SESSION_SECRET;
    if (!secret || secret.length < 32) return next(new Error("unauthorized"));
    const tokenHash = createHmac("sha256", secret)
      .update(decodeURIComponent(token))
      .digest("hex");
    const session = await db.session.findUnique({
      where: { tokenHash },
      select: { userId: true, expiresAt: true },
    });
    if (!session || session.expiresAt <= new Date())
      return next(new Error("unauthorized"));
    socket.data.userId = session.userId;
    next();
  } catch {
    next(new Error("unauthorized"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.data.userId as string;
  socket.join(`user:${userId}`);
  socket.on(
    "workspace:join",
    async (
      workspaceId: string,
      ack?: (result: { ok: boolean; error?: string }) => void,
    ) => {
      try {
        const member = await db.$transaction(async (tx) => {
          await tx.$executeRaw`SELECT set_config('app.user_id',${userId},true),set_config('app.workspace_id',${workspaceId},true)`;
          return tx.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } },
            select: { status: true },
          });
        });
        if (member?.status !== "ACTIVE") throw new Error();
        socket.join(`workspace:${workspaceId}`);
        ack?.({ ok: true });
      } catch {
        ack?.({ ok: false, error: "forbidden" });
      }
    },
  );
  socket.on(
    "channel:join",
    async (
      input: { workspaceId: string; channelId: string },
      ack?: (result: { ok: boolean; error?: string }) => void,
    ) => {
      try {
        const canJoin = await withTenant(
          input.workspaceId,
          userId,
          async (tx) => {
            const c = await tx.channel.findFirst({
              where: { id: input.channelId, workspaceId: input.workspaceId },
              select: { id: true, isPrivate: true, createdById: true },
            });
            if (!c) return false;
            if (!c.isPrivate || c.createdById === userId) return true;
            const m = await tx.workspaceMember.findUnique({
              where: {
                workspaceId_userId: { workspaceId: input.workspaceId, userId },
              },
              select: { role: true },
            });
            return ["OWNER", "ADMIN"].includes(m?.role ?? "");
          },
        );
        if (!canJoin) throw new Error();
        socket.join(
          `workspace:${input.workspaceId}:channel:${input.channelId}`,
        );
        ack?.({ ok: true });
      } catch {
        ack?.({ ok: false, error: "forbidden" });
      }
    },
  );
  socket.on(
    "channel:leave",
    (input: { workspaceId: string; channelId: string }) =>
      socket.leave(`workspace:${input.workspaceId}:channel:${input.channelId}`),
  );
});

server.listen(port, () =>
  console.info(`SyncHQ Socket.io listening on :${port}`),
);