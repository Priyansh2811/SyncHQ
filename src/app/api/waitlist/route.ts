import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiError, json, parseJson } from "@/lib/http";
import { enforceRateLimit } from "@/lib/limiter";
export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(
      `waitlist:${req.headers.get("x-forwarded-for") ?? "unknown"}`,
      5,
      3600,
    );
    const { email } = z
      .object({ email: z.email().transform((v) => v.toLowerCase()) })
      .parse(await parseJson(req));
    await db.waitlistEntry.upsert({
      where: { email },
      create: { email },
      update: {},
    });
    return json({ ok: true }, 201);
  } catch (e) {
    return apiError(e);
  }
}
