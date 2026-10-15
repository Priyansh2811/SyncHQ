import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, json, parseJson } from "@/lib/http";
import { uniqueWorkspaceSlug } from "@/lib/slug";
import { randomUUID } from "node:crypto";
const schema = z.object({ name: z.string().trim().min(2).max(80) });
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return json({ error: "UNAUTHENTICATED" }, 401);
  const workspaces = await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.user_id', ${user.id}, true)`;
    return tx.$queryRaw<
      Array<{ id: string; name: string; slug: string; role: string }>
    >`SELECT * FROM list_my_workspaces()`;
  });
  return json({ workspaces });
}
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return json({ error: "UNAUTHENTICATED" }, 401);
    const { name } = schema.parse(await parseJson(req));
    const slug = await uniqueWorkspaceSlug(name);
    const workspaceId = randomUUID();
    const workspace = await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.user_id', ${user.id}, true), set_config('app.workspace_id', ${workspaceId}, true)`;
      const created = await tx.workspace.create({
        data: {
          id: workspaceId,
          name,
          slug,
          ownerId: user.id,
          members: { create: { userId: user.id, role: "OWNER" } },
          channels: {
            create: [
              { name: "general", slug: "general", createdById: user.id },
            ],
          },
          subscription: { create: { plan: "FREE", status: "ACTIVE" } },
        },
      });
      await tx.auditLog.create({
        data: {
          workspaceId: created.id,
          actorId: user.id,
          action: "workspace.created",
          targetType: "workspace",
          targetId: created.id,
        },
      });
      return created;
    });
    return json(
      {
        workspace: {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
        },
      },
      201,
    );
  } catch (e) {
    return apiError(e);
  }
}
