# API reference

All request bodies are JSON, capped at 1 MiB, and validated by Zod. Authenticated routes use the session cookie. Workspace IDs in paths or bodies are selectors only; the server resolves membership and permission before querying tenant data.

| Method and path                                             | Access                      | Purpose                                                                                          |
| ----------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------ |
| `POST /api/auth/register`                                   | Public, rate limited        | Create a bcrypt-hashed account and session                                                       |
| `POST /api/auth/login`                                      | Public, rate limited        | Create a session after password verification                                                     |
| `POST /api/auth/logout`                                     | Session                     | Revoke current session                                                                           |
| `GET /api/me`                                               | Session                     | Current public profile                                                                           |
| `POST /api/auth/forgot-password`                            | Public, rate limited        | Send a one-time reset link when the account exists                                               |
| `POST /api/auth/reset-password`                             | Reset token                 | Update password and revoke sessions                                                              |
| `GET/POST /api/workspaces`                                  | Session                     | List memberships / create a Free workspace                                                       |
| `GET/POST /api/workspaces/:workspaceId/channels`            | Member / channel manager    | List visible channels / create one                                                               |
| `PATCH/DELETE /api/channels/:channelId`                     | Channel manager             | Rename/describe or delete a channel; body includes workspace ID                                  |
| `GET/POST /api/channels/:channelId/messages`                | Member                      | Paginated read / persist a message; POST carries workspace ID and optional idempotency client ID |
| `PATCH/DELETE /api/messages/:messageId`                     | Author or permitted manager | Edit own message / soft-delete a message                                                         |
| `GET /api/workspaces/:workspaceId/members`                  | Member                      | List workspace members                                                                           |
| `POST/GET /api/workspaces/:workspaceId/invitations`         | Owner/admin                 | Send email invitation / list pending invitations                                                 |
| `POST /api/invitations/accept`                              | Session + matching email    | Accept a valid invitation token                                                                  |
| `PATCH/DELETE /api/workspaces/:workspaceId/members/:userId` | Owner/admin                 | Change a role or remove a non-owner member                                                       |
| `GET /api/workspaces/:workspaceId/billing`                  | Member                      | Current sanitized plan, limits, and usage                                                        |
| `POST /api/workspaces/:workspaceId/billing/checkout`        | Owner                       | Begin a server-priced Stripe checkout                                                            |
| `POST /api/workspaces/:workspaceId/billing/portal`          | Owner                       | Open the Stripe billing portal                                                                   |
| `POST /api/webhooks/stripe`                                 | Stripe signature            | Idempotent subscription synchronization                                                          |
| `POST /api/contact`, `POST /api/waitlist`                   | Public, rate limited        | Persist contact and waitlist forms                                                               |

Errors use safe JSON messages and appropriate 4xx/5xx status codes. Internal exception details are logged server-side only.
