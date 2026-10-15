import type { Metadata } from "next";
import { ForgotForm } from "@/components/token-forms";
import { Brand } from "@/components/brand";
export const metadata: Metadata = {
  title: "Reset password",
  description: "Request a secure password reset link for your SyncHQ account.",
  robots: { index: false, follow: false },
};
export default function Forgot() {
  return (
    <main className="token-page">
      <Brand />
      <ForgotForm />
      <style>{`.token-page{min-height:100dvh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:30px;padding:24px}.token-card{width:min(100%,460px);background:#fff;border:1px solid var(--line);padding:32px;border-radius:9px;display:grid;gap:16px}.token-card h1{font-size:29px;letter-spacing:-.05em;margin:0}.token-card>a{font-size:13px;text-decoration:underline}.token-form{display:grid;gap:17px}.token-form>p{font-size:14px;line-height:1.6}.token-form [role=alert],.token-card [role=alert]{font-size:13px;color:#a74436}@media(max-width:500px){.token-card{padding:25px 20px}}`}</style>
    </main>
  );
}
