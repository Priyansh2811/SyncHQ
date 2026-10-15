import type { Metadata } from "next";
import { ContentPage } from "@/components/public-pages";
import { ContactForm } from "@/components/public-forms";
export const metadata: Metadata = {
  title: "Contact the SyncHQ team",
  description: "Send a question or note to the SyncHQ team.",
  alternates: { canonical: "/contact" },
};
export default function Contact() {
  return (
    <ContentPage
      eyebrow="Contact"
      title="We’re here to help."
      description="Send us a note and the team will follow up by email."
    >
      <div className="form-panel">
        <ContactForm />
      </div>
    </ContentPage>
  );
}
