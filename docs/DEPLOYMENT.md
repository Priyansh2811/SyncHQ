# Deployment

## Web application

Deploy the Next.js app to Vercel or a Node-compatible host. Configure `NEXT_PUBLIC_APP_URL`, a restricted `DATABASE_URL`, owner-only `DIRECT_URL`, and a random `SESSION_SECRET`. Apply `npx prisma migrate deploy` during release using the migration connection. Keep secrets server-only; only the app URL, socket URL, and explicitly configured analytics provider/ID are public.

## PostgreSQL

Use Supabase, Neon, or another PostgreSQL service that supports the migration SQL, UUIDs, RLS, and the security-definer helpers. Create a dedicated runtime role without table ownership or `BYPASSRLS`, grant only required schema/table/function privileges, and connect with TLS. Use the provider’s direct/admin URL only for migrations. Review the provider’s pooler mode and transaction support: RLS context uses transaction-local settings, so the transaction must stay on one connection.

## Redis and Socket.io

Deploy `npm run socket` as a persistent Node service with a Redis protocol URL. Set `REDIS_URL` on both the Next.js API and socket processes. Set `NEXT_PUBLIC_SOCKET_URL` to a same-site or same-site subdomain endpoint that supports WebSocket upgrades, then use an exact application-origin allowlist. Do not deploy the socket server as a Vercel function.

`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` configure the independent REST rate limiter. Production sensitive endpoints fail closed if these are missing.

## Stripe and email

Configure server-side Stripe test/live keys, plan Price IDs, webhook secret, customer portal, and the three webhook event types listed in [BILLING.md](BILLING.md). Configure SMTP for invitation and reset email. Contact forms always persist; set `CONTACT_NOTIFY_EMAIL` and SMTP values if an email copy is required.

## Domains and free tiers

For subdomain routing, configure wildcard DNS and TLS for `*.synchq.app` (or update the suffix in `src/lib/tenant-host.ts` for a custom domain). Subdomain resolution selects a workspace candidate only; membership remains mandatory. Hosting, database, Redis, email and Stripe trial/free allowances can change and may sleep, cap connections, bandwidth, or retention. Confirm current provider limits and expected usage before launch; no provider plan is assumed permanent or unlimited.
