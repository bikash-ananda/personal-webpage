# Integration Strategy — Bikash Personal AI OS

**Canonical repository:** `bikash-ananda/personal-webpage`  
**Development branch:** `integration/bikash-personal-ai-os`  
**Canonical domain:** `bikashbhattarai.com.np`  
**Product direction:** one unified personal digital workspace.

## Product decision

The personal website and AI assistant are one product, one repository and one coherent design system. The public website is the public-facing identity layer; the private workspace is the authenticated operating environment.

The legacy website is not the architectural foundation. Its content, profile information, project descriptions and selected assets may be extracted. Old page structure, visual patterns, scripts and obsolete hosting assumptions may be discarded. Git history and the untouched main branch preserve rollback/reference value.

The My-assistance repository is a source of product requirements, tested domain logic, security patterns, useful components and implementation knowledge—not a mandate to copy its architecture unchanged. Reuse only after code review and compatibility checks.

## Repository study

### personal-webpage

The current main branch is a small static portfolio with HTML/CSS/JavaScript, profile assets, admin/chat-related pages and a GitHub workflow. Its legacy cPanel-style README is not an appropriate deployment specification for the target product.

### My-assistance

The current main branch contains a Next.js 16 / React 19 / TypeScript frontend, FastAPI service, SQLite persistence, owner authentication, projects, conversations, agent profiles, tasks, reminders, approval-bound tools, audit records, CRM, early Gmail/Calendar OAuth groundwork, PWA/browser speech, telemetry groundwork, Docker Compose and architecture/security documentation.

Its own implementation notes indicate that several integrations and operational capabilities remain incomplete. Existing code is a useful accelerator, not a production-ready complete agent platform.

## Target product

### Public website
- `/`: high-quality personal home page.
- `/about`: biography, education, experience and capabilities.
- `/projects`: public project portfolio.
- `/research`: research and learning.
- `/writing`: articles and publications.
- `/contact`: professional contact.

### Private workspace
- `/workspace`: daily command center and briefing.
- `/workspace/assistant`: conversational and voice interface.
- `/workspace/agents`: agent directory and control.
- `/workspace/projects`: project registry and progress.
- `/workspace/tasks`: tasks, plans and reminders.
- `/workspace/inbox`: communication triage and drafts.
- `/workspace/research`: research jobs and sources.
- `/workspace/knowledge`: files, notes and memory.
- `/workspace/automations`: schedules and workflows.
- `/workspace/approvals`: privileged action review.
- `/workspace/activity`: audit and run history.
- `/workspace/integrations`: accounts, tools and permissions.
- `/workspace/settings`: models, privacy and preferences.

Public and private surfaces share product identity but must be isolated by server-side authorization, data scopes and API policy.

## Architecture authority

The target architecture is specified in:
- `docs/PRODUCT_ARCHITECTURE.md`
- `docs/DELIVERY_ROADMAP.md`

Those documents supersede any older implementation assumptions in the source repository. In particular, do not assume SQLite, a particular agent framework, or the current FastAPI service boundaries are permanent architecture decisions. Choose the production data and workflow design based on durability, security, backup/restore, local development and operational simplicity.

## Integration rules

1. Keep `main` unchanged while building on `integration/bikash-personal-ai-os`.
2. Do not blindly copy the old website or My-assistance frontend. Build the new product experience against the target architecture.
3. Extract and verify public profile content and assets; do not migrate private, stale, duplicated or unsafe content.
4. Review My-assistance backend modules and tests individually. Reuse proven domain logic and tests where they fit; redesign where the target architecture requires it.
5. Establish reproducible local development, CI, database migrations, secret scanning and security tests before staging.
6. Do not add providers, OAuth credentials, external integrations or autonomous tools without explicit configuration and least-privilege scopes.
7. Do not claim integrations are live merely because UI or scaffolding exists.

## Safety and deployment

- No production DNS, Caddy, firewall, shared VPS, container, volume or live-hosting changes during architecture and implementation work.
- The shared VPS hosts unrelated projects and a shared host-level Caddy service. Any future deployment must be isolated and must not start another Caddy instance or perform host-wide cleanup.
- Use a dedicated application directory, compose project, network, database, volumes and secrets.
- Keep credentials, OAuth tokens, database files, backups and logs out of Git.
- Default-deny tool permissions. External communications, production deployment, destructive actions, financial operations, DNS and physical actuation require explicit, scoped approval.
- Keep `My-assistance` available as a reference repository until the new implementation has been validated; it does not need to become a runtime dependency.

## Immediate execution order

1. Complete file/workflow/deployment inventory for both repositories.
2. Confirm exact domain's current hosting/DNS target and deployment workflow without modifying it.
3. Establish the new app skeleton and design system on the integration branch.
4. Implement public identity and private workspace shell with authentication boundaries.
5. Selectively port tested capabilities and build the agent runtime, model gateway, memory and approval system.
6. Add integrations incrementally, beginning read-only.
7. Run CI, security, migration and restore tests.
8. Deploy to isolated staging and obtain acceptance before production cutover.
