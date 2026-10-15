import type { Metadata } from "next";
import { InvitationAccept } from "@/components/token-forms";
import { Brand } from "@/components/brand";
export const metadata: Metadata = {
  title: "Accept workspace invitation",
  description: "Accept a SyncHQ workspace invitation.",
  robots: { index: false, follow: false },
};
export default async function Invite({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <main className="token-page">
      <Brand />
      <InvitationAccept token={token} />
      <style>{`.token-page{min-height:100dvh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:30px;padding:24px}.token-card{width:min(100%,460px);background:#fff;border:1px solid var(--line);padding:32px;border-radius:9px;display:grid;gap:16px}.token-card h1{font-size:29px;letter-spacing:-.05em;margin:0}.token-card>a{font-size:13px;text-decoration:underline}.token-card [role=alert]{font-size:13px;color:#a74436}.invite-auth-links{display:grid;justify-items:start;gap:14px}.invite-auth-links>a:last-child{font-size:13px;text-decoration:underline}`}</style>
    </main>
  );
}
