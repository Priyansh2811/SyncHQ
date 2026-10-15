import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listMyWorkspaces } from "@/lib/workspaces";
import { withTenant } from "@/lib/rbac";
import { MessageArea } from "@/components/message-area";
export const metadata: Metadata = {
  title: "Channel",
  description: "Private team conversation in SyncHQ.",
  robots: { index: false, follow: false },
};
export default async function ChannelPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; channelSlug: string }>;
}) {
  const { workspaceSlug, channelSlug } = await params;
  const user = await getCurrentUser();
  if (!user) notFound();
  const workspaces = await listMyWorkspaces(user.id);
  const workspace = workspaces.find((w) => w.slug === workspaceSlug);
  if (!workspace) notFound();
  const data = await withTenant(workspace.id, user.id, async (tx) => {
    const channel = await tx.channel.findFirst({
      where: { workspaceId: workspace.id, slug: channelSlug },
    });
    if (!channel) return null;
    const messages = await tx.message.findMany({
      where: { workspaceId: workspace.id, channelId: channel.id },
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
    return { channel, messages: messages.reverse() };
  });
  if (!data) notFound();
  return (
    <MessageArea
      key={data.channel.id}
      workspaceId={workspace.id}
      channel={data.channel}
      initialMessages={data.messages}
      role={workspace.role}
      currentUserId={user.id}
    />
  );
}
