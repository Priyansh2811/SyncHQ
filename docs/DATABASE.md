# Database

The Prisma schema defines users, hashed sessions, workspaces, members, channels, messages, subscriptions, invitations, reset tokens, waitlist records, audit logs, contact submissions, and Stripe webhook event IDs. UUID primary keys, foreign keys, cascade/restrict behavior, timestamp fields, unique workspace/channel slugs, unique memberships, and query indexes are included.

`prisma/migrations/20261002000000_init/migration.sql` creates the schema and installs the RLS policies from `prisma/rls.sql`. Use `npx prisma migrate dev` locally and `npx prisma migrate deploy` for a deployed database. `DATABASE_URL` must point to the restricted application login at runtime. `DIRECT_URL` is the owner/migration connection.

The important access paths are indexed: workspace slug and owner; `(workspaceId,userId)` membership; `(workspaceId,slug)` channel; `(channelId,createdAt)` messages; subscription workspace; invitation token; audit `(workspaceId,createdAt)`. Messages also have a unique `(channelId,authorId,clientId)` constraint for optimistic retry reconciliation.

`npm run prisma:seed` creates a development-only user, workspace, owner membership, general channel, and Free subscription. It does not seed pretend conversations and refuses to run with `NODE_ENV=production`.
