# Development and testing

## Commands

```sh
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
npm run lint
npm run build
npm test
npm run test:e2e
npm run prisma:seed
```

Run `npm run socket` in a separate terminal and provide Redis to test realtime. A local PostgreSQL instance is required for route behavior, migrations, seeds, and the browser workflow. Use a dedicated test database for automated runs; integration tests remove their isolated test workspaces and users.

## Environment

Copy `.env.example` to `.env`. Use a local PostgreSQL database with an owner-only migration URL and a separate RLS-constrained application role. Add a local Redis URL. Leave Stripe/SMTP/analytics fields empty until those services are configured. The seed account is `dev@synchq.local`; override its development password with `DEVELOPMENT_SEED_PASSWORD`.

Set `TEST_DATABASE_URL` to a migrated database accessed by the restricted runtime role to run the tenant integration tests. Tests are skipped without that setting. Set `E2E_BASE_URL` to a live app to run browser tests without Playwright starting its own dev server; otherwise the Playwright config starts `npm run dev`. Browser tests create uniquely named accounts/workspaces, so point them only at a disposable test database.

## Troubleshooting

- `DATABASE_URL` and `DIRECT_URL` are required by Prisma CLI and runtime; do not set both to the owner URL in production.
- An RLS query returning no rows usually means missing/incorrect `app.user_id`, `app.workspace_id`, active membership, or runtime-role grants.
- Socket status remains reconnecting when `NEXT_PUBLIC_SOCKET_URL`, cookie scope, origin allowlist, process port, or Redis is incorrect.
- SMTP errors prevent invitation/reset links from being treated as sent. Configure sender, host, port, credentials, and outbound access.
- Stripe checkout needs valid server price IDs; webhooks need the raw request body and matching `STRIPE_WEBHOOK_SECRET`.
