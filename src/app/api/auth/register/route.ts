import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { apiError, json, parseJson } from "@/lib/http";
import { enforceRateLimit } from "@/lib/limiter";
import { registerSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const input = registerSchema.parse(await parseJson(req));
    await enforceRateLimit(
      `register:${req.headers.get("x-forwarded-for") ?? "unknown"}`,
      6,
      3600,
    );
    const exists = await db.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });
    if (exists)
      return json({ error: "An account with this email already exists" }, 409);
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await db.user.create({
      data: { name: input.name, email: input.email, passwordHash },
    });
    await createSession(user.id);
    return json(
      { user: { id: user.id, name: user.name, email: user.email } },
      201,
    );
  } catch (e) {
    return apiError(e);
  }
}
