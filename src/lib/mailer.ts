import nodemailer from "nodemailer";
export async function sendMail(to: string, subject: string, text: string) {
  const host = process.env.EMAIL_SERVER_HOST;
  if (!host) {
    if (process.env.NODE_ENV === "production")
      throw new Error("EMAIL_NOT_CONFIGURED");
    console.info(`[development email] to=${to} subject=${subject}\n${text}`);
    return;
  }
  const transport = nodemailer.createTransport({
    host,
    port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
    secure: Number(process.env.EMAIL_SERVER_PORT ?? 587) === 465,
    auth: process.env.EMAIL_SERVER_USER
      ? {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        }
      : undefined,
  });
  await transport.sendMail({
    from: process.env.EMAIL_FROM ?? "SyncHQ <hello@synchq.app>",
    to,
    subject,
    text,
  });
}
