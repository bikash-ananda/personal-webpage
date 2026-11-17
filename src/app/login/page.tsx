import LoginForm from "./LoginForm";
import { isAuthConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return <main className="login-page">
    <section className="login-card">
      <div className="brand-mark login-mark">BB</div>
      <div className="eyebrow">PRIVATE OWNER ACCESS</div>
      <h1>Welcome back.</h1>
      <p className="login-description">Sign in to your personal workspace with a secure, one-time email link.</p>
      {isAuthConfigured() ? <LoginForm /> : <div className="login-notice">
        <strong>Login setup is not finished yet.</strong>
        <span>The database, secure application secret and private email delivery settings must be configured before sign-in can be enabled.</span>
      </div>}
      <div className="login-foot">BIKASH PERSONAL OS · PRIVATE WORKSPACE</div>
    </section>
  </main>;
}
