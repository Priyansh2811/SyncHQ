import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser, digestToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, json, parseJson } from "@/lib/http";
import { emitToRoom } from "@/lib/socket-emitter";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return json({ error: "UNAUTHENTICATED" }, 401);
    const { token } = z
      .object({ token: z.string().min(32).max(256) })
      .parse(await parseJson(req));
    const invite = await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.user_id',${user.id},true)`;
      const result = await tx.$queryRaw<
        Array<{
          workspace_id: string;
          slug: string;
          name: string;
          role: string;
        }>
      >`SELECT * FROM accept_workspace_invitation(${digestToken(token)},${user.id})`;
      if (!result.length) throw new Error("NOT_FOUND");
      return result[0];
    });
    if (invite.role === "PLAN_LIMIT") throw new Error("PLAN_LIMIT");
    await emitToRoom(`workspace:${invite.workspace_id}`, "member:joined", {
      userId: user.id,
      role: invite.role,
    });
    return json({
      workspace: {
        id: invite.workspace_id,
        slug: invite.slug,
        name: invite.name,
      },
      role: invite.role,
    });
  } catch (e) {
    return apiError(e);
  }
}
