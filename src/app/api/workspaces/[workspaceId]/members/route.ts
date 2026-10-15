import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { apiError, json } from "@/lib/http";
import { requirePermission, withTenant } from "@/lib/rbac";
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return json({ error: "UNAUTHENTICATED" }, 401);
    const { workspaceId } = await params;
    await requirePermission({
      workspaceId,
      userId: user.id,
      permission: "VIEW_WORKSPACE",
    });
    const members = await withTenant(workspaceId, user.id, (tx) =>
      tx.workspaceMember.findMany({
        where: { workspaceId },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      }),
    );
    return json({
      members: members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl,
        role: m.role,
        status: m.status,
        joinedAt: m.joinedAt,
      })),
    });
  } catch (e) {
    return apiError(e);
  }
}
