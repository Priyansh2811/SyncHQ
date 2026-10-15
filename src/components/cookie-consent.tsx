"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function subscribeConsent(callback: () => void) {
  window.addEventListener("synchq:consent-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("synchq:consent-change", callback);
    window.removeEventListener("storage", callback);
  };
}

function getConsent() {
  if (typeof window === "undefined") return "unset";
  return localStorage.getItem("synchq-consent") ?? "unset";
}

function enableAnalytics() {
  if (
    process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER !== "google" ||
    !process.env.NEXT_PUBLIC_ANALYTICS_ID ||
    window.gtag
  )
    return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
    process.env.NEXT_PUBLIC_ANALYTICS_ID
  )}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = (...args: unknown[]) => {
    window.dataLayer?.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", process.env.NEXT_PUBLIC_ANALYTICS_ID, {
    anonymize_ip: true,
  });
}

export function CookieConsent() {
  const [mounted, setMounted] = useState(false);

  const choice = useSyncExternalStore(
    subscribeConsent,
    getConsent,
    () => "unset"
  );

  const [prefs, setPrefs] = useState(false);
  const [forceOpen, setForceOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const open = () => {
      setForceOpen(true);
      setPrefs(true);
    };
    window.addEventListener("synchq:cookie-settings", open);
    return () => window.removeEventListener("synchq:cookie-settings", open);
  }, []);

  useEffect(() => {
    if (choice === "accepted") enableAnalytics();
  }, [choice]);

  function save(value: "accepted" | "rejected") {
    localStorage.setItem("synchq-consent", value);
    setForceOpen(false);
    window.dispatchEvent(new Event("synchq:consent-change"));
  }

  // Do not render anything until after client mounting to eliminate SSR hydration mismatches
  if (!mounted || (choice !== "unset" && !forceOpen)) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      aria-modal="false"
      style={{
        position: "fixed",
        zIndex: 60,
        bottom: 16,
        left: 16,
        width: "min(450px,calc(100% - 32px))",
        background: "#fff",
        border: "1px solid #d9d9d0",
        borderRadius: 9,
        boxShadow: "0 8px 30px #0002",
        padding: 18,
      }}
    >
      <b style={{ fontSize: 15 }}>Your privacy matters</b>
      <p
        style={{
          fontSize: 13,
          lineHeight: 1.55,
          color: "#77776e",
          margin: "8px 0 14px",
        }}
      >
        Essential cookies keep you signed in. Optional analytics help us
        understand how the site is used. You can change your choice at any time.
      </p>
      {prefs && (
        <p style={{ fontSize: 12, color: "#77776e" }}>
          Essential: always on. Analytics: optional and only loaded after you
          accept.
        </p>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => save("accepted")} className="button small">
          Accept analytics
        </button>
        <button
          onClick={() => save("rejected")}
          className="button secondary small"
        >
          Reject optional
        </button>
        <button
          onClick={() => setPrefs(!prefs)}
          className="button secondary small"
        >
          {prefs ? "Hide preferences" : "Preferences"}
        </button>
      </div>
    </div>
  );
}

export function track(
  event: string,
  properties?: Record<string, string | number>
) {
  if (
    typeof window !== "undefined" &&
    localStorage.getItem("synchq-consent") === "accepted" &&
    window.gtag
  )
    window.gtag("event", event, properties);
}

export function Analytics() {
  const path = usePathname();
  useEffect(() => {
    if (localStorage.getItem("synchq-consent") === "accepted")
      track("page_view", { page_path: path });
  }, [path]);
  return null;
}