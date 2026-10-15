import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiError, json, parseJson } from "@/lib/http";
import { enforceRateLimit } from "@/lib/limiter";
import { sendMail } from "@/lib/mailer";
const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email(),
  subject: z.string().trim().min(2).max(160),
  message: z.string().trim().min(10).max(10000),
});
export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(
      `contact:${req.headers.get("x-forwarded-for") ?? "unknown"}`,
      5,
      3600,
    );
    const data = schema.parse(await parseJson(req));
    await db.contactSubmission.create({ data });
    if (process.env.CONTACT_NOTIFY_EMAIL)
      await sendMail(
        process.env.CONTACT_NOTIFY_EMAIL,
        `SyncHQ contact: ${data.subject}`,
        `From: ${data.name} <${data.email}>\n\n${data.message}`,
      );
    return json({ ok: true }, 201);
  } catch (e) {
    return apiError(e);
  }
}
