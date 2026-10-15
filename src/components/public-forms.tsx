"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
function DbForm({ kind }: { kind: "contact" | "waitlist" }) {
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const body = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch(`/api/${kind}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Please try again in a moment.");
      return;
    }
    setSent(true);
  }
  if (sent)
    return (
      <div className="form-success" role="status">
        {kind === "contact" ? (
          "Thanks for getting in touch. Your note is with our team."
        ) : (
          <>
            You’re on the list.{" "}
            <Link href="/thank-you" style={{ textDecoration: "underline" }}>
              See you soon.
            </Link>
          </>
        )}
      </div>
    );
  return (
    <form className="plain-form" onSubmit={submit}>
      {kind === "contact" && (
        <>
          <div>
            <label htmlFor="name">Your name</label>
            <input id="name" name="name" required maxLength={100} />
          </div>
          <div>
            <label htmlFor="subject">Subject</label>
            <input id="subject" name="subject" required maxLength={160} />
          </div>
        </>
      )}
      <div>
        <label htmlFor="email">Email address</label>
        <input id="email" name="email" type="email" required maxLength={320} />
      </div>
      {kind === "contact" && (
        <div>
          <label htmlFor="message">How can we help?</label>
          <textarea
            id="message"
            name="message"
            required
            minLength={10}
            maxLength={10000}
          />
        </div>
      )}
      {error && (
        <p role="alert" style={{ color: "#a74436", fontSize: 13, margin: 0 }}>
          {error}
        </p>
      )}
      <button disabled={busy} className="button">
        {busy
          ? "Sending…"
          : kind === "contact"
            ? "Send message"
            : "Join the waitlist"}
      </button>
    </form>
  );
}
export function ContactForm() {
  return <DbForm kind="contact" />;
}
export function WaitlistForm() {
  return <DbForm kind="waitlist" />;
}
