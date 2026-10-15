"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { AnimatePresence, motion } from "framer-motion";
import {
  Pencil,
  Trash2,
  CornerDownLeft,
  LoaderCircle,
  ChevronUp,
} from "lucide-react";
import { track } from "@/components/cookie-consent";
type Message = {
  id: string;
  clientId: string | null;
  workspaceId: string;
  channelId: string;
  authorId: string;
  content: string;
  editedAt: string | Date | null;
  deletedAt: string | Date | null;
  createdAt: string | Date;
  author: { id: string; name: string; avatarUrl: string | null };
};
export function MessageArea({
  workspaceId,
  channel,
  initialMessages,
  role,
  currentUserId,
}: {
  workspaceId: string;
  channel: {
    id: string;
    name: string;
    description: string | null;
    isPrivate: boolean;
  };
  initialMessages: Message[];
  role: string;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [online, setOnline] = useState(true);
  const [connected, setConnected] = useState(false);
  const [more, setMore] = useState(initialMessages.length === 50);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  useEffect(() => {
    queueMicrotask(() => setOnline(navigator.onLine));
    const onlineNow = () => setOnline(true),
      offline = () => setOnline(false);
    window.addEventListener("online", onlineNow);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", onlineNow);
      window.removeEventListener("offline", offline);
    };
  }, []);
  useEffect(() => {
    const endpoint = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!endpoint) return;
    const socket = io(endpoint, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;
    socket.on("connect", () => {
      setConnected(true);
      socket.emit("workspace:join", workspaceId);
      socket.emit("channel:join", { workspaceId, channelId: channel.id });
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));
    const upsert = (row: Message) =>
      setMessages((old) => {
        const at = old.findIndex(
          (m) =>
            m.id === row.id || (row.clientId && m.clientId === row.clientId),
        );
        if (at < 0) return [...old, row];
        const copy = [...old];
        copy[at] = row;
        return copy;
      });
    socket.on("message:created", upsert);
    socket.on("message:updated", upsert);
    socket.on("message:deleted", (x: { id: string }) =>
      setMessages((old) =>
        old.map((m) =>
          m.id === x.id
            ? { ...m, deletedAt: new Date(), content: "[deleted]" }
            : m,
        ),
      ),
    );
    return () => {
      socket.emit("channel:leave", { workspaceId, channelId: channel.id });
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [workspaceId, channel.id]);
  const lastMessageId = messages[messages.length - 1]?.id;
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [lastMessageId]);
  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = content.trim();
    if (!text || busy) return;
    setError("");
    setBusy(true);
    const clientId = crypto.randomUUID();
    const optimistic: Message = {
      id: `optimistic:${clientId}`,
      clientId,
      workspaceId,
      channelId: channel.id,
      authorId: currentUserId,
      content: text,
      editedAt: null,
      deletedAt: null,
      createdAt: new Date(),
      author: { id: currentUserId, name: "You", avatarUrl: null },
    };
    setMessages((old) => [...old, optimistic]);
    setContent("");
    const res = await fetch(`/api/channels/${channel.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, content: text, clientId }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMessages((old) =>
        old.filter((m) => m.id !== optimistic.id && m.clientId !== clientId),
      );
      setContent(text);
      setError(
        data.error === "PLAN_LIMIT"
          ? "Your plan limit has been reached."
          : (data.error ?? "Message could not be sent. Try again."),
      );
      return;
    }
    setMessages((old) => {
      const at = old.findIndex((m) => m.clientId === clientId);
      if (at < 0) return [...old, data.message];
      const copy = [...old];
      copy[at] = data.message;
      return copy;
    });
    track("message_sent", {
      workspace_id: workspaceId,
      channel_id: channel.id,
    });
  }
  async function older() {
    if (!more || loadingMore) return;
    setLoadingMore(true);
    const first = messages.find((m) => !m.id.startsWith("optimistic:"));
    if (!first) {
      setLoadingMore(false);
      return;
    }
    const res = await fetch(
      `/api/channels/${channel.id}/messages?workspaceId=${workspaceId}&before=${first.id}`,
    );
    const data = await res.json();
    if (res.ok) {
      setMessages((old) => [
        ...data.messages.filter(
          (m: Message) => !old.some((o) => o.id === m.id),
        ),
        ...old,
      ]);
      setMore(data.messages.length === 50);
    }
    setLoadingMore(false);
  }
  async function saveEdit(id: string) {
    const value = editText.trim();
    if (!value) return;
    const r = await fetch(`/api/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, content: value }),
    });
    const d = await r.json();
    if (!r.ok) {
      setError(d.error ?? "Edit failed");
      return;
    }
    setMessages((old) => old.map((m) => (m.id === id ? d.message : m)));
    setEditing(null);
  }
  async function remove(id: string) {
    if (!window.confirm("Delete this message?")) return;
    const r = await fetch(`/api/messages/${id}?workspaceId=${workspaceId}`, {
      method: "DELETE",
    });
    const d = await r.json();
    if (!r.ok) {
      setError(d.error ?? "Delete failed");
      return;
    }
    setMessages((old) =>
      old.map((m) =>
        m.id === id ? { ...m, content: "[deleted]", deletedAt: new Date() } : m,
      ),
    );
  }
  return (
    <section className="conversation">
      <header className="conversation-header">
        <div>
          <h1>
            {channel.isPrivate ? "🔒 " : "# "}
            {channel.name}
          </h1>
          {channel.description && <p>{channel.description}</p>}
        </div>
        <div
          className={`live-status ${!online ? "offline" : connected ? "live" : "reconnecting"}`}
        >
          <i />
          {!online
            ? "Offline · reconnecting"
            : connected
              ? "Live updates"
              : "Reconnecting"}
        </div>
      </header>
      <div
        className="message-list"
        ref={list}
        aria-live="polite"
        aria-label={`${channel.name} messages`}
      >
        {more && (
          <button className="load-more" disabled={loadingMore} onClick={older}>
            <ChevronUp size={15} />
            {loadingMore
              ? "Loading earlier messages…"
              : "Load earlier messages"}
          </button>
        )}
        {messages.length === 0 ? (
          <div className="conversation-empty">
            <div className="empty-mark">↗</div>
            <h2>A good place to begin.</h2>
            <p>
              Start the conversation in <b>#{channel.name}</b>.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.article
                key={message.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.13 }}
                className={`message-row ${message.deletedAt ? "deleted" : ""}`}
              >
                <div className="message-avatar" aria-hidden="true">
                  {message.author.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="message-content">
                  <div className="message-meta">
                    <b>
                      {message.authorId === currentUserId
                        ? "You"
                        : message.author.name}
                    </b>
                    <time dateTime={new Date(message.createdAt).toISOString()}>
                      {new Intl.DateTimeFormat(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                        month: "short",
                        day: "numeric",
                      }).format(new Date(message.createdAt))}
                    </time>
                    {message.editedAt && (
                      <span className="edited-label">edited</span>
                    )}
                  </div>
                  {editing === message.id ? (
                    <div className="edit-box">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        maxLength={10000}
                        aria-label="Edit message"
                      />
                      <button
                        className="button small"
                        onClick={() => saveEdit(message.id)}
                      >
                        Save
                      </button>
                      <button
                        className="button secondary small"
                        onClick={() => setEditing(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p className="message-text">
                      {message.deletedAt
                        ? "This message was deleted."
                        : message.content}
                    </p>
                  )}
                </div>
                {!message.deletedAt && editing !== message.id && (
                  <div className="message-actions">
                    {message.authorId === currentUserId && (
                      <button
                        title="Edit message"
                        aria-label="Edit message"
                        onClick={() => {
                          setEditing(message.id);
                          setEditText(message.content);
                        }}
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    {(message.authorId === currentUserId ||
                      role === "OWNER" ||
                      role === "ADMIN") && (
                      <button
                        title="Delete message"
                        aria-label="Delete message"
                        onClick={() => remove(message.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </motion.article>
            ))}
          </AnimatePresence>
        )}
        <div ref={bottom} />
      </div>
      {error && (
        <p role="alert" className="message-error">
          {error}
        </p>
      )}
      {role === "GUEST" ? (
        <p className="guest-notice">Guest access is read-only.</p>
      ) : (
        <form className="composer" onSubmit={send}>
          <label className="sr-only" htmlFor="composer">
            Message #{channel.name}
          </label>
          <textarea
            id="composer"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder={`Message #${channel.name}`}
            rows={2}
            maxLength={10000}
            disabled={!online}
          />
          <div className="composer-footer">
            <span>Enter to send · Shift + Enter for a new line</span>
            <button
              disabled={busy || !content.trim() || !online}
              aria-label="Send message"
            >
              {busy ? (
                <LoaderCircle className="spin" size={17} />
              ) : (
                <CornerDownLeft size={17} />
              )}
            </button>
          </div>
        </form>
      )}
      <style>{messageCss}</style>
    </section>
  );
}
const messageCss = `.conversation{height:calc(100dvh - 58px);min-height:460px;display:flex;flex-direction:column;max-width:1100px;margin:auto}.conversation-header{padding:20px 32px 15px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:14px}.conversation-header h1{font-size:17px;letter-spacing:-.02em;margin:0}.conversation-header p{font-size:12px;color:var(--muted);margin:5px 0 0}.live-status{font-size:11px;color:var(--muted);display:flex;align-items:center;gap:7px;white-space:nowrap}.live-status i{height:7px;width:7px;background:#54816b;border-radius:50%}.live-status.reconnecting i{background:#bd9251}.live-status.offline i{background:#a74436}.message-list{flex:1;overflow:auto;padding:15px clamp(16px,4vw,54px);scrollbar-gutter:stable}.message-row{display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:12px;padding:12px 8px;border-radius:6px}.message-row:hover{background:#eeeee8}.message-avatar{height:31px;width:31px;border-radius:50%;background:#e8ded0;color:#715d45;display:grid;place-items:center;font-size:12px;font-weight:700}.message-meta{display:flex;align-items:baseline;gap:8px}.message-meta b{font-size:13px}.message-meta time,.edited-label{font-size:10px;color:#929288}.message-text{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px;line-height:1.6;margin:5px 0 0;color:var(--ink)}.deleted .message-text{color:var(--muted);font-style:italic}.message-actions{display:flex;gap:3px;opacity:0;align-self:start}.message-row:hover .message-actions,.message-actions:focus-within{opacity:1}.message-actions button{height:28px;width:28px;display:grid;place-items:center;border:0;border-radius:4px;background:transparent;color:var(--muted);cursor:pointer}.message-actions button:hover{background:#ddd;color:var(--ink)}.load-more{display:flex;align-items:center;gap:6px;margin:6px auto 13px;border:0;background:none;color:var(--muted);font-size:12px;cursor:pointer}.conversation-empty{height:100%;min-height:230px;display:grid;place-content:center;justify-items:center;text-align:center}.empty-mark{height:46px;width:46px;border-radius:12px;display:grid;place-items:center;background:#f4e7e1;color:#bb553d;font-size:25px}.conversation-empty h2{font-size:19px;letter-spacing:-.03em;margin:16px 0 4px}.conversation-empty p{font-size:13px;color:var(--muted);margin:0}.composer{margin:0 clamp(14px,4vw,54px) 22px;border:1px solid #d7d7cd;border-radius:7px;background:var(--white);box-shadow:0 2px 9px #2222080a}.composer textarea{display:block;width:100%;min-height:58px;max-height:200px;resize:vertical;padding:14px 14px 4px;border:0;background:transparent;color:var(--ink);outline:none!important;font-size:13px}.composer-footer{height:35px;padding:0 9px 6px 14px;display:flex;align-items:center;justify-content:space-between;color:var(--muted);font-size:10px}.composer-footer button{height:27px;width:30px;display:grid;place-items:center;border:0;border-radius:5px;background:#315f4f;color:white;cursor:pointer}.composer-footer button:disabled{opacity:.45;cursor:not-allowed}.message-error{margin:0 clamp(14px,4vw,54px) 8px;color:#a74436;font-size:12px}.edit-box{display:flex;gap:6px;flex-wrap:wrap}.edit-box textarea{width:100%;min-height:60px;border:1px solid var(--line);background:var(--white);color:var(--ink);padding:8px;border-radius:5px}.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.app-dark .message-row:hover{background:#20211d}.app-dark .message-actions button:hover{background:#3a3b33}.app-dark .composer{border-color:#494a42}.app-dark .empty-mark{background:#49352e;color:#e6ad95}@media(max-width:680px){.conversation{height:calc(100dvh - 54px);min-height:420px}.conversation-header{padding:14px 14px 12px}.conversation-header h1{font-size:15px}.message-list{padding:8px 10px}.message-row{grid-template-columns:30px minmax(0,1fr) auto;gap:8px;padding:10px 4px}.message-avatar{height:28px;width:28px}.message-actions{opacity:1}.composer{margin:0 10px 10px}.message-error{margin:0 12px 6px}.message-meta{flex-wrap:wrap;gap:5px}.live-status{font-size:10px}}`;
