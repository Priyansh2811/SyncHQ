# Authentication

Passwords are hashed with bcryptjs at cost 12. Login creates a 256-bit random token, stores only an HMAC-SHA256 digest in `Session`, and sets the opaque token in the `synchq_session` HTTP-only, same-site cookie. The cookie is Secure in production and expires after 30 days. The HMAC key is `SESSION_SECRET`; production requires at least 32 characters.

Registration and login are rate-limited. Sensitive routes use Upstash sliding-window rate limits when configured. Local development uses a process-local limiter; production fails closed if the Upstash REST settings are absent. Password reset tokens are one-time, hashed, and expire after one hour. Invitation tokens are one-time, hashed, and expire after seven days. Both flows require SMTP in production.

`GET /api/me` returns only the current user’s public profile fields. Logout deletes the current server session and notifies connected sockets to close. Password changes invalidate existing sessions and require a fresh sign-in. No route accepts a user ID, membership role, or workspace owner from the browser as authentication context.
