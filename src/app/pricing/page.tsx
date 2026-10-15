import type { Metadata } from "next";
import { ContentPage } from "@/components/public-pages";
import Link from "next/link";
export const metadata: Metadata = {
  title: "Plans and pricing",
  description: "Compare SyncHQ Free, Pro and Business workspace plans.",
  alternates: { canonical: "/pricing" },
};
const plans = [
  {
    name: "Free",
    tag: "For small teams getting started",
    price: "$0",
    limit: "Up to 10 members and 5 channels",
    items: [
      "One workspace per team",
      "Channels and messages",
      "Invitations and member roles",
      "30-day sessions",
    ],
  },
  {
    name: "Pro",
    tag: "For teams growing together",
    price: "Stripe configured",
    limit: "Up to 100 members and 100 channels",
    items: [
      "Everything in Free",
      "Higher workspace limits",
      "Stripe self-service billing",
      "Real-time updates",
    ],
  },
  {
    name: "Business",
    tag: "For larger organizations",
    price: "Stripe configured",
    limit: "Up to 1,000 members and 1,000 channels",
    items: [
      "Everything in Pro",
      "Higher workspace limits",
      "Manage plan in Stripe portal",
      "Workspace audit events",
    ],
  },
];
export default function Pricing() {
  return (
    <ContentPage
      eyebrow="Pricing"
      title="Room to grow, when you’re ready."
      description="Start with a free workspace. Paid plan amounts are configured in Stripe for your deployment, so checkout always shows the price set for your organization."
    >
      <div className="pricing-page-grid">
        {plans.map((p, i) => (
          <article
            key={p.name}
            className={`plan-card ${i === 1 ? "featured" : ""}`}
          >
            <h2>{p.name}</h2>
            <div className="plan-price">
              {p.price}
              {i > 0 && <small> · per plan</small>}
            </div>
            <p>{p.tag}</p>
            <b style={{ fontSize: 13, marginTop: 7 }}>{p.limit}</b>
            <ul>
              {p.items.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <Link
              href="/register"
              className={`button ${i === 0 ? "secondary" : ""}`}
            >
              {i === 0 ? "Start free" : "Create an account"}
            </Link>
          </article>
        ))}
      </div>
    </ContentPage>
  );
}
