"use client";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { track } from "@/components/cookie-consent";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const search = useSearchParams();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "Could not sign you in");
      return;
    }
    const requested = search.get("next");
    const safeNext =
      requested?.startsWith("/") && !requested.startsWith("//")
        ? requested
        : null;
    if (mode === "register") {
      track("registration");
      router.push(
        safeNext?.startsWith("/invite/") ? safeNext : "/onboarding/workspace",
      );
      return;
    }
    const ws = await fetch("/api/workspaces").then((r) => r.json());
    router.push(
      safeNext ??
        (ws.workspaces?.[0]
          ? `/w/${ws.workspaces[0].slug}`
          : "/onboarding/workspace"),
    );
    router.refresh();
  }
  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <Brand />
        <div style={{ marginTop: 44 }}>
          <div className="eyebrow">
            {mode === "login" ? "Welcome back" : "Make room for good work"}
          </div>
          <h1
            style={{
              fontSize: 32,
              letterSpacing: "-.04em",
              margin: "11px 0 8px",
            }}
          >
            {mode === "login" ? "Sign in to SyncHQ" : "Create your account"}
          </h1>
          <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>
            {mode === "login"
              ? "Pick up where your team left off."
              : "Start with a free workspace for your team."}
          </p>
        </div>
        <form
          onSubmit={submit}
          style={{ display: "grid", gap: 18, marginTop: 28 }}
        >
          {mode === "register" && (
            <div className="field">
              <label htmlFor="name">Your name</label>
              <input
                id="name"
                name="name"
                required
                autoComplete="name"
                maxLength={100}
              />
            </div>
          )}
          <div className="field">
            <label htmlFor="email">Work email</label>
            <input
              id="email"
              type="email"
              name="email"
              required
              autoComplete="email"
              maxLength={320}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              required
              minLength={mode === "register" ? 10 : 1}
              maxLength={72}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
            {mode === "register" && (
              <span className="muted" style={{ fontSize: 12 }}>
                Use at least 10 characters.
              </span>
            )}
          </div>
          {error && (
            <p
              role="alert"
              style={{ color: "#a74436", fontSize: 13, margin: 0 }}
            >
              {error}
            </p>
          )}
          <button disabled={busy} className="button" style={{ width: "100%" }}>
            {busy
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>
        {mode === "login" && (
          <div style={{ textAlign: "right", marginTop: 12, fontSize: 13 }}>
            <Link
              href="/forgot-password"
              style={{ textDecoration: "underline" }}
            >
              Forgot password?
            </Link>
          </div>
        )}
        <p
          className="muted"
          style={{ textAlign: "center", fontSize: 13, marginTop: 24 }}
        >
          {mode === "login" ? (
            <>
              New to SyncHQ?{" "}
              <Link
                href="/register"
                style={{ color: "var(--ink)", textDecoration: "underline" }}
              >
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link
                href="/login"
                style={{ color: "var(--ink)", textDecoration: "underline" }}
              >
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
      <style>{`.auth-wrap{min-height:100dvh;display:grid;place-items:center;padding:24px}.auth-card{width:min(100%,430px);padding:40px;background:white;border:1px solid #e8e8df;border-radius:10px;box-shadow:0 10px 40px #2222110a}@media(max-width:500px){.auth-card{padding:28px 22px}}`}</style>
    </main>
  );
}
