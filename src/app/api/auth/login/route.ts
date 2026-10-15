import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { apiError, json, parseJson } from "@/lib/http";
import { enforceRateLimit } from "@/lib/limiter";
import { listMyWorkspaces } from "@/lib/workspaces";
import { withTenant } from "@/lib/rbac";
import { loginSchema } from "@/lib/validation";
export async function POST(req: NextRequest) {
  try {
    const input = loginSchema.parse(await parseJson(req));
    await enforceRateLimit(
      `login:${req.headers.get("x-forwarded-for") ?? "unknown"}:${input.email}`,
      10,
      900,
    );
    const user = await db.user.findUnique({ where: { email: input.email } });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash)))
      return json({ error: "Email or password is incorrect" }, 401);
    await createSession(user.id);
    for (const ws of await listMyWorkspaces(user.id))
      await withTenant(ws.id, user.id, (tx) =>
        tx.auditLog.create({
          data: {
            workspaceId: ws.id,
            actorId: user.id,
            action: "auth.login",
            targetType: "user",
            targetId: user.id,
          },
        }),
      );
    return json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (e) {
    return apiError(e);
  }
}
