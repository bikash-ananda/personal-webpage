# Personal Website + Bikash AI Integration Plan

**Target repository:** `bikash-ananda/personal-webpage`  
**Integration branch:** `integration/bikash-personal-ai-os`  
**Canonical domain:** `bikashbhattarai.com.np`  
**Status:** repository review completed; integration implementation not yet started.

## Decision

Keep `personal-webpage` as the canonical repository and integrate the existing `My-assistance` application into it. Do not create another repository. Do not delete or overwrite the existing website files until their content and assets have been migrated and verified.

## Repository findings

### Existing personal website

The current `personal-webpage` main branch is a small static portfolio (HTML, CSS, JavaScript, profile image, admin/chat-related files and a `.github` directory). The root contains `index.html`, `styles.css`, `script.js`, `profile.jpg.jpg`, `README.txt`, `admin.html`, `admin-icons.html`, `scientific-chatbot.html`, `server-rag.js`, and related files. The current README describes a single-file portfolio and older cPanel-oriented upload steps; deployment configuration must be inspected rather than assumed.

### Existing My-assistance application

The `My-assistance` main branch contains a more substantial, locally oriented application:
- Next.js 16 / React 19 / TypeScript web app under `apps/web`.
- FastAPI service under `services/api`.
- SQLite persistence, owner authentication, projects, conversations, specialist agent profiles, bounded plans, tasks, reminders, approval-bound local tools, audit records, local CRM, read-only Gmail/Calendar OAuth groundwork, PWA/browser speech, and read-only device telemetry.
- Isolated Docker Compose starter with web bound to loopback port 3080, internal API/network, and a dedicated named data volume.
- Operational, architecture, security, model-routing, memory, deployment, and implementation-status documentation.

The README and implementation status explicitly state that live model-provider configuration, Google consent, MCP/GitHub/browser integrations, VPS deployment, native desktop speech, and physical device control are not complete. The repository describes locally implemented features; it is not evidence of production deployment.

## Target product structure

One application and one domain, with public and private areas:

- `/` — public personal portfolio, biography, experience, skills, projects, research and contact.
- `/assistant` — authenticated private AI workspace.
- `/assistant/chat` — conversations and task delegation.
- `/assistant/agents` — specialist agent directory and controls.
- `/assistant/projects` — project registry and status.
- `/assistant/tasks` — tasks, plans and reminders.
- `/assistant/approvals` — exact-action review and approval.
- `/assistant/memory` — owner-controlled memory and knowledge.
- `/assistant/integrations` — explicitly connected accounts and tools.
- `/assistant/settings` — model, privacy, security and usage settings.

The public portfolio must never expose private assistant data, API routes, prompts, credentials, conversation history or owner-only records.

## Integration approach

1. Preserve the current `main` branch unchanged. Work on `integration/bikash-personal-ai-os`.
2. Bring the My-assistance application source into this repository, retaining its existing tests, security controls, scripts, and documentation.
3. Migrate the portfolio content, project descriptions, profile assets, metadata, and useful visual elements into the Next.js public routes. Do not copy obsolete cPanel instructions as active deployment guidance.
4. Keep the existing FastAPI boundary and local-first data model initially. Do not add LangGraph, Letta, PostgreSQL, Redis, or additional services without a measured requirement; the current implementation deliberately defers them.
5. Resolve route, build, environment, and deployment conflicts before changing any live service.
6. Run API tests, frontend typecheck/build, authentication and authorization checks, backup/restore rehearsal, and public/private route checks.
7. Review a staging deployment before changing DNS or the existing hosting route.

## Safety and deployment constraints

- No DNS, Caddy, firewall, port, VPS, container, volume, or live-hosting changes are authorized by this integration plan.
- The user's shared VPS has other active projects and a shared Caddy service. Any future deployment must be isolated, use a read-only host inventory first, and have a rollback plan.
- Keep the assistant's database, environment variables, model credentials, OAuth tokens, backups, and logs private and out of Git.
- Default to local-only operation until a provider and network egress are deliberately configured.
- Read-only actions may run within their approved scopes. External messages, code pushes, production deploys, destructive operations, financial actions, DNS and physical-device control require explicit approval appropriate to their risk.
- Keep `My-assistance` intact as a source/reference repository during integration. Do not delete or archive it as part of this work.

## Immediate next implementation tasks

- Inspect complete file trees, workflows, build commands, and deployment settings in both repositories.
- Create a verified import plan for the My-assistance source and portfolio assets.
- Import source into the integration branch without flattening or losing history-bearing reference files.
- Adapt the portfolio into the Next.js app and add authenticated navigation to the assistant.
- Reconcile the existing deployment workflow with the new app only after its current target and production routing are confirmed.
