import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { digestToken } from "@/lib/auth";
import { apiError, json, parseJson } from "@/lib/http";
export async function POST(req: NextRequest) {
  try {
    const { token, password } = z
      .object({
        token: z.string().min(32).max(256),
        password: z.string().min(10).max(72),
      })
      .parse(await parseJson(req));
    const tokenHash = digestToken(token);
    const reset = await db.passwordResetToken.findUnique({
      where: { tokenHash },
    });
    if (!reset || reset.usedAt || reset.expiresAt < new Date())
      throw new Error("NOT_FOUND");
    const passwordHash = await bcrypt.hash(password, 12);
    await db.$transaction([
      db.user.update({ where: { id: reset.userId }, data: { passwordHash } }),
      db.passwordResetToken.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      }),
      db.session.deleteMany({ where: { userId: reset.userId } }),
    ]);
    return json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
