import Stripe from "stripe";
import { db } from "@/lib/db";
import { apiError, json } from "@/lib/http";

export async function POST(req: Request) {
  try {
    const declaredSize = Number(req.headers.get("content-length") ?? 0);
    if (declaredSize > 2 * 1024 * 1024)
      return json({ error: "Payload too large" }, 413);
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET)
      throw new Error("STRIPE_NOT_CONFIGURED");
    const body = await req.text();
    if (Buffer.byteLength(body, "utf8") > 2 * 1024 * 1024)
      return json({ error: "Payload too large" }, 413);
    const signature = req.headers.get("stripe-signature");
    if (!signature) return json({ error: "Missing signature" }, 400);
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch {
      return json({ error: "Invalid signature" }, 400);
    }
    await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.system', 'true', true)`;
      const exists = await tx.stripeEvent.findUnique({
        where: { id: event.id },
      });
      if (exists) return;
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const workspaceId =
          session.metadata?.workspaceId ?? session.client_reference_id;
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        if (workspaceId && subId) {
          const subscription = await stripe.subscriptions.retrieve(subId);
          await applySubscription(tx, workspaceId, subscription);
        }
      } else if (
        event.type === "customer.subscription.updated" ||
        event.type === "customer.subscription.deleted"
      ) {
        const subscription = event.data.object as Stripe.Subscription;
        const workspaceId = subscription.metadata.workspaceId;
        if (workspaceId) await applySubscription(tx, workspaceId, subscription);
      }
      await tx.stripeEvent.create({ data: { id: event.id, type: event.type } });
    });
    return json({ received: true });
  } catch (e) {
    return apiError(e);
  }
}
async function applySubscription(
  tx: import("@prisma/client").Prisma.TransactionClient,
  workspaceId: string,
  sub: Stripe.Subscription,
) {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${workspaceId}:members`},0))`;
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${workspaceId}:channels`},0))`;
  const status =
    sub.status === "active"
      ? "ACTIVE"
      : sub.status === "trialing"
        ? "TRIALING"
        : sub.status === "past_due"
          ? "PAST_DUE"
          : sub.status === "canceled"
            ? "CANCELED"
            : "INCOMPLETE";
  const plan =
    status === "CANCELED" || status === "INCOMPLETE"
      ? "FREE"
      : sub.metadata.plan === "BUSINESS"
        ? "BUSINESS"
        : sub.metadata.plan === "PRO"
          ? "PRO"
          : "FREE";
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const end = new Date(
    sub.items.data[0]?.current_period_end
      ? sub.items.data[0].current_period_end * 1000
      : Date.now(),
  );
  await tx.workspace.update({
    where: { id: workspaceId },
    data: { stripeCustomerId: customerId, stripeSubscriptionId: sub.id },
  });
  await tx.subscription.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      status,
      plan,
      currentPeriodEnd: end,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      status,
      plan,
      currentPeriodEnd: end,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
  });
  await tx.auditLog.create({
    data: {
      workspaceId,
      action: "billing.subscription_changed",
      targetType: "subscription",
      targetId: sub.id,
      metadata: { status, plan },
    },
  });
}
