# Billing

Plans are Free, Pro, and Business. Free allows 10 active members and 5 channels; Pro allows 100 of each; Business allows 1,000 of each. Invitations and channel creation check the current database plan before creating records. If a subscription expires, existing records remain; new actions fail with a plan-limit response until the workspace is within its current limits or upgrades.

Pro and Business price IDs are read from `STRIPE_PRICE_PRO` and `STRIPE_PRICE_BUSINESS`; the client submits only a plan enum. Checkout and the billing portal require an owner. The app links a Stripe customer to the workspace and stores the Stripe subscription. Stripe signatures are verified against the raw webhook body. The webhook handles checkout completion, subscription update, and subscription deletion and records Stripe event IDs for idempotence.

Configure Checkout and the customer portal in Stripe, then direct the webhook to `/api/webhooks/stripe`. Subscribe at minimum to `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`. Test locally with the Stripe CLI and set its webhook signing secret in `STRIPE_WEBHOOK_SECRET`. Stripe event state is authoritative. Cancellation at period end keeps the paid entitlements until Stripe reports the subscription ended; deletion changes the stored plan back to Free.

Set the public price IDs only on the server. Do not collect card data in SyncHQ. Exact Stripe fees, tax behavior, currency, and provider account requirements depend on the Stripe account configuration.
