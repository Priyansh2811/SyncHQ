# Tenant isolation and RLS

## Context

For a workspace transaction, the server first checks the signed-in user’s active membership and role. `withTenant` then sets transaction-local `app.user_id` and `app.workspace_id`. PostgreSQL policies check that context and call a `SECURITY DEFINER` membership helper. Private-channel reads additionally check channel visibility. The invitation-accept function verifies the one-time token, expiry, and invited email before it creates membership.

The RLS migration enables policies on `Workspace`, `WorkspaceMember`, `Channel`, `Message`, `Subscription`, `Invitation`, and `AuditLog`. Identity/session tables and global contact/waitlist tables are intentionally outside workspace RLS; they are accessed by user ID, session token hash, or public form validation instead.

## Required database roles

Do not connect the web application as the schema owner or a role with `BYPASSRLS`. Table owners can bypass ordinary RLS, so runtime use of an owner login defeats the tenant boundary. Apply migrations using an owner/admin connection, then create a distinct login for the application:

```sql
CREATE ROLE synchq_app LOGIN PASSWORD 'use-a-secret-manager'
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
GRANT CONNECT ON DATABASE synchq TO synchq_app;
GRANT USAGE ON SCHEMA public TO synchq_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO synchq_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO synchq_app;
```

Apply equivalent least-privilege grants for your hosted PostgreSQL provider and configure default privileges for future migrations. Keep `DIRECT_URL` owner-only and use the `synchq_app` connection for `DATABASE_URL`. If your provider cannot create a non-owner, non-`BYPASSRLS` app role, use a connection role with equivalent guarantees before production.

`app.system=true` is reserved for trusted server webhook work and migration/integration cleanup. It is set only inside a server-owned transaction; never forward this setting from a request. All protected API mutations still call the RBAC service before issuing a query. The test suite in `tests/tenant.integration.test.ts` proves cross-workspace reads, updates, and billing permission checks against a migrated `TEST_DATABASE_URL`.

## Operational checks

After migration, inspect `pg_policies` for all seven tenant tables and confirm RLS is enabled. Connect using `synchq_app` and verify that an unset tenant context returns no workspace rows. Do not run the tenant isolation tests with an owner/superuser connection and treat that as proof; the test URL must use the restricted app role.
