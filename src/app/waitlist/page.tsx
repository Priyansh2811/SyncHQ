import type { Metadata } from "next";
import { ContentPage } from "@/components/public-pages";
import { WaitlistForm } from "@/components/public-forms";
export const metadata: Metadata = {
  title: "Join the SyncHQ waitlist",
  description: "Add your email to receive product updates from SyncHQ.",
  alternates: { canonical: "/waitlist" },
};
export default function Waitlist() {
  return (
    <ContentPage
      eyebrow="Waitlist"
      title="A little more room to focus."
      description="Leave your email and we’ll send product updates as SyncHQ grows."
    >
      <div className="form-panel">
        <WaitlistForm />
      </div>
    </ContentPage>
  );
}
