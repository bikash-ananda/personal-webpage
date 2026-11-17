# Delivery Roadmap — Bikash Personal AI OS

This roadmap is outcome-based. Dates are assigned only after repository and deployment verification.

## Workstream A — Product foundation
- [ ] Confirm owner profile, public/private information boundaries.
- [ ] Define navigation and responsive design system.
- [ ] Define application environments and secret inventory.
- [ ] Add architecture decision records and contribution conventions.

## Workstream B — Repository foundation
- [ ] Inventory current personal-webpage files and workflows.
- [ ] Inventory My-assistance source, tests, dependencies and implemented capabilities.
- [ ] Selectively reuse useful domain logic and tests; do not port old UI blindly.
- [ ] Establish Next.js + FastAPI monorepo layout and reproducible builds.
- [ ] Add CI for lint, typecheck, tests, build and secret scanning.

## Workstream C — Unified application
- [ ] Public portfolio routes.
- [ ] Owner authentication and protected workspace shell.
- [ ] Projects, tasks, activity and settings.
- [ ] Accessible responsive desktop/mobile UI.
- [ ] PWA installability and notification groundwork.

## Workstream D — Agent platform
- [ ] Model gateway and provider configuration.
- [ ] Typed agent registry and capability contracts.
- [ ] Chief of Staff orchestration and durable run state.
- [ ] Tool policy gateway and approval lifecycle.
- [ ] Conversation and project-scoped memory.
- [ ] Agent run tracing, cancellation and evaluation.

## Workstream E — Integrations
- [ ] GitHub read-only.
- [ ] Google Calendar read-only.
- [ ] Gmail read-only and draft-only.
- [ ] MCP connection management and tool allowlists.
- [ ] Browser/PC/VPS capabilities with explicit isolation.
- [ ] WhatsApp only through compliant official integration paths.

## Workstream F — Operations
- [ ] Isolated staging deployment and monitoring.
- [ ] Encrypted backups and restore rehearsal.
- [ ] Security review and penetration-oriented tests.
- [ ] Production cutover plan for bikashbhattarai.com.np.
- [ ] Rollback rehearsal before DNS/Caddy change.

## Release acceptance
A release may move forward only when its acceptance criteria and security checks pass. Main branch and existing production remain unchanged until reviewed pull request and explicit deployment approval.
