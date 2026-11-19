# Implementation status

Last updated: 2026-11-18

## Public preview mode (temporary review phase)

- [x] Public portfolio and workspace routes are browseable without signing in so the owner can review the full interface.
- [x] Workspace dashboard and module pages clearly label public preview mode.
- [x] Projects, tasks, hardware inventory and AI planning render read-only preview states; no private owner records are exposed in public mode.
- [x] Existing Projects, Tasks and other write/data APIs continue to require the owner session and same-origin checks.
- [ ] Before private production use, restore the owner-only workspace layout gate and verify every data/API route remains owner-scoped.
- [ ] Validate the full preview on desktop and mobile after Vercel deployment.

## Release 0 — repository and mobile foundation

- [x] Architecture, security boundaries and delivery roadmap documented.
- [x] Work isolated on `integration/bikash-personal-ai-os`; `main` remains untouched.
- [x] Next.js App Router foundation and public profile landing-page shell.
- [x] Responsive mobile-first design and bottom navigation.
- [x] PWA manifest, service worker, offline fallback and install prompt scaffold.
- [x] Public About, Projects, Research, Writing and Contact routes with shared responsive page layout.
- [x] Public navigation connects the portfolio pages and provides a consistent return-to-home path.
- [x] Workspace module pages now switch from read-only preview to owner controls only when the server confirms the authenticated owner session.
- [ ] Validate the new public routes on mobile/desktop and resolve any CI/build issues.
- [x] Service worker excludes private workspace, auth and API paths from caching.
- [x] CI passed for the initial project/task screens and live-data dashboard commits; latest full branch validation is still required after the agent-planner changes.

## Release 1 — owner identity and real work data

- [x] Owner-only email magic-link authentication code for `bikashananda40@gmail.com`.
- [x] Server-side session and owner checks on the private workspace.
- [x] PostgreSQL connection configuration and persistent authentication rate-limit storage.
- [x] Core domain migration drafted for projects, tasks, knowledge, agent runs, approvals, integrations and append-only activity events.
- [x] Owner-scoped Projects and Tasks GET/POST APIs with parameterized SQL and same-origin write checks.
- [x] Owner-scoped project and task status updates.
- [x] Project and task creation/status changes write to the append-only activity journal in the same database statement.
- [x] Owner-scoped activity API and live activity feed for the workspace Activity module.
- [x] PostgreSQL CI smoke test covers project/task event writes and rejects event updates/deletes.
- [x] Known-project import, hardware component creation, stock adjustments and project BOM additions also write activity events.
- [x] Dashboard sample counts, sample tasks, sample project names and fake activity removed; metrics now query owner records.
- [x] Projects and Tasks screens now load from owner APIs, create records, and update project/task statuses.
- [x] Explicit, idempotent import endpoint for five known owner projects (Personal AI OS, BNB Machinery, Nepal Wildlife Management System, Digital Agriculture & Smart Greenhouse, and BEOS). Import happens only after the owner clicks the import control.
- [x] Ten specialist agent role definitions with scoped capability/tool declarations and autonomy tiers.
- [x] Model-backed work-planning endpoint records agent runs and returns a proposed task plan; the owner must explicitly approve before tasks are saved.
- [x] Assistant planner UI supports selecting a specialist, entering a work brief, reviewing proposed tasks and approving task creation.
- [x] Plan approval now saves the exact server-stored proposal in one PostgreSQL transaction; the client submits only the run ID, and an approval marker prevents replay/duplicate task creation.
- [x] Plan proposals expire after 30 minutes, task count is validated server-side, and approval errors do not expose database internals.
- [x] AI planning requests are rate-limited per owner with a PostgreSQL advisory lock to prevent parallel requests bypassing the hourly cap.
- [x] AI-plan approval and each generated task are recorded in the append-only activity journal.
- [ ] Apply Better Auth and domain migrations to a dedicated disposable development database in order: Better Auth schema, `0001_personal_os_core.sql`, then `0002_hardware_inventory_bom.sql`, then `0003_hardware_stock_ledger.sql`.
- [ ] Configure SMTP and verify actual magic-link email delivery and login/logout.
- [ ] Configure `AI_BASE_URL`, `AI_MODEL` and provider key where required; verify hosted and local model providers.
- [ ] Verify authorization, input validation, cross-owner isolation, atomic plan approval and duplicate-approval rejection with integration tests.

## Release 2 — real specialist execution and engineering operations

- [x] Add a metadata-only, fail-closed tool registry and policy boundary with risk tiers, agent allowlist checks, disabled-by-default adapters and canonical action digests; no tool executor is enabled yet.\n- [x] Add automated policy regression coverage for default-deny behavior, agent allowlists, canonical digest stability/mutation, invalid payloads, tier-two approvals and tier-three deployment/actuator confirmation; CI result is pending.\n- [ ] Implement and test one read-only adapter at a time (GitHub, research, browser, local computer, server diagnostics, Google Workspace and IoT gateway).
- [ ] Enforce agent tool allowlists, risk tiers, approval binding, cancellation and audit logging before consequential execution.
- [ ] Add task editing, deletion/archive, dependencies, recurring tasks and milestone tracking.
- [x] Add owner-scoped electronics component inventory, datasheets, stock levels, low-stock indicators, and project-linked bills of materials.
- [ ] Add purchase orders, suppliers, multi-location stock, and immutable stock transaction history.
- [ ] Persist assistant conversations and project knowledge with provenance and retention controls.
- [ ] Build Research ingestion, citations and learning workflows.
- [ ] Add session/device management and evaluate passkeys/MFA as a second factor.
- [ ] Migrate and review public profile content from the legacy site.

## Release 2 — hardware and engineering inventory

- [x] Electronics and hardware component catalogue with manufacturer, MPN, category, package, datasheet URL, stock quantity, minimum stock, storage location, unit cost and notes.
- [x] Owner-scoped stock adjustments that reject negative quantities.
- [x] Project BOM with component quantities, reference designators and stock-shortage indication.
- [x] Append-only stock movement ledger; each manual stock receipt/consumption updates quantity and writes an immutable audit record.
- [x] Mobile-friendly hardware workspace at `/workspace/hardware`.
- [ ] Validate migrations and APIs against a dedicated development PostgreSQL instance; add automated integration tests.

## Truth-in-labeling and deployment gate

The login code is present but is not operational until a dedicated PostgreSQL database, Better Auth schema, SMTP sender and end-to-end tests are configured. Project/task APIs and AI planning depend on migration `0001_personal_os_core.sql`; hardware inventory and BOM depend on `0002_hardware_inventory_bom.sql`, and stock movement audit depends on `0003_hardware_stock_ledger.sql`. AI planning additionally requires a configured hosted or local OpenAI-compatible model endpoint. The ten agents are defined and the planner is model-backed. Approved task plans are saved atomically and audited; specialist tool execution is not yet enabled. PWA installation/offline behavior has not been validated on a physical Android device.

No VPS deployment, DNS, shared Caddy, firewall or unrelated project has been changed. Production deployment remains blocked until the latest branch CI passes, database migration and backup/restore are tested, authentication and API security tests pass, and the owner explicitly approves deployment.

### Free-first AI gateway

- Added shared provider routing for local Ollama and configurable free-tier hosted providers.
- External model calls remain disabled until `AI_ALLOW_EXTERNAL_PROVIDERS=true` is explicitly configured; custom endpoints require explicit provider ordering.
- Planner uses the gateway; selected provider/model are returned for traceability.
- Automated policy tests are included in CI. Full CI/Vercel validation is pending.
- Added an owner-authenticated, no-store provider status endpoint (`GET /api/ai/providers`) that exposes configured provider IDs/models and local-vs-hosted classification without revealing API keys or base URLs.
