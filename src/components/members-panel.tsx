"use client";
import { useCallback, useEffect, useState, FormEvent } from "react";
import { UserPlus, Trash2, Mail, RefreshCw } from "lucide-react";
type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
};
type Invite = { id: string; email: string; role: string; expiresAt: string };
export function MembersPanel({ workspaceSlug }: { workspaceSlug: string }) {
  const [wid, setWid] = useState(""),
    [members, setMembers] = useState<Member[]>([]),
    [invites, setInvites] = useState<Invite[]>([]),
    [role, setRole] = useState("MEMBER"),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [canManage, setCanManage] = useState(false);
  const load = useCallback(async () => {
    const ws = await fetch("/api/workspaces").then((r) => r.json());
    const w = ws.workspaces?.find(
      (x: { slug: string }) => x.slug === workspaceSlug,
    );
    if (!w) return;
    setWid(w.id);
    setCanManage(["OWNER", "ADMIN"].includes(w.role));
    const [m, i] = await Promise.all([
      fetch(`/api/workspaces/${w.id}/members`).then((r) => r.json()),
      fetch(`/api/workspaces/${w.id}/invitations`).then((r) => r.json()),
    ]);
    if (m.members) setMembers(m.members);
    if (i.invitations) setInvites(i.invitations);
  }, [workspaceSlug]);
  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);
  async function invite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const r = await fetch(`/api/workspaces/${wid}/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), role }),
    });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) {
      setError(
        d.error === "PLAN_LIMIT"
          ? "This workspace has reached its member limit."
          : d.error === "CONFLICT"
            ? "This person is already a member or has a pending invitation."
            : (d.error ?? "Invitation could not be sent."),
      );
      return;
    }
    setNotice("Invitation sent. It expires in 7 days.");
    e.currentTarget.reset();
    await load();
  }
  async function updateMember(id: string, next: string) {
    setError("");
    const r = await fetch(`/api/workspaces/${wid}/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: next }),
    });
    const d = await r.json();
    if (!r.ok) {
      setError(d.error ?? "Role could not be updated.");
      return;
    }
    setMembers((old) =>
      old.map((m) => (m.id === id ? { ...m, role: next } : m)),
    );
  }
  async function remove(id: string, name: string) {
    if (!confirm(`Remove ${name} from this workspace?`)) return;
    const r = await fetch(`/api/workspaces/${wid}/members/${id}`, {
      method: "DELETE",
    });
    const d = await r.json();
    if (!r.ok) {
      setError(d.error ?? "Member could not be removed.");
      return;
    }
    setMembers((old) => old.filter((m) => m.id !== id));
  }
  async function revoke(id: string) {
    const r = await fetch(`/api/workspaces/${wid}/invitations/${id}`, {
      method: "DELETE",
    });
    const d = await r.json();
    if (!r.ok) {
      setError(d.error ?? "Invitation could not be revoked.");
      return;
    }
    setInvites((old) => old.filter((i) => i.id !== id));
  }
  return (
    <div className="members-panel">
      <div className="panel-heading">
        <div>
          <b>
            {members.length} active{" "}
            {members.length === 1 ? "member" : "members"}
          </b>
          <p>
            Owners have full access. Admins manage the workspace and members.
          </p>
        </div>
        <button className="button secondary small" onClick={load}>
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>
      {canManage && (
        <form className="invite-form" onSubmit={invite}>
          <div className="invite-title">
            <UserPlus size={17} />
            <b>Invite someone</b>
          </div>
          <div className="invite-controls">
            <div className="field">
              <label htmlFor="invite-email">Email address</label>
              <input
                id="invite-email"
                name="email"
                type="email"
                required
                maxLength={320}
                placeholder="teammate@company.com"
              />
            </div>
            <div className="field">
              <label htmlFor="invite-role">Role</label>
              <select
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="MEMBER">Member</option>
                <option value="GUEST">Guest</option>
                {members.some((m) => m.role === "OWNER") && (
                  <option value="ADMIN">Admin</option>
                )}
              </select>
            </div>
            <button className="button" disabled={busy}>
              <Mail size={15} />
              {busy ? "Sending…" : "Send invite"}
            </button>
          </div>
          {notice && (
            <p role="status" className="inline-notice">
              {notice}
            </p>
          )}
        </form>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <div className="member-table">
        <div className="table-head">
          <span>PERSON</span>
          <span>ROLE</span>
          <span>JOINED</span>
          <span className="sr-only">Actions</span>
        </div>
        {members.map((m) => (
          <div className="member-row" key={m.id}>
            <div className="member-person">
              <i>{m.name.slice(0, 1).toUpperCase()}</i>
              <span>
                <b>{m.name}</b>
                <small>{m.email}</small>
              </span>
            </div>
            <div>
              {m.role === "OWNER" ? (
                <span className="role-badge">Owner</span>
              ) : canManage ? (
                <select
                  aria-label={`Role for ${m.name}`}
                  value={m.role}
                  onChange={(e) => updateMember(m.id, e.target.value)}
                >
                  <option value="ADMIN">Admin</option>
                  <option value="MEMBER">Member</option>
                  <option value="GUEST">Guest</option>
                </select>
              ) : (
                <span className="role-badge">{m.role.toLowerCase()}</span>
              )}
            </div>
            <time>
              {new Intl.DateTimeFormat(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              }).format(new Date(m.joinedAt))}
            </time>
            <div>
              {canManage && m.role !== "OWNER" && (
                <button
                  className="icon-button remove-member"
                  aria-label={`Remove ${m.name}`}
                  title={`Remove ${m.name}`}
                  onClick={() => remove(m.id, m.name)}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {canManage && invites.length > 0 && (
        <section className="pending-invites">
          <h2>Pending invitations</h2>
          {invites.map((i) => (
            <div className="invite-row" key={i.id}>
              <span>
                <b>{i.email}</b>
                <small>
                  {i.role.toLowerCase()} · expires{" "}
                  {new Date(i.expiresAt).toLocaleDateString()}
                </small>
              </span>
              <button
                className="button secondary small"
                onClick={() => revoke(i.id)}
              >
                Revoke
              </button>
            </div>
          ))}
        </section>
      )}
      <style>{membersCss}</style>
    </div>
  );
}
const membersCss = `.members-panel{margin-top:34px}.panel-heading{display:flex;justify-content:space-between;align-items:start;gap:20px}.panel-heading b{font-size:15px}.panel-heading p{font-size:12px;color:var(--muted);margin:6px 0}.invite-form{margin:28px 0 24px;padding:20px;background:var(--white);border:1px solid var(--line);border-radius:7px}.invite-title{display:flex;align-items:center;gap:8px;font-size:13px}.invite-controls{display:grid;grid-template-columns:minmax(180px,1fr) 140px auto;align-items:end;gap:12px;margin-top:16px}.invite-controls .button{height:44px}.field select,.member-row select{min-height:40px;border:1px solid #d9d9d0;border-radius:5px;background:var(--white);color:var(--ink);padding:0 9px;font-size:12px}.member-table{margin-top:18px;border-top:1px solid var(--line)}.table-head,.member-row{display:grid;grid-template-columns:minmax(220px,1fr) 150px 150px 44px;gap:10px;align-items:center}.table-head{font-size:10px;color:var(--muted);letter-spacing:.08em;padding:11px 9px;border-bottom:1px solid var(--line)}.member-row{min-height:67px;border-bottom:1px solid var(--line);padding:8px 9px;font-size:12px}.member-person{display:flex;align-items:center;gap:10px;min-width:0}.member-person>i{font-style:normal;height:32px;width:32px;display:grid;place-items:center;background:#e7ded1;color:#705d44;border-radius:50%;font-weight:700}.member-person span,.invite-row span{display:grid;gap:4px;min-width:0}.member-person b,.invite-row b{font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.member-person small,.invite-row small{font-size:10px;color:var(--muted);overflow-wrap:anywhere}.member-row time{font-size:11px;color:var(--muted)}.role-badge{font-size:11px;color:var(--muted);text-transform:capitalize}.remove-member{opacity:.5}.remove-member:hover{opacity:1;color:#a74436}.pending-invites{margin-top:38px}.pending-invites h2{font-size:17px}.invite-row{min-height:58px;display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid var(--line);padding:8px 3px}.inline-notice{font-size:12px;color:#315f4f}.form-error{color:#a74436;font-size:13px}@media(max-width:680px){.invite-controls{grid-template-columns:1fr 1fr}.invite-controls .field:first-child{grid-column:1/-1}.invite-controls .button{grid-column:1/-1}.table-head{display:none}.member-row{grid-template-columns:minmax(0,1fr) auto;row-gap:5px;padding-block:12px}.member-row>time{grid-column:1;grid-row:2}.member-row>div:last-child{grid-column:2;grid-row:1}.member-row>div:nth-child(2){grid-column:2;grid-row:2}.member-person small{max-width:55vw}}`;
