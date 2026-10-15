# SyncHQ

SyncHQ is a multi-tenant team collaboration application built with Next.js App Router, TypeScript, PostgreSQL, Prisma, and a separately hosted Socket.io server. Workspace membership is checked server-side and again by PostgreSQL row-level security. The application also includes email invitations and password recovery, Stripe Checkout and billing portal flows, contact and waitlist forms, plan caps, responsive public pages, and a development seed.

## Requirements

- Node.js 20.9 or newer
- PostgreSQL 15 or newer
- Redis for multi-process real-time fan-out (Redis protocol URL)
- Stripe account and product prices for paid plans
- SMTP credentials for invitation and password reset email in production

## Local setup

1. Install dependencies with `npm install` (or `pnpm install`).
2. Copy `.env.example` to `.env` and set the database URLs and a random `SESSION_SECRET` of at least 32 characters.
3. Apply the database migration: `npx prisma migrate dev`.
4. Generate Prisma Client: `npx prisma generate`.
5. Optionally seed a local development account: `npm run prisma:seed`.
6. Start the web application: `npm run dev`.
7. Start the persistent Socket.io process in another terminal: `npm run socket`.

The Next.js app listens on port 3000 and the Socket.io process defaults to port 4001. For realtime locally, run Redis and set `REDIS_URL`; the web process publishes through the Socket.io Redis emitter and the socket process uses the Redis adapter. Without Redis, HTTP collaboration still works, but realtime fan-out is unavailable. Never use the development seed password or a superuser database connection in production.

`npm run lint`, `npm run build`, `npm test`, and `npm run test:e2e` are available. The PostgreSQL security integration tests need `TEST_DATABASE_URL` set to a migrated database connection using the restricted, non-owner application role. The browser E2E flow needs a reachable migrated database and the development server.

## Runtime configuration

See [.env.example](.env.example) and [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for every variable and setup steps. `DATABASE_URL` is the application’s restricted PostgreSQL role; `DIRECT_URL` is reserved for Prisma migrations. `REDIS_URL` uses the Redis wire protocol and is distinct from Upstash’s REST URL/token, which back API rate limits. `NEXT_PUBLIC_SOCKET_URL` points browsers to the persistent Socket.io server. Paid plan price IDs are read only by the server.

## Architecture and operations

- [Architecture](docs/ARCHITECTURE.md)
- [Database and migrations](docs/DATABASE.md)
- [Tenant isolation and PostgreSQL RLS](docs/RLS.md)
- [Authentication](docs/AUTH.md)
- [Socket.io and Redis](docs/SOCKETS.md)
- [Stripe billing](docs/BILLING.md)
- [Security](docs/SECURITY.md)
- [API reference](docs/API.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Development and testing](docs/DEVELOPMENT.md)

## Development account

The seed is refused when `NODE_ENV=production`. Its default password is intentionally development-only; set `DEVELOPMENT_SEED_PASSWORD` to a unique local value before seeding. Seeded messages are not created. Real messages come from authenticated users and are stored in PostgreSQL.
