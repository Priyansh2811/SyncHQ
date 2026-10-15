import { createHmac, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export const SESSION_COOKIE = "synchq_session";
const SESSION_DAYS = 30;
const hash = (value: string) => {
  const secret =
    process.env.SESSION_SECRET ??
    (process.env.NODE_ENV === "production"
      ? ""
      : "local-development-session-secret-do-not-deploy");
  if (secret.length < 32)
    throw new Error("SESSION_SECRET must be at least 32 characters");
  return createHmac("sha256", secret).update(value).digest("hex");
};

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await db.session.create({
    data: { userId, tokenHash: hash(token), expiresAt },
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hash(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt <= new Date()) {
    if (session) await db.session.delete({ where: { id: session.id } });
    return null;
  }
  return session.user;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hash(token) } });
  jar.delete(SESSION_COOKIE);
}

export function digestToken(token: string) {
  return hash(token);
}
export function createToken() {
  return randomBytes(32).toString("base64url");
}
