import { destroySession, getCurrentUser } from "@/lib/auth";
import { json } from "@/lib/http";
import { listMyWorkspaces } from "@/lib/workspaces";
import { withTenant } from "@/lib/rbac";
import { emitToRoom } from "@/lib/socket-emitter";
export async function POST() {
  const user = await getCurrentUser();
  if (user) {
    for (const ws of await listMyWorkspaces(user.id))
      await withTenant(ws.id, user.id, (tx) =>
        tx.auditLog.create({
          data: {
            workspaceId: ws.id,
            actorId: user.id,
            action: "auth.logout",
            targetType: "user",
            targetId: user.id,
          },
        }),
      );
    await emitToRoom(`user:${user.id}`, "session:ended", {});
  }
  await destroySession();
  return json({ ok: true });
}
