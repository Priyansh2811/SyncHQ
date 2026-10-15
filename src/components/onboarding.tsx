"use client";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/brand";
import { track } from "@/components/cookie-consent";
export function Onboarding() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch("/api/me").then((r) => {
      if (!r.ok) router.replace("/login");
    });
  }, [router]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const name = new FormData(e.currentTarget).get("name");
    const r = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await r.json();
    setBusy(false);
    if (!r.ok) {
      setError(data.error ?? "Workspace could not be created");
      return;
    }
    track("workspace_created");
    router.push(`/w/${data.workspace.slug}`);
    router.refresh();
  }
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <section
        style={{
          width: "min(100%,460px)",
          background: "white",
          padding: 38,
          border: "1px solid var(--line)",
          borderRadius: 10,
        }}
      >
        <Brand />
        <div className="eyebrow" style={{ marginTop: 42 }}>
          A space for your team
        </div>
        <h1 style={{ fontSize: 31, letterSpacing: "-.04em" }}>
          Name your workspace
        </h1>
        <p className="muted" style={{ lineHeight: 1.6 }}>
          Your workspace is where your team’s channels and conversations live.
        </p>
        <form
          onSubmit={submit}
          style={{ display: "grid", gap: 18, marginTop: 24 }}
        >
          <div className="field">
            <label htmlFor="workspace-name">Workspace name</label>
            <input
              id="workspace-name"
              name="name"
              required
              minLength={2}
              maxLength={80}
              placeholder="Acme Studio"
            />
          </div>
          {error && (
            <p role="alert" style={{ color: "#a74436" }}>
              {error}
            </p>
          )}
          <button className="button" disabled={busy}>
            {busy ? "Creating…" : "Create workspace"}
          </button>
        </form>
      </section>
    </main>
  );
}
