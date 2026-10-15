export default function Loading() {
  return (
    <main
      role="status"
      aria-label="Loading"
      style={{
        minHeight: "40vh",
        display: "grid",
        placeItems: "center",
        color: "var(--muted)",
      }}
    >
      Loading SyncHQ…
    </main>
  );
}
