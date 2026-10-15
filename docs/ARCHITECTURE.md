# Architecture

SyncHQ separates its web/API process from realtime transport:

- Next.js App Router renders the public pages and the authenticated workspace UI. Server Components load workspace data; client components handle forms, navigation, optimistic messages, theme selection, and Socket.io subscriptions.
- Route handlers validate input with Zod, derive the user from an HTTP-only session cookie, check membership and RBAC, establish transaction-local PostgreSQL tenant context, and persist changes through Prisma.
- PostgreSQL stores identity, workspace data, subscriptions, invitations, audit events, waitlist entries, and contact submissions. Tenant tables have RLS policies in the initial migration.
- A standalone Node Socket.io process authenticates the same session cookie and verifies membership and private-channel access before joining server-derived rooms. The Redis adapter scales socket rooms across processes; `@socket.io/redis-emitter` publishes API changes from the web process.
- Stripe owns payment state. A verified webhook synchronizes subscription state and audit events into PostgreSQL.

Tenant context is not inferred from a hostname or a request body. `/w/[workspaceSlug]` and an optional `*.synchq.app` host select a workspace candidate; the server resolves the signed-in user’s active memberships and verifies the requested workspace before loading data. A slug or workspace ID alone grants no access.

The web app can run on Vercel or a Node host. Socket.io must run as a persistent Node process on a platform that supports long-lived WebSocket connections. Route handlers do not host the socket process.
