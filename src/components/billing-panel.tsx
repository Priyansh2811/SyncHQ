"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, ExternalLink, ShieldCheck } from "lucide-react";
import { track } from "@/components/cookie-consent";
type Billing = {
  subscription: {
    plan: string;
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    hasCustomer: boolean;
  } | null;
  limits: { members: number; channels: number };
  usage: { members: number; channels: number };
};
export function BillingPanel({ workspaceSlug }: { workspaceSlug: string }) {
  const [workspaceId, setWorkspaceId] = useState(""),
    [role, setRole] = useState("MEMBER"),
    [billing, setBilling] = useState<Billing | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const params = useSearchParams();
  const notice =
    params.get("checkout") === "success"
      ? "Checkout completed. Your updated plan will appear after Stripe confirms it."
      : params.get("checkout") === "cancelled"
        ? "Checkout was cancelled. No plan change was made."
        : "";
  useEffect(() => {
    async function load() {
      const ws = await fetch("/api/workspaces").then((r) => r.json());
      const w = ws.workspaces?.find(
        (x: { slug: string }) => x.slug === workspaceSlug,
      );
      if (!w) return;
      setWorkspaceId(w.id);
      setRole(w.role);
      const res = await fetch(`/api/workspaces/${w.id}/billing`);
      const data = await res.json();
      if (res.ok) setBilling(data);
    }
    void load();
  }, [workspaceSlug]);
  useEffect(() => {
    if (params.get("checkout") === "success") track("subscription_completed");
  }, [params]);
  async function action(type: "checkout" | "portal", plan?: string) {
    setBusy(true);
    setError("");
    const url =
      type === "checkout"
        ? `/api/workspaces/${workspaceId}/billing/checkout`
        : `/api/workspaces/${workspaceId}/billing/portal`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      ...(plan ? { body: JSON.stringify({ plan }) } : {}),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(
        data.error === "STRIPE_NOT_CONFIGURED"
          ? "Billing is not available yet. Set the Stripe secret, webhook, and server-side plan price IDs in the deployment environment."
          : (data.error ?? "Billing could not be opened."),
      );
      return;
    }
    if (type === "checkout") track("checkout_started", { plan: plan ?? "" });
    location.assign(data.url);
  }
  const current = billing?.subscription?.plan ?? "FREE",
    canBill = role === "OWNER";
  return (
    <div className="billing-panel">
      {notice && (
        <div className="billing-notice" role="status">
          <Check size={15} />
          {notice}
        </div>
      )}
      {error && (
        <p role="alert" className="billing-error">
          {error}
        </p>
      )}
      <section className="current-plan">
        <div>
          <div className="eyebrow">Current plan</div>
          <h2>{current}</h2>
          <p>
            {billing?.subscription?.status
              ? billing.subscription.status.toLowerCase().replace("_", " ")
              : "active"}
            {billing?.subscription?.cancelAtPeriodEnd
              ? " · ends at period close"
              : ""}
            {billing?.subscription?.currentPeriodEnd && (
              <span>
                {" "}
                · renews{" "}
                {new Date(
                  billing.subscription.currentPeriodEnd,
                ).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>
        <div className="plan-limit">
          <b>{billing?.limits.members ?? 10}</b>
          <span>members</span>
          <i />
          <b>{billing?.limits.channels ?? 5}</b>
          <span>channels</span>
        </div>
      </section>
      <p className="billing-explain">
        Limits apply to new invitations and channels. If a subscription ends,
        your existing data stays in place; new actions are restricted when you
        are over the Free plan limit.
      </p>
      <div className="billing-cards">
        {(
          [
            {
              plan: "FREE",
              members: 10,
              channels: 5,
              description: "A small team getting started.",
            },
            {
              plan: "PRO",
              members: 100,
              channels: 100,
              description: "More room for growing teams.",
            },
            {
              plan: "BUSINESS",
              members: 1000,
              channels: 1000,
              description: "Room for large organizations.",
            },
          ] as const
        ).map((p) => (
          <article
            key={p.plan}
            className={`billing-tier ${current === p.plan ? "selected" : ""}`}
          >
            <div>
              <h3>{p.plan}</h3>
              <p>{p.description}</p>
            </div>
            <ul>
              <li>
                <Check size={14} />
                {p.members.toLocaleString()} members
              </li>
              <li>
                <Check size={14} />
                {p.channels.toLocaleString()} channels
              </li>
              <li>
                <ShieldCheck size={14} />
                Workspace isolation
              </li>
            </ul>
            {current === p.plan ? (
              <span className="active-plan">Current plan</span>
            ) : canBill && p.plan !== "FREE" ? (
              <button
                className="button small"
                disabled={busy}
                onClick={() => action("checkout", p.plan)}
              >
                Choose {p.plan}
              </button>
            ) : (
              <span className="muted">
                {p.plan === "FREE" ? "Included" : "Owner manages billing"}
              </span>
            )}
          </article>
        ))}
      </div>
      <div className="portal-row">
        <div>
          <b>Manage subscription</b>
          <p>
            Change a paid plan or cancel at period end in Stripe’s secure
            billing portal.
          </p>
        </div>
        <button
          className="button secondary small"
          disabled={busy || !billing?.subscription?.hasCustomer || !canBill}
          onClick={() => action("portal")}
        >
          <ExternalLink size={14} />
          {busy ? "Opening…" : "Open billing portal"}
        </button>
      </div>
      {!canBill && (
        <p className="muted" style={{ fontSize: 12 }}>
          Only a workspace owner can manage billing.
        </p>
      )}
      <style>{billingCss}</style>
    </div>
  );
}
const billingCss = `.billing-panel{margin-top:33px;max-width:1020px}.current-plan{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:22px 24px;background:var(--white);border:1px solid var(--line);border-radius:7px}.current-plan h2{font-size:25px;letter-spacing:-.04em;margin:7px 0}.current-plan p,.billing-explain{font-size:12px;color:var(--muted);line-height:1.6}.plan-limit{display:flex;align-items:baseline;gap:7px;font-size:12px}.plan-limit b{font-size:18px}.plan-limit i{height:21px;width:1px;background:var(--line);margin:0 8px}.billing-explain{max-width:660px;margin:14px 2px 28px}.billing-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.billing-tier{display:flex;flex-direction:column;min-height:235px;background:var(--white);border:1px solid var(--line);border-radius:7px;padding:18px}.billing-tier.selected{border-color:#bb553d}.billing-tier h3{font-size:15px;margin:0}.billing-tier p{font-size:11px;color:var(--muted);margin:6px 0}.billing-tier ul{list-style:none;padding:0;display:grid;gap:9px;margin:19px 0;font-size:11px}.billing-tier li{display:flex;align-items:center;gap:8px;color:var(--muted)}.billing-tier li svg{color:#315f4f}.billing-tier .button{margin-top:auto;align-self:start}.active-plan{margin-top:auto;font-size:12px;color:#315f4f}.portal-row{margin-top:29px;border-top:1px solid var(--line);padding-top:18px;display:flex;align-items:center;justify-content:space-between;gap:20px}.portal-row b{font-size:13px}.portal-row p{font-size:11px;color:var(--muted);margin:5px 0}.portal-row .button{white-space:nowrap}.billing-notice{display:flex;align-items:center;gap:8px;padding:12px;border:1px solid #cad8ce;background:#eef4ee;color:#315f4f;font-size:13px;margin-bottom:15px;border-radius:6px}.billing-error{color:#a74436;font-size:13px}@media(max-width:740px){.billing-cards{grid-template-columns:1fr}.billing-tier{min-height:190px}.current-plan{align-items:start;flex-direction:column}.plan-limit{margin-top:5px}.portal-row{align-items:start;flex-direction:column}.portal-row .button{white-space:normal}}`;
