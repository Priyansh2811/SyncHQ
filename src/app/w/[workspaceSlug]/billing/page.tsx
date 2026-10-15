import type { Metadata } from "next";
import { BillingPanel } from "@/components/billing-panel";
export const metadata: Metadata = {
  title: "Billing",
  description: "View your workspace plan and manage billing.",
  robots: { index: false, follow: false },
};
export default async function Billing({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  return (
    <section className="workspace-page">
      <div className="eyebrow">Workspace / Billing</div>
      <h1>Plan and billing</h1>
      <p className="muted">
        Plan limits keep growth predictable. Existing workspace data stays in
        place if a plan changes.
      </p>
      <BillingPanel workspaceSlug={workspaceSlug} />
    </section>
  );
}
