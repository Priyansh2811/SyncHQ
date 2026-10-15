import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const permissions = [
  "VIEW_WORKSPACE",
  "SEND_MESSAGE",
  "EDIT_OWN_MESSAGE",
  "DELETE_OWN_MESSAGE",
  "DELETE_ANY_MESSAGE",
  "CREATE_CHANNEL",
  "UPDATE_CHANNEL",
  "DELETE_CHANNEL",
  "INVITE_MEMBER",
  "REMOVE_MEMBER",
  "CHANGE_MEMBER_ROLE",
  "MANAGE_WORKSPACE",
  "MANAGE_BILLING",
] as const;
export type Permission = (typeof permissions)[number];
const rolePermissions: Record<string, Permission[]> = {
  OWNER: [...permissions],
  ADMIN: [
    "VIEW_WORKSPACE",
    "SEND_MESSAGE",
    "EDIT_OWN_MESSAGE",
    "DELETE_OWN_MESSAGE",
    "DELETE_ANY_MESSAGE",
    "CREATE_CHANNEL",
    "UPDATE_CHANNEL",
    "DELETE_CHANNEL",
    "INVITE_MEMBER",
    "REMOVE_MEMBER",
    "CHANGE_MEMBER_ROLE",
    "MANAGE_WORKSPACE",
  ],
  MEMBER: [
    "VIEW_WORKSPACE",
    "SEND_MESSAGE",
    "EDIT_OWN_MESSAGE",
    "DELETE_OWN_MESSAGE",
  ],
  GUEST: ["VIEW_WORKSPACE"],
};
export function roleHasPermission(role: string, permission: Permission) {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export async function requirePermission(input: {
  workspaceId: string;
  userId?: string;
  permission: Permission;
}) {
  const user = input.userId ? { id: input.userId } : await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const member = await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.user_id', ${user.id}, true), set_config('app.workspace_id', ${input.workspaceId}, true)`;
    return tx.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId: input.workspaceId, userId: user.id },
      },
    });
  });
  if (
    !member ||
    member.status !== "ACTIVE" ||
    !roleHasPermission(member.role, input.permission)
  )
    throw new Error("FORBIDDEN");
  return { userId: user.id, role: member.role };
}

export async function withTenant<T>(
  workspaceId: string,
  userId: string,
  fn: (tx: typeof db) => Promise<T>,
  permission: Permission = "VIEW_WORKSPACE",
): Promise<T> {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.user_id', ${userId}, true), set_config('app.workspace_id', ${workspaceId}, true)`;
    const member = await tx.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (
      !member ||
      member.status !== "ACTIVE" ||
      !roleHasPermission(member.role, permission)
    )
      throw new Error("FORBIDDEN");
    return fn(tx as unknown as typeof db);
  });
}

export function isOwnerRole(role: string) {
  return role === "OWNER";
}
