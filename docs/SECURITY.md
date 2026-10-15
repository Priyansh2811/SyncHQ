# Security

- Session cookies are HTTP-only, same-site, production-secure, opaque, expiring, and backed by HMAC-hashed database tokens.
- Passwords use bcrypt. Password reset and invitation tokens are high-entropy, stored only as HMAC digests, expire, and can be used once.
- Every tenant route derives the actor from the session, checks workspace membership and permission, validates bounded Zod inputs, and scopes queries through a transaction-local RLS context.
- PostgreSQL RLS adds the tenant boundary. Runtime DB credentials must be a non-owner, `NOBYPASSRLS` role; migration credentials are separate.
- Stripe webhooks validate the signature over the unmodified request body. Stripe plan IDs never come from the browser.
- Public and sensitive forms are rate-limited. Production requires Upstash rate-limit credentials; the local in-memory fallback is only for development.
- React renders message bodies as escaped text. The API caps JSON requests at 1 MiB and field sizes are bounded.
- Responses include content-type, clickjacking, referrer, and permissions headers. Socket.io accepts only the configured web origin. Next APIs do not enable permissive cross-origin access.
- Audit metadata contains safe action/target details and does not store message contents.

Production checklist: set a long random session secret, use managed TLS and a restricted PostgreSQL application role, keep owner/migration credentials private, configure SMTP/Upstash/Redis/Stripe, restrict Stripe webhook events, use same-site socket hosting, and review database backups and log retention.
