import Link from "next/link";
import { MarketingHeader, Footer } from "@/components/marketing";
export default function NotFound() {
  return (
    <>
      <MarketingHeader />
      <main className="shell" style={{ minHeight: 450, paddingTop: 100 }}>
        <div className="eyebrow">404 · Not found</div>
        <h1 style={{ fontSize: 52, letterSpacing: "-.06em", margin: "12px 0" }}>
          This page went quiet.
        </h1>
        <p className="muted" style={{ maxWidth: 500, lineHeight: 1.7 }}>
          The address may have changed, or the page may no longer be here. Let’s
          get you back to a useful place.
        </p>
        <Link href="/" className="button" style={{ marginTop: 14 }}>
          Go to SyncHQ
        </Link>
      </main>
      <Footer />
    </>
  );
}
