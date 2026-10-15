import type { Metadata } from "next";
import "./globals.css";
import { Suspense } from "react";
import { CookieConsent, Analytics } from "@/components/cookie-consent";

const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(base),
  title: { default: "SyncHQ — Good work, together", template: "%s — SyncHQ" },
  description:
    "A calmer place for teams to talk, make decisions and move work forward.",
  openGraph: {
    type: "website",
    siteName: "SyncHQ",
    title: "SyncHQ — Good work, together",
    description: "Team communication with a little more focus.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SyncHQ",
    description: "A calmer place for your team.",
  },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <CookieConsent />
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
      </body>
    </html>
  );
}