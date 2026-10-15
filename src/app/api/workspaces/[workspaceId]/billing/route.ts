import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { apiError, json } from "@/lib/http";
import { requirePermission, withTenant } from "@/lib/rbac";
import { PLAN_LIMITS } from "@/lib/limits";
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
    const [sub, members, channels] = await withTenant(
      workspaceId,
      user.id,
      (tx) =>
        Promise.all([
          tx.subscription.findUnique({ where: { workspaceId } }),
          tx.workspaceMember.count({
            where: { workspaceId, status: "ACTIVE" },
          }),
          tx.channel.count({ where: { workspaceId } }),
        ]),
    );
    const plan = sub?.plan ?? "FREE";
    return json({
      subscription: sub
        ? {
            plan: sub.plan,
            status: sub.status,
            currentPeriodEnd: sub.currentPeriodEnd,
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
            hasCustomer: !!sub.stripeCustomerId,
          }
        : null,
      limits: PLAN_LIMITS[plan],
      usage: { members, channels },
    });
  } catch (e) {
    return apiError(e);
  }
}
