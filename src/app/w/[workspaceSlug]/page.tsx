import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listMyWorkspaces } from "@/lib/workspaces";
import { withTenant } from "@/lib/rbac";
import Link from "next/link";
export default async function WorkspaceHome({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const workspaces = await listMyWorkspaces(user.id);
  const workspace = workspaces.find((w) => w.slug === workspaceSlug);
  if (!workspace) notFound();
  const first = await withTenant(workspace.id, user.id, (tx) =>
    tx.channel.findFirst({
      where: {
        workspaceId: workspace.id,
        OR: [{ isPrivate: false }, { createdById: user.id }],
      },
      orderBy: { name: "asc" },
      select: { slug: true },
    }),
  );
  if (first) redirect(`/w/${workspaceSlug}/c/${first.slug}`);
  return (
    <section className="workspace-page">
      <div className="eyebrow">{workspace.name}</div>
      <h1>Start with a channel.</h1>
      <p className="muted">
        This workspace doesn’t have a channel yet. Create one from the channel
        list to start a conversation.
      </p>
      <Link className="button" href={`/w/${workspaceSlug}/settings`}>
        Open workspace settings
      </Link>
    </section>
  );
}
