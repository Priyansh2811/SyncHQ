import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader, Footer } from "@/components/marketing";
export const metadata: Metadata = {
  title: "Thanks for reaching out",
  description: "Your message has been received by the SyncHQ team.",
  alternates: { canonical: "/thank-you" },
};
export default function Thanks() {
  return (
    <>
      <MarketingHeader />
      <main className="shell" style={{ minHeight: 420, paddingTop: 90 }}>
        <div className="eyebrow">Received</div>
        <h1 style={{ fontSize: 48, letterSpacing: "-.05em" }}>
          Thanks for reaching out.
        </h1>
        <p className="muted" style={{ maxWidth: 540, lineHeight: 1.7 }}>
          Your note is in our inbox. In the meantime, you can learn more about
          SyncHQ or start a workspace.
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <Link href="/" className="button secondary">
            Back home
          </Link>
          <Link href="/register" className="button">
            Create a workspace
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
