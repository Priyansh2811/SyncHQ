import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { apiError, json, parseJson } from "@/lib/http";
import { requirePermission, withTenant } from "@/lib/rbac";
import { emitToRoom } from "@/lib/socket-emitter";
const roles = z.enum(["ADMIN", "MEMBER", "GUEST"]);
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; userId: string }> },
) {
  try {
    const actor = await getCurrentUser();
    if (!actor) return json({ error: "UNAUTHENTICATED" }, 401);
    const { workspaceId, userId } = await params;
    const { role } = z.object({ role: roles }).parse(await parseJson(req));
    const auth = await requirePermission({
      workspaceId,
      userId: actor.id,
      permission: "CHANGE_MEMBER_ROLE",
    });
    if (auth.role !== "OWNER" && role === "ADMIN") throw new Error("FORBIDDEN");
    const changed = await withTenant(
      workspaceId,
      actor.id,
      async (tx) => {
        const target = await tx.workspaceMember.findUnique({
          where: { workspaceId_userId: { workspaceId, userId } },
        });
        if (!target || target.role === "OWNER") throw new Error("FORBIDDEN");
        const row = await tx.workspaceMember.update({
          where: { workspaceId_userId: { workspaceId, userId } },
          data: { role },
        });
        await tx.auditLog.create({
          data: {
            workspaceId,
            actorId: actor.id,
            action: "member.role_changed",
            targetType: "member",
            targetId: userId,
            metadata: { role },
          },
        });
        return row;
      },
      "CHANGE_MEMBER_ROLE",
    );
    await emitToRoom(`workspace:${workspaceId}`, "member:updated", {
      userId,
      role: changed.role,
    });
    return json({ member: { id: changed.userId, role: changed.role } });
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; userId: string }> },
) {
  try {
    const actor = await getCurrentUser();
    if (!actor) return json({ error: "UNAUTHENTICATED" }, 401);
    const { workspaceId, userId } = await params;
    if (actor.id === userId) throw new Error("FORBIDDEN");
    await requirePermission({
      workspaceId,
      userId: actor.id,
      permission: "REMOVE_MEMBER",
    });
    await withTenant(
      workspaceId,
      actor.id,
      async (tx) => {
        const target = await tx.workspaceMember.findUnique({
          where: { workspaceId_userId: { workspaceId, userId } },
        });
        if (!target || target.role === "OWNER") throw new Error("FORBIDDEN");
        await tx.workspaceMember.delete({
          where: { workspaceId_userId: { workspaceId, userId } },
        });
        await tx.auditLog.create({
          data: {
            workspaceId,
            actorId: actor.id,
            action: "member.removed",
            targetType: "member",
            targetId: userId,
          },
        });
      },
      "REMOVE_MEMBER",
    );
    await emitToRoom(`workspace:${workspaceId}`, "member:left", { userId });
    await emitToRoom(`user:${userId}`, "membership:revoked", {
      workspaceId,
      userId,
    });
    return json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
