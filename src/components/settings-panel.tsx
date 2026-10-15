"use client";
import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Lock, Hash, Trash2 } from "lucide-react";
type Channel = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isPrivate: boolean;
};
export function SettingsPanel({ workspaceSlug }: { workspaceSlug: string }) {
  const router = useRouter();
  const [tab, setTab] = useState("profile"),
    [workspaceId, setWorkspaceId] = useState(""),
    [workspaceName, setWorkspaceName] = useState(""),
    [profileName, setProfileName] = useState(""),
    [channels, setChannels] = useState<Channel[]>([]),
    [prefs, setPrefs] = useState({
      emailUpdates: true,
      productTips: false,
      theme: "light",
    }),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [canManage, setCanManage] = useState(false);
  useEffect(() => {
    (async () => {
      const ws = await fetch("/api/workspaces").then((r) => r.json());
      const w = ws.workspaces?.find(
        (x: { slug: string }) => x.slug === workspaceSlug,
      );
      if (!w) return;
      setWorkspaceId(w.id);
      setWorkspaceName(w.name);
      setCanManage(["OWNER", "ADMIN"].includes(w.role));
      const [me, ch] = await Promise.all([
        fetch("/api/profile").then((r) => r.json()),
        fetch(`/api/workspaces/${w.id}/channels`).then((r) => r.json()),
      ]);
      setProfileName(me.user?.name ?? "");
      if (ch.channels) setChannels(ch.channels);
      if (me.user?.preferences)
        setPrefs({
          emailUpdates: me.user.preferences.emailUpdates ?? true,
          productTips: me.user.preferences.productTips ?? false,
          theme: me.user.preferences.theme ?? "light",
        });
    })();
  }, [workspaceSlug]);
  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    await save(
      "/api/profile",
      { name: profileName, preferences: prefs },
      "Profile and preferences saved.",
    );
  }
  async function saveWorkspace(e: FormEvent) {
    e.preventDefault();
    await save(
      `/api/workspaces/${workspaceId}`,
      { name: workspaceName },
      "Workspace name saved.",
    );
    router.refresh();
  }
  async function save(url: string, body: object, success: string) {
    setBusy(true);
    setError("");
    setNotice("");
    const r = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) {
      setError(d.error ?? "Could not save changes");
      return;
    }
    setNotice(success);
  }
  async function changePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    const r = await fetch("/api/profile/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: f.get("currentPassword"),
        newPassword: f.get("newPassword"),
      }),
    });
    const d = await r.json();
    if (!r.ok) {
      setError(d.error ?? "Password could not be changed");
      return;
    }
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }
  async function addChannel(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const r = await fetch(`/api/workspaces/${workspaceId}/channels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description") || undefined,
        isPrivate: form.get("private") === "on",
      }),
    });
    const d = await r.json();
    if (!r.ok) {
      setError(
        d.error === "PLAN_LIMIT"
          ? "This workspace has reached its channel limit."
          : (d.error ?? "Could not create channel"),
      );
      return;
    }
    e.currentTarget.reset();
    setChannels((old) => [...old, d.channel]);
  }
  async function updateChannel(channel: Channel) {
    const name = prompt("Channel name", channel.name);
    if (name === null) return;
    const description = prompt(
      "Channel description",
      channel.description ?? "",
    );
    if (description === null) return;
    const r = await fetch(`/api/channels/${channel.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, name, description }),
    });
    const d = await r.json();
    if (!r.ok) {
      setError(d.error ?? "Could not update channel");
      return;
    }
    setChannels((old) => old.map((c) => (c.id === channel.id ? d.channel : c)));
    router.refresh();
  }
  async function deleteChannel(channel: Channel) {
    if (
      !confirm(
        `Delete #${channel.name} and its messages? This action cannot be undone.`,
      )
    )
      return;
    const r = await fetch(
      `/api/channels/${channel.id}?workspaceId=${workspaceId}`,
      { method: "DELETE" },
    );
    const d = await r.json();
    if (!r.ok) {
      setError(d.error ?? "Could not delete channel");
      return;
    }
    setChannels((old) => old.filter((c) => c.id !== channel.id));
    router.refresh();
  }
  return (
    <div className="settings-panel">
      <nav className="settings-tabs" aria-label="Settings">
        <button
          aria-current={tab === "profile" ? "page" : undefined}
          onClick={() => setTab("profile")}
        >
          Profile
        </button>
        <button
          aria-current={tab === "workspace" ? "page" : undefined}
          onClick={() => setTab("workspace")}
        >
          Workspace
        </button>
        <button
          aria-current={tab === "channels" ? "page" : undefined}
          onClick={() => setTab("channels")}
        >
          Channels
        </button>
        <button
          aria-current={tab === "security" ? "page" : undefined}
          onClick={() => setTab("security")}
        >
          Security
        </button>
        <button
          aria-current={tab === "preferences" ? "page" : undefined}
          onClick={() => setTab("preferences")}
        >
          Preferences
        </button>
      </nav>
      <section className="settings-card">
        {tab === "profile" && (
          <>
            <h2>Profile</h2>
            <p className="muted">
              Your name appears in workspace messages and member lists.
            </p>
            <form className="settings-form" onSubmit={saveProfile}>
              <div className="field">
                <label htmlFor="profile-name">Display name</label>
                <input
                  id="profile-name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                  maxLength={100}
                />
              </div>
              <button className="button" disabled={busy}>
                Save profile
              </button>
            </form>
          </>
        )}
        {tab === "workspace" && (
          <>
            <h2>Workspace details</h2>
            <p className="muted">
              The name is visible to everyone in this workspace.
            </p>
            {canManage ? (
              <form className="settings-form" onSubmit={saveWorkspace}>
                <div className="field">
                  <label htmlFor="workspace-name">Workspace name</label>
                  <input
                    id="workspace-name"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    required
                    minLength={2}
                    maxLength={80}
                  />
                </div>
                <button className="button" disabled={busy}>
                  Save workspace
                </button>
              </form>
            ) : (
              <p>
                You need workspace management permission to change these
                details.
              </p>
            )}
          </>
        )}
        {tab === "channels" && (
          <>
            <h2>Channels</h2>
            <p className="muted">
              Manage channel names and descriptions. Removing a channel removes
              its conversation history.
            </p>
            {canManage && (
              <form className="new-channel-form" onSubmit={addChannel}>
                <div className="field">
                  <label htmlFor="new-channel-name">Name</label>
                  <input
                    name="name"
                    id="new-channel-name"
                    required
                    maxLength={80}
                  />
                </div>
                <div className="field">
                  <label htmlFor="new-channel-description">Description</label>
                  <input
                    name="description"
                    id="new-channel-description"
                    maxLength={500}
                  />
                </div>
                <label className="check-field">
                  <input name="private" type="checkbox" />
                  Private channel
                </label>
                <button className="button small">
                  <Plus size={15} />
                  Add channel
                </button>
              </form>
            )}
            {error && (
              <p role="alert" className="settings-error">
                {error}
              </p>
            )}
            <div className="settings-channel-list">
              {channels.map((c) => (
                <div key={c.id}>
                  <span>
                    {c.isPrivate ? <Lock size={14} /> : <Hash size={15} />}
                    <b>{c.name}</b>
                    {c.description && <small>{c.description}</small>}
                  </span>
                  {canManage && (
                    <div>
                      <button
                        className="button secondary small"
                        onClick={() => updateChannel(c)}
                      >
                        Edit
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Delete #${c.name}`}
                        onClick={() => deleteChannel(c)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
        {tab === "security" && (
          <>
            <h2>Security</h2>
            <p className="muted">
              Choose a strong password. Changing it will sign out all sessions
              so you can sign in with the new password.
            </p>
            <form className="settings-form" onSubmit={changePassword}>
              <div className="field">
                <label htmlFor="current-password">Current password</label>
                <input
                  id="current-password"
                  type="password"
                  name="currentPassword"
                  required
                  maxLength={72}
                  autoComplete="current-password"
                />
              </div>
              <div className="field">
                <label htmlFor="new-password">New password</label>
                <input
                  id="new-password"
                  type="password"
                  name="newPassword"
                  required
                  minLength={10}
                  maxLength={72}
                  autoComplete="new-password"
                />
              </div>
              <button className="button">Update password</button>
            </form>
          </>
        )}
        {tab === "preferences" && (
          <>
            <h2>Preferences</h2>
            <p className="muted">
              Control account email and occasional product notes.
            </p>
            <form className="settings-form" onSubmit={saveProfile}>
              <div className="check-option">
                <label>
                  <input
                    type="checkbox"
                    checked={prefs.emailUpdates}
                    onChange={(e) =>
                      setPrefs({ ...prefs, emailUpdates: e.target.checked })
                    }
                  />
                  Email me about workspace invitations and account changes
                </label>
              </div>
              <div className="check-option">
                <label>
                  <input
                    type="checkbox"
                    checked={prefs.productTips}
                    onChange={(e) =>
                      setPrefs({ ...prefs, productTips: e.target.checked })
                    }
                  />
                  Send me occasional product tips
                </label>
              </div>
              <button className="button" disabled={busy}>
                Save preferences
              </button>
            </form>
            <button
              className="button secondary small cookie-preference-button"
              onClick={() =>
                window.dispatchEvent(new Event("synchq:cookie-settings"))
              }
            >
              Cookie and analytics preferences
            </button>
          </>
        )}
        {notice && (
          <p role="status" className="settings-notice">
            <Check size={15} />
            {notice}
          </p>
        )}
        {error && tab !== "channels" && (
          <p role="alert" className="settings-error">
            {error}
          </p>
        )}
      </section>
      <style>{settingsCss}</style>
    </div>
  );
}
const settingsCss = `.settings-panel{margin-top:34px;display:grid;grid-template-columns:175px minmax(0,1fr);gap:26px}.settings-tabs{display:grid;align-content:start;gap:4px}.settings-tabs button{border:0;background:transparent;color:var(--muted);text-align:left;padding:10px 12px;border-radius:5px;font-size:13px;cursor:pointer}.settings-tabs button[aria-current=page]{background:#e9e9e1;color:var(--ink);font-weight:650}.settings-card{max-width:750px;background:var(--white);border:1px solid var(--line);border-radius:7px;padding:25px}.settings-card h2{font-size:18px;margin:0 0 8px}.settings-card>p{font-size:13px;line-height:1.6}.settings-form{display:grid;gap:17px;margin-top:22px;max-width:480px}.settings-form .button{justify-self:start}.settings-notice{display:flex;align-items:center;gap:7px;color:#315f4f;font-size:12px;margin-top:18px}.settings-error{color:#a74436;font-size:13px}.check-field,.check-option label{display:flex;align-items:center;gap:9px;font-size:12px;color:var(--ink)}.new-channel-form{display:grid;grid-template-columns:1fr 1.2fr auto auto;gap:10px;align-items:end;padding:15px;background:#f5f5ef;border:1px solid var(--line);border-radius:6px}.new-channel-form .button{height:38px}.settings-channel-list{margin-top:16px}.settings-channel-list>div{min-height:51px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--line);gap:12px}.settings-channel-list span,.settings-channel-list>div>div{display:flex;align-items:center;gap:9px;min-width:0}.settings-channel-list span>small{color:var(--muted);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.settings-channel-list b{font-size:12px}.app-dark .settings-tabs button[aria-current=page],.app-dark .new-channel-form{background:#2b2c26}.app-dark .settings-card .field input{color:var(--ink);background:#242520;border-color:#494a42}@media(max-width:760px){.settings-panel{grid-template-columns:1fr;gap:15px}.settings-tabs{display:flex;overflow:auto;gap:3px}.settings-tabs button{white-space:nowrap;padding:9px}.settings-card{padding:19px}.new-channel-form{grid-template-columns:1fr 1fr}.new-channel-form .check-field{grid-column:1}.new-channel-form .button{grid-column:2;grid-row:3}.settings-channel-list span>small{display:none}}`;
