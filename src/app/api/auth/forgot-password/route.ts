import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createToken, digestToken } from "@/lib/auth";
import { apiError, json, parseJson } from "@/lib/http";
import { enforceRateLimit } from "@/lib/limiter";
import { sendMail } from "@/lib/mailer";
import { z } from "zod";
export async function POST(req: NextRequest) {
  try {
    const { email } = z
      .object({ email: z.email().transform((v) => v.toLowerCase()) })
      .parse(await parseJson(req));
    await enforceRateLimit(
      `forgot:${req.headers.get("x-forwarded-for") ?? "unknown"}:${email}`,
      5,
      3600,
    );
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });
    if (user) {
      const token = createToken();
      await db.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: digestToken(token),
          expiresAt: new Date(Date.now() + 3600000),
        },
      });
      const link = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;
      await sendMail(
        email,
        "Reset your SyncHQ password",
        `Use this link within one hour to reset your password: ${link}`,
      );
    }
    return json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
