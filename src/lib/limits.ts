import { Prisma } from "@prisma/client";

export const PLAN_LIMITS = {
  FREE: { members: 10, channels: 5 },
  PRO: { members: 100, channels: 100 },
  BUSINESS: { members: 1000, channels: 1000 },
} as const;
export function planHasCapacity(
  plan: keyof typeof PLAN_LIMITS,
  kind: "members" | "channels",
  current: number,
) {
  return current < PLAN_LIMITS[plan][kind];
}
export async function assertPlanCapacity(
  tx: Prisma.TransactionClient,
  workspaceId: string,
  kind: "members" | "channels",
  excludePendingEmail?: string,
) {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${workspaceId}:${kind}`},0))`;
  const [subscription, activeMembers, pendingInvitations, channels] =
    await Promise.all([
      tx.subscription.findUnique({
        where: { workspaceId },
        select: { plan: true },
      }),
      tx.workspaceMember.count({ where: { workspaceId, status: "ACTIVE" } }),
      kind === "members"
        ? tx.invitation.count({
            where: {
              workspaceId,
              acceptedAt: null,
              revokedAt: null,
              expiresAt: { gt: new Date() },
              ...(excludePendingEmail
                ? { email: { not: excludePendingEmail } }
                : {}),
            },
          })
        : Promise.resolve(0),
      kind === "channels"
        ? tx.channel.count({ where: { workspaceId } })
        : Promise.resolve(0),
    ]);
  const plan = subscription?.plan ?? "FREE";
  const count =
    kind === "members" ? activeMembers + pendingInvitations : channels;
  if (!planHasCapacity(plan, kind, count)) throw new Error("PLAN_LIMIT");
}
