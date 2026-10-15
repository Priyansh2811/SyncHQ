"use client";
import Link from "next/link";
import { Brand } from "@/components/brand";
export function MarketingHeader() {
  return (
    <header
      style={{
        height: 76,
        borderBottom: "1px solid var(--line)",
        background: "var(--paper)",
      }}
    >
      <div
        className="shell"
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Brand />
        <nav
          aria-label="Main navigation"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 26,
            fontSize: 14,
          }}
          className="marketing-nav"
        >
          <Link href="/features">Features</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link className="nav-login" href="/login">
            Log in
          </Link>
          <Link className="button small" href="/register">
            Get started
          </Link>
        </div>
      </div>
      <style>{`.marketing-nav a:hover,.nav-login:hover{text-decoration:underline;text-underline-offset:4px}@media(max-width:650px){.marketing-nav{display:none!important}.nav-login{display:none}}`}</style>
    </header>
  );
}
export function Footer() {
  return (
    <footer
      style={{
        marginTop: 100,
        background: "#24241f",
        color: "#f7f7f2",
        padding: "54px 0 26px",
      }}
    >
      <div className="shell">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 40,
            flexWrap: "wrap",
          }}
        >
          <div>
            <Brand light />
            <p
              style={{
                maxWidth: 300,
                color: "#bcbcb2",
                lineHeight: 1.7,
                fontSize: 14,
                marginTop: 16,
              }}
            >
              Clear conversations make room for good work.
            </p>
          </div>
          <div
            style={{ display: "flex", gap: 60, flexWrap: "wrap", fontSize: 14 }}
          >
            <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
              <b>Explore</b>
              <Link href="/features">Features</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/faq">FAQ</Link>
            </div>
            <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
              <b>Company</b>
              <Link href="/contact">Contact</Link>
              <Link href="/waitlist">Join the waitlist</Link>
              <Link href="/login">Sign in</Link>
              <button
                className="cookie-settings"
                onClick={() =>
                  window.dispatchEvent(new Event("synchq:cookie-settings"))
                }
              >
                Cookie settings
              </button>
            </div>
          </div>
        </div>
        <div
          style={{
            borderTop: "1px solid #484840",
            marginTop: 42,
            paddingTop: 18,
            color: "#aaa99f",
            fontSize: 12,
          }}
        >
          © {new Date().getFullYear()} SyncHQ
        </div>
      </div>
      <style>{`.cookie-settings{border:0;background:none;padding:0;color:inherit;text-align:left;font-size:14px;cursor:pointer}.cookie-settings:hover{text-decoration:underline}`}</style>
    </footer>
  );
}
