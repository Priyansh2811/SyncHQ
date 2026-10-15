import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, json, parseJson } from "@/lib/http";
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return json({ error: "UNAUTHENTICATED" }, 401);
    const { currentPassword, newPassword } = z
      .object({
        currentPassword: z.string().min(1).max(72),
        newPassword: z.string().min(10).max(72),
      })
      .parse(await parseJson(req));
    if (!(await bcrypt.compare(currentPassword, user.passwordHash)))
      return json({ error: "Current password is incorrect" }, 403);
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.$transaction([
      db.user.update({ where: { id: user.id }, data: { passwordHash } }),
      db.session.deleteMany({ where: { userId: user.id } }),
    ]);
    return json({ ok: true, reauthenticate: true });
  } catch (e) {
    return apiError(e);
  }
}
