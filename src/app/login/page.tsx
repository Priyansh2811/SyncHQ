import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to your SyncHQ workspace.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: false },
};
export default function Login() {
  return (
    <Suspense>
      <AuthForm mode="login" />
    </Suspense>
  );
}
