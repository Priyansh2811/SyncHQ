import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { apiError, json, parseJson } from "@/lib/http";
import { requirePermission, withTenant } from "@/lib/rbac";
import { slugify } from "@/lib/slug";
import { emitToRoom } from "@/lib/socket-emitter";
const patchSchema = z.object({
  workspaceId: z.uuid(),
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().max(500).nullable().optional(),
});
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return json({ error: "UNAUTHENTICATED" }, 401);
    const { channelId } = await params;
    const data = patchSchema.parse(await parseJson(req));
    await requirePermission({
      workspaceId: data.workspaceId,
      userId: user.id,
      permission: "UPDATE_CHANNEL",
    });
    const result = await withTenant(
      data.workspaceId,
      user.id,
      async (tx) => {
        const channel = await tx.channel.findFirst({
          where: { id: channelId, workspaceId: data.workspaceId },
        });
        if (!channel) throw new Error("NOT_FOUND");
        let slug = channel.slug;
        if (data.name) {
          const root = slugify(data.name);
          slug = root;
          let n = 2;
          while (
            await tx.channel.findFirst({
              where: {
                workspaceId: data.workspaceId,
                slug,
                id: { not: channelId },
              },
            })
          )
            slug = `${root}-${n++}`;
        }
        const row = await tx.channel.update({
          where: { id: channelId },
          data: {
            ...(data.name ? { name: data.name, slug } : {}),
            ...(data.description !== undefined
              ? { description: data.description }
              : {}),
          },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            isPrivate: true,
          },
        });
        await tx.auditLog.create({
          data: {
            workspaceId: data.workspaceId,
            actorId: user.id,
            action: "channel.updated",
            targetType: "channel",
            targetId: row.id,
          },
        });
        return row;
      },
      "UPDATE_CHANNEL",
    );
    await emitToRoom(
      `workspace:${data.workspaceId}`,
      "channel:updated",
      result,
    );
    return json({ channel: result });
  } catch (e) {
    return apiError(e);
  }
}
const deleteSchema = z.object({ workspaceId: z.uuid() });
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return json({ error: "UNAUTHENTICATED" }, 401);
    const { channelId } = await params;
    const data = deleteSchema.parse({
      workspaceId: req.nextUrl.searchParams.get("workspaceId"),
    });
    await requirePermission({
      workspaceId: data.workspaceId,
      userId: user.id,
      permission: "DELETE_CHANNEL",
    });
    await withTenant(
      data.workspaceId,
      user.id,
      async (tx) => {
        const exists = await tx.channel.findFirst({
          where: { id: channelId, workspaceId: data.workspaceId },
        });
        if (!exists) throw new Error("NOT_FOUND");
        await tx.auditLog.create({
          data: {
            workspaceId: data.workspaceId,
            actorId: user.id,
            action: "channel.deleted",
            targetType: "channel",
            targetId: channelId,
          },
        });
        await tx.channel.delete({ where: { id: channelId } });
      },
      "DELETE_CHANNEL",
    );
    await emitToRoom(`workspace:${data.workspaceId}`, "channel:deleted", {
      id: channelId,
    });
    return json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
