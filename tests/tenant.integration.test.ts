import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { db } from "../src/lib/db";
import { withTenant, requirePermission } from "../src/lib/rbac";

const suite = process.env.TEST_DATABASE_URL ? describe : describe.skip;
suite("PostgreSQL tenant isolation", () => {
  const uidA = randomUUID(),
    uidB = randomUUID(),
    widA = randomUUID(),
    widB = randomUUID();
  async function makeWorkspace(
    userId: string,
    workspaceId: string,
    email: string,
  ) {
    await db.user.create({
      data: {
        id: userId,
        email,
        name: `Tenant ${email}`,
        passwordHash: "test-only-not-a-real-login",
      },
    });
    await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.user_id',${userId},true),set_config('app.workspace_id',${workspaceId},true)`;
      await tx.workspace.create({
        data: {
          id: workspaceId,
          name: `Workspace ${email}`,
          slug: `test-${workspaceId.slice(0, 8)}`,
          ownerId: userId,
          members: { create: { userId, role: "OWNER" } },
          channels: {
            create: { name: "general", slug: "general", createdById: userId },
          },
          subscription: { create: { plan: "FREE", status: "ACTIVE" } },
        },
      });
    });
  }
  beforeAll(async () => {
    await makeWorkspace(uidA, widA, `${uidA}@integration.invalid`);
    await makeWorkspace(uidB, widB, `${uidB}@integration.invalid`);
  });
  afterAll(async () => {
    await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.system','true',true)`;
      await tx.workspace.deleteMany({ where: { id: { in: [widA, widB] } } });
      await tx.user.deleteMany({ where: { id: { in: [uidA, uidB] } } });
    });
    await db.$disconnect();
  });
  it("does not return another workspace when an authorized user supplies its id", async () => {
    const result = await withTenant(widA, uidA, (tx) =>
      tx.workspace.findMany({ where: { id: widB } }),
    );
    expect(result).toHaveLength(0);
  });
  it("does not update another tenant's workspace", async () => {
    const result = await withTenant(widA, uidA, (tx) =>
      tx.workspace.updateMany({
        where: { id: widB },
        data: { name: "Unauthorized" },
      }),
    );
    expect(result.count).toBe(0);
  });
  it("rejects permission checks for a workspace without active membership", async () => {
    await expect(
      requirePermission({
        workspaceId: widB,
        userId: uidA,
        permission: "MANAGE_BILLING",
      }),
    ).rejects.toThrow("FORBIDDEN");
  });
});
