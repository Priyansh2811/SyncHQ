import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { apiError, json } from "@/lib/http";
import { requirePermission, withTenant } from "@/lib/rbac";
import Stripe from "stripe";
export async function POST(
  _req: NextRequest,
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
    if (!process.env.STRIPE_SECRET_KEY)
      throw new Error("STRIPE_NOT_CONFIGURED");
    const workspace = await withTenant(
      workspaceId,
      user.id,
      (tx) =>
        tx.workspace.findUniqueOrThrow({
          where: { id: workspaceId },
          select: { slug: true, stripeCustomerId: true },
        }),
      "MANAGE_BILLING",
    );
    if (!workspace.stripeCustomerId) throw new Error("NOT_FOUND");
    await requirePermission({
      workspaceId,
      userId: user.id,
      permission: "MANAGE_BILLING",
    });
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const portal = await stripe.billingPortal.sessions.create({
      customer: workspace.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/w/${workspace.slug}/billing`,
    });
    return json({ url: portal.url });
  } catch (e) {
    return apiError(e);
  }
}
