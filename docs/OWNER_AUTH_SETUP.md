# Owner identity and authentication

## Account policy

- The only permitted owner identity is `bikashananda40@gmail.com`.
- The private workspace is protected by server-side session checks; hiding navigation is not treated as authorization.
- Public self-registration is not available. New user creation is rejected unless the normalized email exactly matches the owner allowlist.
- Sign-in uses a one-time email magic link, valid for five minutes. Tokens are stored hashed and the sign-in/verification endpoints are rate-limited.
- The workspace is not available until all required secrets and services are configured. Missing configuration fails closed.

## Implementation

Authentication is implemented with Better Auth, its magic-link plugin, and a dedicated PostgreSQL database. Email is delivered through an SMTP transport. Session state is stored server-side, allowing multiple devices and future session revocation.

The workspace server layout checks the session and owner email on every protected route render. The service worker deliberately does not cache `/workspace`, `/api`, `/login`, or `/auth` requests.

## Required environment

Copy `.env.example` into a local environment file and set real values only in the local secret store or the dedicated VPS environment file:

- `BETTER_AUTH_URL`: canonical application origin, eventually `https://bikashbhattarai.com.np`.
- `BETTER_AUTH_SECRET`: cryptographically random secret of at least 32 characters. Generate with `openssl rand -base64 32`.
- `DATABASE_URL`: connection string for the dedicated Personal OS PostgreSQL database and least-privilege application role.
- `SMTP_URL`: SMTP connection URL for the sender account.
- `EMAIL_FROM`: verified sender identity accepted by the SMTP provider.

Do not send passwords, SMTP credentials, database passwords, or generated secrets in chat or commit them to Git.

## Database initialization

After setting the environment variables against the dedicated development database, generate/apply the Better Auth schema using the Better Auth CLI:

```powershell
npx auth@latest migrate
```

Run this against a disposable development database first. Production migration and deployment require backup/restore validation and explicit approval.

## Not yet production-enabled

The code and login UI are present, but authentication is not live until a dedicated PostgreSQL database is provisioned, the Better Auth schema is migrated, SMTP delivery is verified, and end-to-end login/session/logout tests pass. No VPS or DNS changes have been made.
