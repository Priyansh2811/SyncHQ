import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { apiError, json, parseJson } from "@/lib/http";
import { requirePermission, withTenant } from "@/lib/rbac";
import { emitToRoom } from "@/lib/socket-emitter";
const schema = z.object({
  workspaceId: z.uuid(),
  content: z.string().trim().min(1).max(10000).optional(),
});
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return json({ error: "UNAUTHENTICATED" }, 401);
    const { messageId } = await params;
    const data = schema.parse(await parseJson(req));
    if (!data.content) return json({ error: "Invalid content" }, 400);
    await requirePermission({
      workspaceId: data.workspaceId,
      userId: user.id,
      permission: "EDIT_OWN_MESSAGE",
    });
    const updated = await withTenant(
      data.workspaceId,
      user.id,
      async (tx) => {
        const m = await tx.message.findFirst({
          where: { id: messageId, workspaceId: data.workspaceId },
        });
        if (!m) throw new Error("NOT_FOUND");
        if (m.authorId !== user.id) throw new Error("FORBIDDEN");
        return tx.message.update({
          where: { id: messageId },
          data: { content: data.content, editedAt: new Date() },
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
          },
        });
      },
      "EDIT_OWN_MESSAGE",
    );
    await emitToRoom(
      `workspace:${data.workspaceId}:channel:${updated.channelId}`,
      "message:updated",
      updated,
    );
    return json({ message: updated });
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return json({ error: "UNAUTHENTICATED" }, 401);
    const { messageId } = await params;
    const { workspaceId } = schema.parse({
      workspaceId: req.nextUrl.searchParams.get("workspaceId"),
    });
    const m = await withTenant(workspaceId, user.id, (tx) =>
      tx.message.findFirst({
        where: { id: messageId, workspaceId },
        select: { id: true, authorId: true, channelId: true },
      }),
    );
    if (!m) throw new Error("NOT_FOUND");
    const permission =
      m.authorId === user.id ? "DELETE_OWN_MESSAGE" : "DELETE_ANY_MESSAGE";
    await requirePermission({ workspaceId, userId: user.id, permission });
    await withTenant(
      workspaceId,
      user.id,
      async (tx) => {
        await tx.message.update({
          where: { id: messageId },
          data: { deletedAt: new Date(), content: "[deleted]" },
        });
        await tx.auditLog.create({
          data: {
            workspaceId,
            actorId: user.id,
            action: "message.deleted",
            targetType: "message",
            targetId: messageId,
          },
        });
      },
      permission,
    );
    await emitToRoom(
      `workspace:${workspaceId}:channel:${m.channelId}`,
      "message:deleted",
      { id: messageId, channelId: m.channelId },
    );
    return json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
