import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, json, parseJson } from "@/lib/http";
import { Prisma } from "@prisma/client";
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return json({ error: "UNAUTHENTICATED" }, 401);
    const data = z
      .object({
        name: z.string().trim().min(1).max(100),
        preferences: z.record(z.string(), z.unknown()).optional(),
      })
      .parse(await parseJson(req));
    const preferences = data.preferences as Prisma.InputJsonValue | undefined;
    const updated = await db.user.update({
      where: { id: user.id },
      data: { name: data.name, ...(preferences ? { preferences } : {}) },
      select: { id: true, name: true, email: true, preferences: true },
    });
    return json({ user: updated });
  } catch (e) {
    return apiError(e);
  }
}
export async function GET() {
  const user = await getCurrentUser();
  return user
    ? json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          preferences: user.preferences,
        },
      })
    : json({ error: "UNAUTHENTICATED" }, 401);
}
