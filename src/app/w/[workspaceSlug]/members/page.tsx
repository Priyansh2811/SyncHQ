import type { Metadata } from "next";
import { MembersPanel } from "@/components/members-panel";
export const metadata: Metadata = {
  title: "Members",
  description: "Manage workspace members and invitations.",
  robots: { index: false, follow: false },
};
export default async function Members({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  return (
    <section className="workspace-page">
      <div className="eyebrow">Workspace / Members</div>
      <h1>People in this workspace</h1>
      <p className="muted">
        Invite teammates and choose the role that fits their work.
      </p>
      <MembersPanel workspaceSlug={workspaceSlug} />
    </section>
  );
}
