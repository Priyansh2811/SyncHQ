import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser, createToken, digestToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, json, parseJson } from "@/lib/http";
import { requirePermission, withTenant } from "@/lib/rbac";
import { assertPlanCapacity } from "@/lib/limits";
import { sendMail } from "@/lib/mailer";
const schema = z.object({
  email: z.email().transform((v) => v.toLowerCase()),
  role: z.enum(["ADMIN", "MEMBER", "GUEST"]).default("MEMBER"),
});
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
      permission: "INVITE_MEMBER",
    });
    const invitations = await withTenant(workspaceId, user.id, (tx) =>
      tx.invitation.findMany({
        where: {
          workspaceId,
          acceptedAt: null,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        select: {
          id: true,
          email: true,
          role: true,
          expiresAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    );
    return json({ invitations });
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
    const auth = await requirePermission({
      workspaceId,
      userId: user.id,
      permission: "INVITE_MEMBER",
    });
    const input = schema.parse(await parseJson(req));
    if (auth.role !== "OWNER" && input.role === "ADMIN")
      throw new Error("FORBIDDEN");
    const exists = await db.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });
    if (exists) {
      const member = await withTenant(workspaceId, user.id, (tx) =>
        tx.workspaceMember.findUnique({
          where: { workspaceId_userId: { workspaceId, userId: exists.id } },
        }),
      );
      if (member) throw new Error("CONFLICT");
    }
    const token = createToken();
    const expiresAt = new Date(Date.now() + 7 * 86400000);
    const invitation = await withTenant(
      workspaceId,
      user.id,
      async (tx) => {
        await assertPlanCapacity(tx, workspaceId, "members", input.email);
        const old = await tx.invitation.findUnique({
          where: { workspaceId_email: { workspaceId, email: input.email } },
        });
        if (
          old &&
          !old.revokedAt &&
          !old.acceptedAt &&
          old.expiresAt > new Date()
        )
          throw new Error("CONFLICT");
        const row = old
          ? await tx.invitation.update({
              where: { id: old.id },
              data: {
                role: input.role,
                tokenHash: digestToken(token),
                inviterId: user.id,
                expiresAt,
                revokedAt: null,
                acceptedAt: null,
              },
            })
          : await tx.invitation.create({
              data: {
                workspaceId,
                email: input.email,
                role: input.role,
                tokenHash: digestToken(token),
                inviterId: user.id,
                expiresAt,
              },
            });
        await tx.auditLog.create({
          data: {
            workspaceId,
            actorId: user.id,
            action: "invitation.created",
            targetType: "invitation",
            targetId: row.id,
            metadata: { role: input.role },
          },
        });
        return row;
      },
      "INVITE_MEMBER",
    );
    const workspace = await withTenant(workspaceId, user.id, (tx) =>
      tx.workspace.findUniqueOrThrow({
        where: { id: workspaceId },
        select: { name: true },
      }),
    );
    const link = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/invite/${token}`;
    try {
      await sendMail(
        input.email,
        `Join ${workspace.name} on SyncHQ`,
        `You have been invited to join ${workspace.name}. Accept within 7 days: ${link}`,
      );
    } catch (e) {
      await withTenant(workspaceId, user.id, (tx) =>
        tx.invitation.delete({ where: { id: invitation.id } }),
      );
      throw e;
    }
    return json(
      {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt,
        },
      },
      201,
    );
  } catch (e) {
    return apiError(e);
  }
}
