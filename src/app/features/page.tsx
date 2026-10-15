import type { Metadata } from "next";
import { ContentPage } from "@/components/public-pages";
import Link from "next/link";
export const metadata: Metadata = {
  title: "Features for focused teams",
  description:
    "Channels, real-time conversation, workspace roles and team controls in one practical collaboration space.",
  alternates: { canonical: "/features" },
};
const features = [
  [
    "Channels with a purpose",
    "Organize conversations in public channels. Private channels are limited to the creator and workspace owners or admins.",
  ],
  [
    "Messages that stay useful",
    "Send, edit and remove messages with timestamps and author details. Changes persist in PostgreSQL and synchronize to connected teammates.",
  ],
  [
    "Roles that set clear boundaries",
    "Give owners, admins, members and guests the right level of access. Every permission is checked on the server for every request.",
  ],
  [
    "Invitations that expire safely",
    "Invite a teammate by email with a single-use token that expires after seven days. Membership begins only after the invited email accepts.",
  ],
  [
    "Multiple workspaces",
    "Keep teams separate, switch between workspaces and control each one’s settings and membership independently.",
  ],
  [
    "Billing that follows the source",
    "Upgrade through Stripe Checkout and manage renewal or cancellation in Stripe’s portal. Verified webhooks update workspace entitlements.",
  ],
  [
    "Responsive by default",
    "Use the same workspace on desktop, tablet or a narrow mobile screen, with keyboard focus states and reduced-motion support.",
  ],
];
export default function Features() {
  return (
    <ContentPage
      eyebrow="Features"
      title="Everything your team needs to stay in sync."
      description="Purposeful tools for conversations, access and the everyday shape of team work."
    >
      <div className="feature-detail-grid">
        {features.map(([t, p], i) => (
          <article key={t}>
            <span className="eyebrow">{String(i + 1).padStart(2, "0")}</span>
            <h2>{t}</h2>
            <p>{p}</p>
          </article>
        ))}
      </div>
      <p style={{ marginTop: 34 }}>
        <Link className="button" href="/register">
          Start a workspace
        </Link>
      </p>
    </ContentPage>
  );
}
