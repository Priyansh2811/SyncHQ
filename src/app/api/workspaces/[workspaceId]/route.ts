import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { apiError, json, parseJson } from "@/lib/http";
import { requirePermission, withTenant } from "@/lib/rbac";
import { slugify } from "@/lib/slug";
import { emitToRoom } from "@/lib/socket-emitter";
const schema = z.object({ name: z.string().trim().min(2).max(80) });
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return json({ error: "UNAUTHENTICATED" }, 401);
    const { workspaceId } = await params;
    const { name } = schema.parse(await parseJson(req));
    await requirePermission({
      workspaceId,
      userId: user.id,
      permission: "MANAGE_WORKSPACE",
    });
    const slug = `${slugify(name).slice(0, 42)}-${workspaceId.slice(0, 6)}`;
    const workspace = await withTenant(
      workspaceId,
      user.id,
      async (tx) => {
        const row = await tx.workspace.update({
          where: { id: workspaceId },
          data: { name, slug },
          select: { id: true, name: true, slug: true },
        });
        await tx.auditLog.create({
          data: {
            workspaceId,
            actorId: user.id,
            action: "workspace.updated",
            targetType: "workspace",
            targetId: workspaceId,
          },
        });
        return row;
      },
      "MANAGE_WORKSPACE",
    );
    await emitToRoom(
      `workspace:${workspaceId}`,
      "workspace:updated",
      workspace,
    );
    return json({ workspace });
  } catch (e) {
    return apiError(e);
  }
}
