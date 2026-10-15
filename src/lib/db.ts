import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const connectionString = process.env.DATABASE_URL;
if (!connectionString && process.env.NODE_ENV === "production")
  throw new Error("DATABASE_URL is required");
const adapter = new PrismaPg({
  connectionString:
    connectionString ?? "postgresql://postgres:postgres@localhost:5432/synchq",
});
export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
