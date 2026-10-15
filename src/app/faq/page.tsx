import type { Metadata } from "next";
import {
  ContentPage,
  FAQContent,
  faqsForSchema,
} from "@/components/public-pages";
export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    "Answers about SyncHQ workspace plans, privacy, roles, billing and team data.",
  alternates: { canonical: "/faq" },
};
export default function FAQ() {
  const structured = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqsForSchema.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <ContentPage
      eyebrow="FAQ"
      title="Clear answers, before you begin."
      description="A few practical details about teams, plans, data and billing."
    >
      <FAQContent />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structured).replace(/</g, "\\u003c"),
        }}
      />
    </ContentPage>
  );
}
