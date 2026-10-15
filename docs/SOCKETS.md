# Socket.io and Redis

Run the dedicated process with `npm run socket`; it listens on `SOCKET_PORT` (default 4001). It verifies the HTTP-only session cookie against the `Session` table before accepting a socket. `workspace:join` checks active membership. `channel:join` checks workspace membership and private-channel authorization before constructing the room from the validated workspace and channel IDs.

Room names are `workspace:{workspaceId}` and `workspace:{workspaceId}:channel:{channelId}`. The server supports reconnects and Socket.io connection-state recovery. Messages are sent over authenticated HTTP so persistence and RBAC happen before fan-out; an optimistic `clientId` reconciles the socket event with the request response and suppresses duplicate retries.

The socket process uses `@socket.io/redis-adapter` with `REDIS_URL`. Next route handlers publish room events with `@socket.io/redis-emitter`, so horizontally scaled web and socket processes share event delivery. `NEXT_PUBLIC_SOCKET_URL` is the browser-facing persistent socket endpoint. Configure the exact application origin in the socket CORS allowlist. Cookies must be available to that endpoint; a reverse proxy under the same site is recommended. In production the socket process fails startup without Redis.

WebSocket infrastructure must support persistent Node processes and WebSocket upgrades. A serverless request handler is not a substitute for this service.
