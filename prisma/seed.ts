import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

async function main() {
  if (process.env.NODE_ENV === "production")
    throw new Error("The development seed is disabled in production.");
  const { db } = await import("../src/lib/db");
  const email = "dev@synchq.local",
    password =
      process.env.DEVELOPMENT_SEED_PASSWORD ?? "dev-only-change-me-123";
  if (password.length < 10)
    throw new Error(
      "DEVELOPMENT_SEED_PASSWORD must contain at least 10 characters.",
    );
  const user = await db.user.upsert({
    where: { email },
    create: {
      email,
      name: "Dev Teammate",
      passwordHash: await bcrypt.hash(password, 12),
    },
    update: { name: "Dev Teammate" },
  });
  await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.system','true',true)`;
    const existing = await tx.workspace.findUnique({
      where: { slug: "studio-demo" },
    });
    if (existing) {
      console.info(
        "Development workspace already exists; no conversation data was added.",
      );
      return;
    }
    const workspaceId = randomUUID();
    await tx.workspace.create({
      data: {
        id: workspaceId,
        name: "Studio Demo",
        slug: "studio-demo",
        ownerId: user.id,
        members: { create: { userId: user.id, role: "OWNER" } },
        channels: {
          create: [
            {
              name: "general",
              slug: "general",
              description: "The place to start.",
              createdById: user.id,
            },
            {
              name: "planning",
              slug: "planning",
              description: "Plans, priorities and next steps.",
              createdById: user.id,
            },
          ],
        },
        subscription: { create: { plan: "FREE", status: "ACTIVE" } },
        auditLogs: {
          create: {
            actorId: user.id,
            action: "workspace.created",
            targetType: "workspace",
          },
        },
      },
    });
  });
  console.info(
    `Seed ready. Sign in as ${email} with the value of DEVELOPMENT_SEED_PASSWORD.`,
  );
  await db.$disconnect();
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
