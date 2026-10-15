"use client";
import { useEffect } from "react";
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main
      style={{
        minHeight: "60vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <section style={{ maxWidth: 500 }}>
        <div className="eyebrow">Something went wrong</div>
        <h1 style={{ fontSize: 36, letterSpacing: "-.05em" }}>
          We couldn’t load this page.
        </h1>
        <p className="muted" style={{ lineHeight: 1.7 }}>
          Your work is safe. Try again, or return to your workspace.
        </p>
        <button className="button" onClick={() => reset()}>
          Try again
        </button>
      </section>
    </main>
  );
}
