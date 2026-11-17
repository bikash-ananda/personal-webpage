"use client";

import { useState } from "react";
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
    const result = await authClient.signIn.magicLink({
      email: email.trim().toLowerCase(),
      callbackURL: "/workspace",
    });
    setPending(false);
    if (result.error) {
      setError("We could not send the sign-in link. Check the address or try again later.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return <div className="login-notice" role="status">
      <strong>Check your email.</strong>
      <span>If the address is authorized, a one-time sign-in link has been sent. The link expires in five minutes.</span>
    </div>;
  }

  return <form className="login-form" onSubmit={submit}>
    <label htmlFor="owner-email">Owner email address</label>
    <input id="owner-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
    {error ? <p className="login-error" role="alert">{error}</p> : null}
    <button type="submit" disabled={pending}>{pending ? "Sending secure link…" : "Email me a sign-in link"}</button>
    <p className="login-hint">Only the authorized owner account can access this workspace. No password is stored in the app.</p>
  </form>;
}
