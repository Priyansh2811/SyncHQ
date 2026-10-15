import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { apiError, json, parseJson } from "@/lib/http";
import { requirePermission, withTenant } from "@/lib/rbac";
import { emitToRoom } from "@/lib/socket-emitter";
const schema = z.object({ workspaceId: z.uuid() });
const createSchema = schema.extend({
  content: z.string().trim().min(1).max(10000),
  clientId: z.string().max(80).optional(),
});
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return json({ error: "UNAUTHENTICATED" }, 401);
    const { channelId } = await params;
    const { workspaceId } = schema.parse({
      workspaceId: req.nextUrl.searchParams.get("workspaceId"),
    });
    await requirePermission({
      workspaceId,
      userId: user.id,
      permission: "VIEW_WORKSPACE",
    });
    const before = req.nextUrl.searchParams.get("before");
    const rows = await withTenant(workspaceId, user.id, async (tx) => {
      const channel = await tx.channel.findFirst({
        where: { id: channelId, workspaceId },
        select: { id: true, isPrivate: true, createdById: true },
      });
      if (!channel) throw new Error("NOT_FOUND");
      const membership = await tx.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: user.id } },
        select: { role: true },
      });
      if (
        channel.isPrivate &&
        channel.createdById !== user.id &&
        !["OWNER", "ADMIN"].includes(membership?.role ?? "")
      )
        throw new Error("FORBIDDEN");
      return tx.message.findMany({
        where: { channelId, workspaceId },
        ...(before ? { cursor: { id: before }, skip: 1 } : {}),
        take: 50,
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
        },
      });
    });
    return json({ messages: rows.reverse() });
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return json({ error: "UNAUTHENTICATED" }, 401);
    const { channelId } = await params;
    const input = createSchema.parse(await parseJson(req));
    await requirePermission({
      workspaceId: input.workspaceId,
      userId: user.id,
      permission: "SEND_MESSAGE",
    });
    const message = await withTenant(
      input.workspaceId,
      user.id,
      async (tx) => {
        const ch = await tx.channel.findFirst({
          where: { id: channelId, workspaceId: input.workspaceId },
          select: { id: true, isPrivate: true, createdById: true },
        });
        if (!ch) throw new Error("NOT_FOUND");
        const member = await tx.workspaceMember.findUnique({
          where: {
            workspaceId_userId: {
              workspaceId: input.workspaceId,
              userId: user.id,
            },
          },
          select: { role: true },
        });
        if (
          ch.isPrivate &&
          ch.createdById !== user.id &&
          !["OWNER", "ADMIN"].includes(member?.role ?? "")
        )
          throw new Error("FORBIDDEN");
        if (input.clientId) {
          const existing = await tx.message.findFirst({
            where: { channelId, authorId: user.id, clientId: input.clientId },
            include: {
              author: { select: { id: true, name: true, avatarUrl: true } },
            },
          });
          if (existing) return existing;
        }
        const row = await tx.message.create({
          data: {
            workspaceId: input.workspaceId,
            channelId,
            authorId: user.id,
            clientId: input.clientId,
            content: input.content,
          },
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
          },
        });
        await tx.auditLog.create({
          data: {
            workspaceId: input.workspaceId,
            actorId: user.id,
            action: "message.sent",
            targetType: "message",
            targetId: row.id,
          },
        });
        return row;
      },
      "SEND_MESSAGE",
    );
    await emitToRoom(
      `workspace:${input.workspaceId}:channel:${channelId}`,
      "message:created",
      message,
    );
    return json({ message }, 201);
  } catch (e) {
    return apiError(e);
  }
}
