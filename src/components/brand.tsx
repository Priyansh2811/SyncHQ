import Link from "next/link";
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="SyncHQ home"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        fontWeight: 750,
        letterSpacing: "-.04em",
        fontSize: 19,
        color: light ? "#f7f7f2" : "#24241f",
      }}
    >
      <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="15" fill="#bb553d" />
        <path
          d="M18 21h28M18 32h20M18 43h14"
          stroke="#fff9ef"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx="46" cy="43" r="5" fill="#e8ba73" />
      </svg>
      <span>
        Sync<span style={{ color: light ? "#d7a88f" : "#bb553d" }}>HQ</span>
      </span>
    </Link>
  );
}
