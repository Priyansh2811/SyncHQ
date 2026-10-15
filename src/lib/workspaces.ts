import { db } from "@/lib/db";
export async function listMyWorkspaces(userId: string) {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.user_id',${userId},true)`;
    return tx.$queryRaw<
      Array<{ id: string; name: string; slug: string; role: string }>
    >`SELECT * FROM list_my_workspaces()`;
  });
}
