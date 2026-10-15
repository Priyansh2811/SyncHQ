"use client";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
export function ForgotForm() {
  const [done, setDone] = useState(false),
    [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const email = new FormData(e.currentTarget).get("email");
    const r = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const d = await r.json();
    if (!r.ok) {
      setError(d.error ?? "Please try again");
      return;
    }
    setDone(true);
  }
  return (
    <section className="token-card">
      <div className="eyebrow">Account recovery</div>
      <h1>Reset your password</h1>
      {done ? (
        <p role="status" className="muted">
          If an account exists for that email, a reset link is on its way.
        </p>
      ) : (
        <form onSubmit={submit} className="token-form">
          <p className="muted">
            Enter your account email and we’ll send a one-time reset link.
          </p>
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input id="email" name="email" type="email" required />
          </div>
          {error && <p role="alert">{error}</p>}
          <button className="button">Send reset link</button>
        </form>
      )}
      <Link href="/login">Back to sign in</Link>
    </section>
  );
}
export function ResetForm() {
  const search = useSearchParams(),
    token = search.get("token"),
    router = useRouter();
  const [error, setError] = useState(""),
    [done, setDone] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const password = new FormData(e.currentTarget).get("password");
    const r = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const d = await r.json();
    if (!r.ok) {
      setError(d.error ?? "This link is invalid or expired");
      return;
    }
    setDone(true);
    router.push("/login");
  }
  return (
    <section className="token-card">
      <div className="eyebrow">Account recovery</div>
      <h1>Choose a new password</h1>
      {done ? (
        <p role="status">Password updated. You can now sign in.</p>
      ) : token ? (
        <form onSubmit={submit} className="token-form">
          <div className="field">
            <label htmlFor="password">New password</label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={10}
              maxLength={72}
              required
              autoComplete="new-password"
            />
          </div>
          {error && <p role="alert">{error}</p>}
          <button className="button">Update password</button>
        </form>
      ) : (
        <p role="alert">
          This reset link is missing its token. Request another from the{" "}
          <Link href="/forgot-password">password reset page</Link>.
        </p>
      )}
    </section>
  );
}
export function InvitationAccept({ token }: { token: string }) {
  const router = useRouter();
  const [status, setStatus] = useState("Checking your sign-in…");
  const [signedIn, setSignedIn] = useState(false);
  const [error, setError] = useState("");
  const next = `/invite/${token}`;
  useEffect(() => {
    fetch("/api/me").then((r) => {
      setSignedIn(r.ok);
      setStatus(
        r.ok
          ? "You are signed in. Accept to join the workspace."
          : "Sign in or create an account with the invited email.",
      );
    });
  }, []);
  async function accept() {
    const r = await fetch("/api/invitations/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const d = await r.json();
    if (!r.ok) {
      setError(
        d.error === "NOT_FOUND"
          ? "This invitation is expired, revoked, already used, or belongs to a different email account."
          : (d.error ?? "Could not accept this invitation."),
      );
      return;
    }
    router.push(`/w/${d.workspace.slug}`);
  }
  return (
    <section className="token-card">
      <div className="eyebrow">Workspace invitation</div>
      <h1>Join your team on SyncHQ</h1>
      <p className="muted">{status}</p>
      {error && <p role="alert">{error}</p>}
      {signedIn ? (
        <button className="button" onClick={accept}>
          Accept invitation
        </button>
      ) : (
        <div className="invite-auth-links">
          <Link
            className="button"
            href={`/login?next=${encodeURIComponent(next)}`}
          >
            Sign in
          </Link>
          <Link href={`/register?next=${encodeURIComponent(next)}`}>
            Create an account with the invited email
          </Link>
        </div>
      )}
    </section>
  );
}
