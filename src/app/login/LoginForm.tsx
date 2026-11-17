"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, LockKeyhole, Mail } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function LoginForm() {
  const [email, setEmail] = useState("bikashananda40@gmail.com");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const result = await authClient.signIn.magicLink({
        email: email.trim().toLowerCase(),
        callbackURL: "/workspace",
      });
      if (result.error) {
        setError("We could not send the sign-in link. Please check your connection and try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("The sign-in service could not be reached. Please try again in a moment.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return <div className="login-success" role="status" aria-live="polite">
      <span className="login-success-icon"><CheckCircle2 size={22} /></span>
      <strong>Check your inbox</strong>
      <span>If this is the authorized owner address, a secure sign-in link has been sent. It expires in five minutes.</span>
      <button className="login-resend" type="button" onClick={() => setSent(false)}>Use a different address</button>
    </div>;
  }

  return <form className="login-form" onSubmit={submit}>
    <label htmlFor="owner-email">Owner email address</label>
    <div className="login-input-wrap">
      <Mail size={17} aria-hidden="true" />
      <input id="owner-email" type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} required value={email} onChange={(event) => setEmail(event.target.value)} />
    </div>
    {error ? <p className="login-error" role="alert">{error}</p> : null}
    <button type="submit" disabled={pending}>
      {pending ? "Sending secure link…" : <>Send secure sign-in link <ArrowRight size={16} /></>}
    </button>
    <div className="login-security"><LockKeyhole size={14} /><span>Private owner access · One-time link · No password stored</span></div>
    <p className="login-hint">Only the authorized owner account can access this workspace. The link is single-use and expires after five minutes.</p>
  </form>;
}
