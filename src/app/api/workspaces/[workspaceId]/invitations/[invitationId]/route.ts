import { getCurrentUser } from "@/lib/auth";
import { apiError, json } from "@/lib/http";
import { requirePermission, withTenant } from "@/lib/rbac";
export async function DELETE(
  _req: Request,
  {
    params,
  }: { params: Promise<{ workspaceId: string; invitationId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return json({ error: "UNAUTHENTICATED" }, 401);
    const { workspaceId, invitationId } = await params;
    await requirePermission({
      workspaceId,
      userId: user.id,
      permission: "INVITE_MEMBER",
    });
    await withTenant(
      workspaceId,
      user.id,
      async (tx) => {
        const row = await tx.invitation.findFirst({
          where: { id: invitationId, workspaceId, acceptedAt: null },
        });
        if (!row) throw new Error("NOT_FOUND");
        await tx.invitation.update({
          where: { id: row.id },
          data: { revokedAt: new Date() },
        });
        await tx.auditLog.create({
          data: {
            workspaceId,
            actorId: user.id,
            action: "invitation.revoked",
            targetType: "invitation",
            targetId: row.id,
          },
        });
      },
      "INVITE_MEMBER",
    );
    return json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
