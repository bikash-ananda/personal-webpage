# Bikash Personal OS

A unified public identity and private digital workspace for Bikash Bhattarai.

**Canonical domain:** https://bikashbhattarai.com.np  
**Repository:** https://github.com/bikash-ananda/personal-webpage  
**Active development branch:** `integration/bikash-personal-ai-os`

## Product surfaces

- Public profile: biography, work, projects, research, writing and contact.
- Private workspace: command centre, assistant, specialist agents, projects, tasks, research, knowledge, automations, approvals, activity and integrations.
- Android-first installable PWA, responsive across mobile and desktop.
- Owner-only authentication using short-lived email magic links.

## Current implementation

- Next.js App Router, TypeScript and responsive UI foundation.
- PWA manifest, service worker, offline fallback and install prompt.
- Better Auth magic-link login restricted to `bikashananda40@gmail.com`.
- Server-side session and owner checks on the private workspace.
- PostgreSQL-backed auth configuration, persistent rate-limit storage and owner-scoped domain schema migration.
- Append-only activity event journal at database level.

The application is **not production-ready yet**. Database provisioning, Better Auth migration, SMTP configuration, end-to-end authentication tests, domain data APIs, model gateway and agent runtime remain incomplete. The UI preview does not imply that specialist agents or dashboard figures are live.

## Local development

Requirements: Node.js 22+ and npm.

```powershell
npm install
npm run dev
```

Open http://localhost:3000.

Validation:

```powershell
npm run typecheck
npm run lint
npm run build
```

See:
- [Owner authentication setup](docs/OWNER_AUTH_SETUP.md)
- [Product architecture](docs/PRODUCT_ARCHITECTURE.md)
- [Delivery roadmap](docs/DELIVERY_ROADMAP.md)
- [Integration plan](docs/INTEGRATION_PLAN.md)
- [Implementation status](docs/IMPLEMENTATION_STATUS.md)

## Database setup order

1. Provision a dedicated disposable PostgreSQL database for local development.
2. Set the local-only variables from `.env.example`.
3. Run the Better Auth schema migration as documented in [Owner authentication setup](docs/OWNER_AUTH_SETUP.md).
4. Apply `db/migrations/0001_personal_os_core.sql` after Better Auth creates its `user` table.
5. Run schema checks and authentication tests before connecting any real user data.

Never point these migrations at another project database. Do not commit secrets or real environment files.

## Deployment safety

No VPS deployment, DNS update, Caddy change, firewall change, or production service modification has been performed. Future deployment must use a dedicated directory, isolated Compose project/network/volumes, a dedicated database and a loopback-only application port. The shared host Caddy and all unrelated projects must remain untouched. Deployment requires successful CI, tested database backup/restore, end-to-end auth verification and explicit approval.
