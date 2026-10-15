import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { apiError, json, parseJson } from "@/lib/http";
import { requirePermission, withTenant } from "@/lib/rbac";
import { enforceRateLimit } from "@/lib/limiter";
import Stripe from "stripe";
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return json({ error: "UNAUTHENTICATED" }, 401);
    const { workspaceId } = await params;
    await requirePermission({
      workspaceId,
      userId: user.id,
      permission: "MANAGE_BILLING",
    });
    await enforceRateLimit(`checkout:${user.id}`, 5, 3600);
    const { plan } = z
      .object({ plan: z.enum(["PRO", "BUSINESS"]) })
      .parse(await parseJson(req));
    const priceId =
      plan === "PRO"
        ? process.env.STRIPE_PRICE_PRO
        : process.env.STRIPE_PRICE_BUSINESS;
    if (!priceId || !process.env.STRIPE_SECRET_KEY)
      throw new Error("STRIPE_NOT_CONFIGURED");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const workspace = await withTenant(
      workspaceId,
      user.id,
      (tx) =>
        tx.workspace.findUniqueOrThrow({
          where: { id: workspaceId },
          include: { subscription: true },
        }),
      "MANAGE_BILLING",
    );
    if (
      workspace.subscription?.stripeSubscriptionId &&
      ["ACTIVE", "TRIALING", "PAST_DUE"].includes(workspace.subscription.status)
    )
      throw new Error("SUBSCRIPTION_ACTIVE");
    let customerId = workspace.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create(
        { name: workspace.name, metadata: { workspaceId } },
        { idempotencyKey: `synchq-customer-${workspaceId}` },
      );
      customerId = customer.id;
      await withTenant(
        workspaceId,
        user.id,
        async (tx) => {
          await tx.workspace.update({
            where: { id: workspaceId },
            data: { stripeCustomerId: customerId },
          });
          await tx.subscription.update({
            where: { workspaceId },
            data: { stripeCustomerId: customerId },
          });
        },
        "MANAGE_BILLING",
      );
    }
    await requirePermission({
      workspaceId,
      userId: user.id,
      permission: "MANAGE_BILLING",
    });
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/w/${workspace.slug}/billing?checkout=success`,
      cancel_url: `${base}/w/${workspace.slug}/billing?checkout=cancelled`,
      client_reference_id: workspaceId,
      metadata: { workspaceId, plan },
      subscription_data: { metadata: { workspaceId, plan } },
    });
    return json({ url: session.url });
  } catch (e) {
    return apiError(e);
  }
}
