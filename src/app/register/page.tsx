import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
export const metadata: Metadata = {
  title: "Create your account",
  description: "Create your SyncHQ account and start a team workspace.",
  alternates: { canonical: "/register" },
  robots: { index: false, follow: false },
};
export default function Register() {
  return <AuthForm mode="register" />;
}
