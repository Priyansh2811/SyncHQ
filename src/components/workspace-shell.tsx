"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { Brand } from "@/components/brand";
import {
  Menu,
  Hash,
  Lock,
  Settings,
  Users,
  CreditCard,
  Plus,
  LogOut,
  Moon,
  Sun,
  ChevronDown,
  PanelLeftClose,
} from "lucide-react";
import { io } from "socket.io-client";
import { track } from "@/components/cookie-consent";
type Workspace = { id: string; name: string; slug: string; role: string };
type Channel = {
  id: string;
  name: string;
  slug: string;
  isPrivate: boolean;
  description: string | null;
};
export function WorkspaceShell({
  workspace,
  role,
  channels,
  children,
  user,
}: {
  workspace: Workspace;
  role: string;
  channels: Channel[];
  children: React.ReactNode;
  user: { id: string; name: string; email: string };
}) {
  const pathname = usePathname(),
    router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [drawer, setDrawer] = useState(false);
  const [dark, setDark] = useState(false);
  const [channelOpen, setChannelOpen] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [channelError, setChannelError] = useState("");
  const [busy, setBusy] = useState(false);
  const [connection, setConnection] = useState("Connecting");
  useEffect(() => {
    fetch("/api/workspaces")
      .then((r) => r.json())
      .then((d) => setWorkspaces(d.workspaces ?? []));
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        const theme =
          d.user?.preferences?.theme ?? localStorage.getItem("synchq-theme");
        setDark(theme === "dark");
      });
  }, []);

  useEffect(() => {
    const endpoint = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!endpoint) {
      queueMicrotask(() => setConnection("Realtime unavailable"));
      return;
    }
    const socket = io(endpoint, {
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 500,
    });
    socket.on("connect", () => {
      setConnection("Connected");
      socket.emit("workspace:join", workspace.id, (ack: { ok: boolean }) => {
        if (!ack.ok) {
          setConnection("Access revoked");
          socket.disconnect();
          router.replace("/login");
        }
      });
    });
    socket.on("disconnect", () =>
      setConnection(navigator.onLine ? "Reconnecting" : "Offline"),
    );
    socket.on("connect_error", () =>
      setConnection(navigator.onLine ? "Reconnecting" : "Offline"),
    );
    socket.on("channel:created", () => router.refresh());
    socket.on("channel:updated", () => router.refresh());
    socket.on("channel:deleted", () => router.refresh());
    socket.on("session:ended", () => {
      socket.disconnect();
      router.replace("/login");
    });
    socket.on("membership:revoked", (x: { userId: string }) => {
      if (x.userId === user.id) {
        socket.disconnect();
        router.replace("/login");
      }
    });
    const off = () => setConnection("Offline"),
      on = () => setConnection(socket.connected ? "Connected" : "Reconnecting");
    window.addEventListener("offline", off);
    window.addEventListener("online", on);
    return () => {
      window.removeEventListener("offline", off);
      window.removeEventListener("online", on);
      socket.disconnect();
    };
  }, [workspace.id, user.id, router]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawer(false);
        setChannelOpen(false);
      }
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        document
          .querySelector<HTMLInputElement>("[data-channel-search]")
          ?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  const activeChannel = pathname.match(/\/c\/([^/]+)/)?.[1];
  function setTheme() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("synchq-theme", next ? "dark" : "light");
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) =>
        fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: user.name,
            preferences: {
              ...(d.user?.preferences ?? {}),
              theme: next ? "dark" : "light",
            },
          }),
        }),
      );
  }
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }
  async function createChannel(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setChannelError("");
    const res = await fetch(`/api/workspaces/${workspace.id}/channels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: channelName }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setChannelError(
        data.error === "PLAN_LIMIT"
          ? "Your current plan has reached its channel limit."
          : (data.error ?? "Could not create channel"),
      );
      return;
    }
    track("channel_created", { workspace_id: workspace.id });
    setChannelOpen(false);
    setChannelName("");
    router.push(`/w/${workspace.slug}/c/${data.channel.slug}`);
    router.refresh();
  }
  const navigation = (
    <>
      <div className="side-section">
        <div className="side-heading">
          <span>CHANNELS</span>
          {["OWNER", "ADMIN"].includes(role) && (
            <button
              className="icon-button"
              aria-label="Create channel"
              onClick={() => setChannelOpen(true)}
            >
              <Plus size={15} />
            </button>
          )}
        </div>
        <label className="channel-search">
          <span className="sr-only">Filter channels</span>
          <input
            data-channel-search
            placeholder="Find a channel…"
            onChange={(e) => {
              const q = e.target.value.toLowerCase();
              document
                .querySelectorAll<HTMLElement>("[data-channel]")
                .forEach(
                  (el) => (el.hidden = !el.dataset.channel?.includes(q)),
                );
            }}
          />
          <kbd>⌘ K</kbd>
        </label>
        <nav aria-label="Workspace channels" className="channel-list">
          {channels.map((ch) => (
            <Link
              key={ch.id}
              data-channel={`${ch.name} ${ch.slug}`.toLowerCase()}
              className={`channel-link ${activeChannel === ch.slug ? "active" : ""}`}
              onClick={() => setDrawer(false)}
              href={`/w/${workspace.slug}/c/${ch.slug}`}
            >
              {ch.isPrivate ? <Lock size={14} /> : <Hash size={15} />}
              <span>{ch.name}</span>
            </Link>
          ))}
          {channels.length === 0 && (
            <p className="sidebar-empty">No channels yet.</p>
          )}
        </nav>
      </div>
      <div className="side-section">
        <div className="side-heading">
          <span>WORKSPACE</span>
        </div>
        <nav className="utility-nav">
          <Link href={`/w/${workspace.slug}/members`}>
            <Users size={16} />
            Members
          </Link>
          <Link href={`/w/${workspace.slug}/settings`}>
            <Settings size={16} />
            Settings
          </Link>
          <Link href={`/w/${workspace.slug}/billing`}>
            <CreditCard size={16} />
            Billing
          </Link>
        </nav>
      </div>
      <div className="sidebar-bottom">
        <div className="user-avatar" aria-hidden="true">
          {user.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="user-ident">
          <b>{user.name}</b>
          <span>{role.toLowerCase()}</span>
        </div>
        <button className="icon-button" aria-label="Sign out" onClick={logout}>
          <LogOut size={16} />
        </button>
      </div>
    </>
  );
  return (
    <MotionConfig reducedMotion="user">
      <div className={`app-root ${dark ? "app-dark" : ""}`}>
        <div className="app-layout">
          <aside className="sidebar">
            <div className="sidebar-top">
              <Brand />
              <button
                className="workspace-select"
                aria-label="Select workspace"
                onClick={() =>
                  document.getElementById("workspace-menu")?.focus()
                }
              >
                {workspace.name}
                <ChevronDown size={15} />
              </button>
              <select
                id="workspace-menu"
                aria-label="Switch workspace"
                value={workspace.slug}
                onChange={(e) => router.push(`/w/${e.target.value}`)}
              >
                {workspaces.map((w) => (
                  <option key={w.id} value={w.slug}>
                    {w.name}
                  </option>
                ))}
              </select>
              <Link className="add-workspace" href="/onboarding/workspace">
                <Plus size={14} />
                Create workspace
              </Link>
            </div>
            {navigation}
          </aside>
          <AnimatePresence>
            {drawer && (
              <motion.div
                className="mobile-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDrawer(false)}
              >
                <motion.aside
                  className="mobile-drawer"
                  initial={{ x: -280 }}
                  animate={{ x: 0 }}
                  exit={{ x: -280 }}
                  transition={{ duration: 0.18 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="drawer-brand">
                    <Brand />
                    <button
                      className="icon-button"
                      onClick={() => setDrawer(false)}
                      aria-label="Close menu"
                    >
                      <PanelLeftClose />
                    </button>
                  </div>
                  {navigation}
                </motion.aside>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="app-content">
            <header className="app-topbar">
              <button
                className="icon-button mobile-menu"
                onClick={() => setDrawer(true)}
                aria-label="Open navigation"
              >
                <Menu />
              </button>
              <div className="breadcrumbs">
                <Link href={`/w/${workspace.slug}`}>{workspace.name}</Link>
                {activeChannel && (
                  <>
                    <span>/</span>
                    <span>
                      {channels.find((c) => c.slug === activeChannel)?.name ??
                        activeChannel}
                    </span>
                  </>
                )}
                {pathname.endsWith("/members") && (
                  <>
                    <span>/</span>
                    <span>Members</span>
                  </>
                )}
                {pathname.endsWith("/settings") && (
                  <>
                    <span>/</span>
                    <span>Settings</span>
                  </>
                )}
                {pathname.endsWith("/billing") && (
                  <>
                    <span>/</span>
                    <span>Billing</span>
                  </>
                )}
              </div>
              <div className="top-actions">
                <span
                  className={`connection-pill ${connection === "Connected" ? "is-connected" : ""}`}
                  title="Socket connection status"
                >
                  <i />
                  {connection}
                </span>
                <button
                  className="icon-button"
                  aria-label={dark ? "Use light mode" : "Use dark mode"}
                  onClick={setTheme}
                >
                  {dark ? <Sun size={17} /> : <Moon size={17} />}
                </button>
                <div className="workspace-quick-switch">
                  <select
                    aria-label="Switch workspace"
                    value={workspace.slug}
                    onChange={(e) => router.push(`/w/${e.target.value}`)}
                  >
                    {workspaces.map((w) => (
                      <option key={w.id} value={w.slug}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </header>
            <main className="app-main" key={pathname}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.14 }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
        {channelOpen && (
          <div
            className="modal-backdrop"
            role="presentation"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setChannelOpen(false);
            }}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-channel-title"
              className="modal"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <button
                className="modal-x icon-button"
                onClick={() => setChannelOpen(false)}
                aria-label="Close dialog"
              >
                ×
              </button>
              <div className="eyebrow">New channel</div>
              <h2 id="create-channel-title">Bring a conversation together.</h2>
              <form onSubmit={createChannel}>
                <div className="field">
                  <label htmlFor="channel-name">Channel name</label>
                  <input
                    autoFocus
                    id="channel-name"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    minLength={1}
                    maxLength={80}
                    required
                    placeholder="e.g. launch-planning"
                  />
                </div>
                {channelError && (
                  <p role="alert" className="form-error">
                    {channelError}
                  </p>
                )}
                <div className="modal-actions">
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => setChannelOpen(false)}
                  >
                    Cancel
                  </button>
                  <button className="button" disabled={busy}>
                    {busy ? "Creating…" : "Create channel"}
                  </button>
                </div>
              </form>
            </motion.section>
          </div>
        )}
        <style>{appCss}</style>
      </div>
    </MotionConfig>
  );
}
const appCss = `.app-root{min-height:100dvh;background:var(--paper);color:var(--ink)}.app-layout{min-height:100dvh;display:grid;grid-template-columns:252px minmax(0,1fr)}.sidebar{position:sticky;top:0;height:100dvh;background:#efefe8;border-right:1px solid var(--line);display:flex;flex-direction:column;padding:18px 13px 12px}.sidebar-top{position:relative;padding:2px 8px 21px;border-bottom:1px solid #ddddd4}.workspace-select{width:100%;display:flex;justify-content:space-between;align-items:center;border:0;background:transparent;color:var(--ink);font-size:14px;font-weight:700;margin-top:18px;padding:7px 0;cursor:pointer}.sidebar-top select{position:absolute;top:44px;left:0;opacity:0;width:100%;height:32px;cursor:pointer}.add-workspace{display:flex;align-items:center;gap:6px;color:var(--muted);font-size:12px;margin-top:3px}.add-workspace:hover{color:var(--ink)}.side-section{padding:20px 1px 10px}.side-heading{height:22px;display:flex;justify-content:space-between;align-items:center;padding:0 9px;color:#838379;font-size:10px;font-weight:750;letter-spacing:.1em}.icon-button{height:34px;width:34px;border:0;background:transparent;color:var(--muted);border-radius:6px;display:grid;place-items:center;cursor:pointer}.icon-button:hover{background:#e3e3da;color:var(--ink)}.channel-search{height:34px;margin:7px 7px 9px;border:1px solid #deded6;border-radius:5px;display:flex;align-items:center;padding:0 7px;background:#f7f7f2}.channel-search input{border:0;outline:none!important;box-shadow:none!important;background:transparent;color:var(--ink);width:100%;font-size:11px;min-width:0}.channel-search kbd{color:#929288;font-size:10px;white-space:nowrap}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.channel-list{display:grid;gap:2px}.channel-link,.utility-nav a{min-height:35px;display:flex;align-items:center;gap:9px;border-radius:5px;padding:0 10px;color:#696a61;font-size:13px}.channel-link:hover,.utility-nav a:hover{background:#e6e6dd;color:var(--ink)}.channel-link.active{background:#dfdfd4;color:var(--ink);font-weight:650}.sidebar-empty{font-size:12px;color:var(--muted);padding:0 10px}.utility-nav{display:grid;gap:2px}.sidebar-bottom{margin-top:auto;border-top:1px solid #ddddd4;padding:12px 5px 4px;display:flex;align-items:center;gap:9px}.user-avatar{width:31px;height:31px;border-radius:50%;background:#d6e0d5;color:#315f4f;display:grid;place-items:center;font-weight:700;font-size:12px}.user-ident{display:grid;gap:3px;flex:1;min-width:0}.user-ident b{font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.user-ident span{font-size:10px;color:var(--muted);text-transform:capitalize}.app-content{min-width:0}.app-topbar{height:58px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 26px;background:var(--paper)}.breadcrumbs{display:flex;align-items:center;gap:10px;font-size:13px}.breadcrumbs span:nth-child(2){color:#a5a59b}.breadcrumbs a:hover{text-decoration:underline;text-underline-offset:3px}.top-actions{display:flex;align-items:center;gap:10px}.connection-pill{display:flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:99px;padding:5px 9px;font-size:10px;color:var(--muted)}.connection-pill i{height:6px;width:6px;background:#54816b;border-radius:50%}.workspace-quick-switch{display:none}.app-main{max-width:1480px;margin:auto;min-width:0}.mobile-menu,.mobile-overlay{display:none}.modal-backdrop{position:fixed;z-index:50;inset:0;background:#18191555;display:grid;place-items:center;padding:16px}.modal{position:relative;background:var(--white);color:var(--ink);width:min(100%,450px);border:1px solid var(--line);border-radius:9px;padding:28px;box-shadow:0 15px 50px #0002}.modal h2{font-size:24px;letter-spacing:-.04em;margin:9px 0 22px}.modal-x{position:absolute;right:14px;top:14px;font-size:24px}.modal form{display:grid;gap:18px}.modal-actions{display:flex;justify-content:flex-end;gap:8px}.form-error{color:#a74436;font-size:13px}.app-dark .sidebar{background:#1e1f1b;border-color:var(--line)}.app-dark .sidebar-top,.app-dark .sidebar-bottom{border-color:#373831}.app-dark .channel-search{background:#252621;border-color:#42433b}.app-dark .channel-link,.app-dark .utility-nav a{color:#b1b2a8}.app-dark .channel-link:hover,.app-dark .channel-link.active,.app-dark .utility-nav a:hover,.app-dark .icon-button:hover{background:#30312b;color:#f4f4ed}.app-dark .modal{background:#242520}.app-dark .user-avatar{background:#3b4d3f;color:#d8e5d9}.app-dark .connection-pill{border-color:#393a33}@media(max-width:900px){.app-layout{grid-template-columns:220px minmax(0,1fr)}.sidebar{padding-inline:9px}.app-topbar{padding-inline:18px}}@media(max-width:680px){.app-layout{display:block}.sidebar{display:none}.mobile-menu{display:grid}.app-topbar{height:54px;padding:0 10px}.breadcrumbs{font-size:12px;gap:6px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.connection-pill{font-size:0;padding:7px}.connection-pill i{height:7px;width:7px}.top-actions{gap:4px}.workspace-quick-switch{display:block}.workspace-quick-switch select{max-width:120px;background:transparent;color:var(--ink);border:1px solid var(--line);border-radius:5px;padding:6px;font-size:11px}.mobile-overlay{display:block;position:fixed;z-index:40;inset:0;background:#0006}.mobile-drawer{width:min(285px,85vw);height:100%;background:#efefe8;padding:15px;display:flex;flex-direction:column;overflow:auto}.app-dark .mobile-drawer{background:#1e1f1b}.drawer-brand{display:flex;justify-content:space-between;align-items:center;padding-bottom:14px;border-bottom:1px solid var(--line)}.mobile-drawer .side-section{padding-top:13px}.mobile-drawer .sidebar-bottom{margin-top:auto}.app-main{padding-bottom:30px}}`;
