import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listMyWorkspaces } from "@/lib/workspaces";
import { withTenant } from "@/lib/rbac";
import { WorkspaceShell } from "@/components/workspace-shell";
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: { template: "%s · SyncHQ", default: "Workspace · SyncHQ" },
  description: "Private SyncHQ workspace.",
};
export default async function WorkspaceLayout({
  params,
  children,
}: {
  params: Promise<{ workspaceSlug: string }>;
  children: React.ReactNode;
}) {
  const { workspaceSlug } = await params;
  const user = await getCurrentUser();
  if (!user)
    redirect(`/login?next=${encodeURIComponent(`/w/${workspaceSlug}`)}`);
  const workspaces = await listMyWorkspaces(user.id);
  const current = workspaces.find((w) => w.slug === workspaceSlug);
  if (!current) notFound();
  const channels = await withTenant(current.id, user.id, (tx) =>
    tx.channel.findMany({
      where: {
        workspaceId: current.id,
        OR: [
          { isPrivate: false },
          { createdById: user.id },
          {
            isPrivate: true,
            workspace: {
              members: {
                some: { userId: user.id, role: { in: ["OWNER", "ADMIN"] } },
              },
            },
          },
        ],
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        isPrivate: true,
        description: true,
      },
    }),
  );
  return (
    <WorkspaceShell
      workspace={current}
      role={current.role}
      channels={channels}
      user={{ id: user.id, name: user.name, email: user.email }}
    >
      {children}
    </WorkspaceShell>
  );
}
