# Bikash Personal AI OS — Product & Technical Architecture

**Product:** Bikash Personal AI OS  
**Canonical repository:** `bikash-ananda/personal-webpage`  
**Canonical domain:** `bikashbhattarai.com.np`  
**Architecture status:** proposed target architecture, 2026-11-17  
**Implementation rule:** architecture first; production migration only after verified staging.

## 1. Product definition

Build one personal digital workspace, not a portfolio with a chatbot bolted on.

The product combines:
1. A public professional identity and knowledge website.
2. A private personal command center.
3. A coordinated team of specialist AI agents.
4. A secure tool and integration layer for email, calendar, GitHub, files, browser, PC, VPS, and IoT.
5. Persistent personal/project memory and a traceable activity history.
6. Web-first responsive access, installable PWA, and a later Windows desktop companion.

The owner is the only initial user. Design the authorization model so trusted collaborators can be added later without exposing owner-private data.

## 2. Experience architecture

### Public surface
- `/`: personal landing page and professional introduction.
- `/about`: biography, education, experience and capabilities.
- `/projects`: curated public project portfolio.
- `/research`: research notes, publications and learning.
- `/writing`: articles and public knowledge.
- `/contact`: contact form and professional links.

### Private workspace (authenticated)
- `/workspace`: command center, briefing, priorities and recent activity.
- `/workspace/assistant`: primary conversational interface (text/voice).
- `/workspace/agents`: agent directory, status, assignments and policies.
- `/workspace/projects`: project portfolio and project-specific memory.
- `/workspace/tasks`: tasks, schedules, reminders and recurring work.
- `/workspace/inbox`: connected communications and draft queue.
- `/workspace/research`: research jobs, sources and synthesized notes.
- `/workspace/knowledge`: files, notes, decisions and searchable memory.
- `/workspace/automations`: scheduled and event-triggered workflows.
- `/workspace/approvals`: pending privileged actions with exact diffs/scopes.
- `/workspace/activity`: immutable audit timeline.
- `/workspace/integrations`: connected accounts, MCP servers and permissions.
- `/workspace/settings`: models, privacy, security, notification and profile settings.

Public and private surfaces share a design system and identity, but private routes and APIs are isolated by server-side authorization. Never rely on hidden UI controls as access control.

## 3. System architecture (logical)

```text
Web / PWA / Windows Companion / Voice
                 |
          Experience Layer
     Public Site | Private Workspace
                 |
        Identity & Policy Gateway
                 |
          Personal OS API
                 |
       Agent Orchestration Runtime
       /          |             \
  Planner     Specialist      Event/Job
  Agent       Agents          Scheduler
       \          |             /
         Tool & Integration Gateway
     /       |        |        |       \
  GitHub   Google   Browser   PC/VPS   IoT
     \       |        |        |       /
       Permission checks + approvals
                 |
     Durable workflow / event journal
                 |
  Postgres + object storage + vector index
                 |
        Model Gateway / Router
      Hosted models + local models
```

### Architectural boundaries
- UI never talks directly to model providers or privileged tools.
- Agents request typed capabilities from the tool gateway; they do not receive raw secrets.
- The policy gateway authorizes every tool call using user, agent, resource, action, environment and risk.
- Long-running tasks are durable workflows, not fragile in-memory chat requests.
- All externally visible or destructive actions produce an approval record or a policy decision and an audit event.
- Model providers are replaceable behind a common model gateway.

## 4. Recommended implementation stack

Choose stable, well-supported components; avoid adopting frameworks merely because they are fashionable.

### Application
- Next.js App Router + TypeScript for public site and private workspace.
- Shared component/design system, server-side route protection, responsive PWA.
- Separate typed API client; runtime schema validation at boundaries.

### Backend and workflows
- Python + FastAPI for domain APIs and agent runtime.
- Durable workflow engine: Temporal when operationally justified; begin with a database-backed job/step state machine and worker process if deployment simplicity is more important in the first release.
- Agent orchestration: explicit graph/state-machine orchestration (LangGraph is an implementation option, not a product dependency). Keep agent definitions and tool contracts framework-independent.
- MCP as an integration protocol where useful; never treat an MCP server as trusted by default.

### Data
- PostgreSQL as system of record for users, projects, tasks, conversations, agent runs, approvals, integrations, audit events and workflow state.
- pgvector for semantic retrieval where needed; retain source metadata and access scopes.
- S3-compatible object storage for files and generated artifacts.
- Redis only for cache, rate limiting and transient coordination if measured need exists; not the source of truth.
- SQLite may remain useful for local development/offline mode, but production data architecture should support safe migration and backup.

### Model gateway
- Provider-neutral interface for OpenAI and other hosted models plus local inference (e.g. Ollama/vLLM-compatible endpoints).
- Per-task routing based on quality, latency, cost, context size, privacy class and availability.
- Structured outputs and tool calls validated against schemas.
- Model calls are observable and budgeted; secrets remain server-side.

### Desktop and voice
- First release: responsive web + PWA, browser speech where supported.
- Later: Tauri Windows companion for secure local capabilities and notifications.
- Voice input/output must have clear recording indicators, user controls and no always-listening assumption.

## 5. Specialist agent portfolio

Start with one orchestrator and a small number of useful agents; register the remaining roles as capabilities are implemented.

1. Chief of Staff / Personal Orchestrator — intent understanding, planning, delegation, briefing.
2. Project & Engineering — GitHub, milestones, technical analysis, code review and release preparation.
3. Research & Learning — web research, source appraisal, synthesis, learning plans.
4. Communications — Gmail/WhatsApp drafts, inbox triage, follow-ups; sending requires approval.
5. Business Operations — customer/market workflows, proposals, CRM and operational reports.
6. Computer & Infrastructure Operations — scoped PC/VPS diagnostics, deployments and maintenance.
7. Knowledge & Memory — ingestion, retrieval, decisions, provenance, retention and correction.
8. Voice Companion — speech interface and notifications; a modality, not an unrestricted agent.
9. Agriculture & IoT — greenhouse telemetry and recommendations; physical actuation separately gated.
10. Finance & Administration — expense records and summaries; no autonomous payments.

Agent definitions include: purpose, allowed inputs, tools, data scopes, model policy, output schema, timeout/budget, escalation policy, evaluation tests and version.

## 6. Memory architecture

Memory is not a single unfiltered transcript.

- Profile memory: stable preferences and working conventions.
- Project memory: project-specific goals, decisions, risks and current state.
- Episodic memory: selected events and outcomes with timestamps.
- Knowledge library: user-approved files, notes and sourced research.
- Working context: short-lived state for an active task.

Every memory item records provenance, owner, scope, sensitivity, confidence, created/updated time and retention policy. Provide user controls to inspect, correct, export and delete application-held memory. Retrieval must enforce project and privacy boundaries before semantic ranking.

## 7. Permission and autonomy model

Use capability-based authorization with default deny.

- Tier 0 — read-only: search, summarize, inspect status, draft plans.
- Tier 1 — reversible internal writes: create tasks, notes, draft content, update non-public workspace records.
- Tier 2 — external or consequential writes: send messages, publish, create PRs, change integrations, trigger deployments. Require explicit, action-specific approval.
- Tier 3 — destructive/high impact: delete data, alter DNS/firewall/production infrastructure, transfer funds, change credentials, control physical actuators. Require explicit confirmation, scoped target, preview, backup/safety checks and, where relevant, a second confirmation.

Approval is bound to the exact action payload, target and expiry; changing the payload invalidates approval. Maintain append-only audit records. Emergency stop can disable all write-capable tools.

## 8. Security, privacy and resilience

- Owner authentication with passkeys/WebAuthn preferred, MFA fallback, secure sessions and recovery.
- Strict server-side authorization on every private page, API, file and vector retrieval.
- Encrypt transport and sensitive stored credentials; OAuth tokens encrypted at rest and least-privilege scopes.
- Secrets in environment/secret manager only; never in Git, logs, prompts or browser bundles.
- CSRF, SSRF, XSS, injection, upload scanning, rate limiting and abuse controls.
- Treat retrieved documents, websites, emails, issue text and tool outputs as untrusted data; prompt injection must not grant authority.
- Network segmentation: public web, application, worker, database and local-device bridge separated.
- Backups encrypted, off-host, tested with restore drills.
- Health checks, structured logs, metrics, traces, alerting and incident runbooks.
- No access to other VPS projects or shared host configuration by default.

## 9. Deployment topology

Initial topology must be isolated from existing VPS applications:
- Dedicated application directory, compose project name, network, database, volume and environment.
- Bind application ports to loopback only; use the existing host-level Caddy as the sole public reverse proxy after an approved cutover.
- Never launch another Caddy instance or change shared Caddy configuration during development.
- No host-wide Docker cleanup, firewall reset, port takeover or shared resource pruning.
- Staging hostname/subdomain first; production domain switch only after acceptance and rollback rehearsal.
- Local development uses separate compose project and volumes from staging/production.

## 10. Delivery strategy

### Release 0 — Architecture and repository foundation
- Verify repository state and current production deployment.
- Establish app structure, conventions, ADRs, CI checks and secret policy.
- Keep main branch untouched; all changes on feature branches and reviewed PRs.

### Release 1 — Unified identity and workspace shell
- New Next.js experience with public portfolio and authenticated workspace.
- Owner auth, navigation, profile, project catalogue, task centre and activity feed.
- API boundary and PostgreSQL schema/migrations.
- No autonomous external actions.

### Release 2 — Personal assistant core
- Conversation service, model gateway, context assembly, task plans and durable agent runs.
- Chief of Staff, Project/Engineering and Research agents.
- Memory retrieval with source provenance.
- Human-readable run timeline and cancellation.

### Release 3 — Integrations and approvals
- GitHub read-only then scoped write.
- Gmail and Calendar read-only then draft/send with approval.
- MCP gateway, integration health and per-tool permissions.
- Approval centre and immutable audit.

### Release 4 — Automation and companion
- Schedules, event triggers, notifications, PWA installability.
- Windows companion with explicit local capability bridge.
- VPS operations in read-only mode before controlled deployment capabilities.

### Release 5 — Domain specialists
- Business, communications, finance and IoT agents.
- Local model routing and privacy-aware inference.
- Voice companion and richer proactive briefings.

## 11. Quality gates

No release is complete without:
- Unit, integration and end-to-end tests.
- Authentication and cross-user/project isolation tests.
- Prompt-injection and tool-authorization tests.
- Migration and backup-restore tests.
- Accessibility, responsive and performance checks.
- Dependency and secret scanning.
- Staging acceptance and documented rollback.
- Agent evaluations for factuality, tool correctness, escalation and cost.

## 12. Explicit non-goals for the first release

- No multi-agent swarm that can freely message or spawn agents.
- No unrestricted shell, browser, filesystem or server access.
- No autonomous sending, purchasing, payments, deployment or destructive actions.
- No always-on microphone.
- No premature microservices, Kubernetes or complex event streaming.
- No automatic import of every old website file or old agent implementation.
