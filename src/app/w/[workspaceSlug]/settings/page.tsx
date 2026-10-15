import type { Metadata } from "next";
import { SettingsPanel } from "@/components/settings-panel";
export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your SyncHQ profile, workspace, and preferences.",
  robots: { index: false, follow: false },
};
export default async function Settings({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  return (
    <section className="workspace-page">
      <div className="eyebrow">Workspace / Settings</div>
      <h1>Settings</h1>
      <p className="muted">
        Keep your profile and workspace set up the way your team needs.
      </p>
      <SettingsPanel workspaceSlug={workspaceSlug} />
      <style>{`.workspace-page{padding:34px clamp(16px,4vw,42px) 65px}.workspace-page h1{font-size:31px;letter-spacing:-.05em;margin:9px 0}.workspace-page>p{font-size:13px;line-height:1.65}`}</style>
    </section>
  );
}
