import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { apiError, json, parseJson } from "@/lib/http";
import { requirePermission, withTenant } from "@/lib/rbac";
import { assertPlanCapacity } from "@/lib/limits";
import { slugify } from "@/lib/slug";
import { emitToRoom } from "@/lib/socket-emitter";
const schema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().max(500).optional(),
  isPrivate: z.boolean().default(false),
});
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return json({ error: "UNAUTHENTICATED" }, 401);
    const { workspaceId } = await params;
    const membership = await requirePermission({
      workspaceId,
      userId: user.id,
      permission: "VIEW_WORKSPACE",
    });
    const channels = await withTenant(workspaceId, user.id, (tx) =>
      tx.channel.findMany({
        where: {
          workspaceId,
          OR: [
            { isPrivate: false },
            { createdById: user.id },
            ...(["OWNER", "ADMIN"].includes(membership.role)
              ? [{ isPrivate: true }]
              : []),
          ],
        },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          isPrivate: true,
        },
      }),
    );
    return json({ channels });
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return json({ error: "UNAUTHENTICATED" }, 401);
    const { workspaceId } = await params;
    await requirePermission({
      workspaceId,
      userId: user.id,
      permission: "CREATE_CHANNEL",
    });
    const input = schema.parse(await parseJson(req));
    const base = slugify(input.name);
    const channel = await withTenant(
      workspaceId,
      user.id,
      async (tx) => {
        await assertPlanCapacity(tx, workspaceId, "channels");
        let candidate = base;
        let n = 2;
        while (
          await tx.channel.findUnique({
            where: { workspaceId_slug: { workspaceId, slug: candidate } },
          })
        )
          candidate = `${base}-${n++}`;
        const row = await tx.channel.create({
          data: {
            workspaceId,
            name: input.name,
            slug: candidate,
            description: input.description,
            isPrivate: input.isPrivate,
            createdById: user.id,
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
            workspaceId,
            actorId: user.id,
            action: "channel.created",
            targetType: "channel",
            targetId: row.id,
            metadata: { private: row.isPrivate },
          },
        });
        return row;
      },
      "CREATE_CHANNEL",
    );
    await emitToRoom(`workspace:${workspaceId}`, "channel:created", channel);
    return json({ channel }, 201);
  } catch (e) {
    return apiError(e);
  }
}
