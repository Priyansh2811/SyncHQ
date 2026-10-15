"use client";
export default function WorkspaceError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main style={{ padding: 40 }}>
      <h1>Workspace unavailable</h1>
      <p className="muted">
        We couldn’t load this workspace. Check your connection and try again.
      </p>
      <button className="button" onClick={reset}>
        Reconnect
      </button>
    </main>
  );
}
