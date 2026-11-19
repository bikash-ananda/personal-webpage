# Agent runtime integration plan

Status: staged implementation. Three owner-scoped read-only adapters (projects, tasks, and the fixed GitHub repository) now have an authenticated execution route and durable agent-run records. OS, browser, email, server, and IoT tools remain non-executable.

## Reuse decisions from the legacy My-assistance repository

The legacy repository contains useful patterns in `tools_runtime.py`, `routes_phase3.py`, `security.py`, `providers.py`, and `docs/SECURITY_MODEL.md`. Reuse the design, not the legacy implementation wholesale:

- Keep a deterministic tool catalog with explicit input schemas, target scopes, risk tiers, timeout limits, output limits, and enable/disable state.
- Preserve the safe-file-tool rules: reject path traversal, resolve symlinks, exclude generated and credential paths, cap file sizes, and never overwrite with a create-only action.
- Bind approval to a canonical hash of the exact action, target, and validated arguments. Any material change requires a new preview and approval.
- Re-check owner identity, tool enabled state, target state, approval expiry, approval hash, and emergency stop immediately before execution.
- Treat tool output, repositories, websites, documents, emails, and MCP responses as untrusted data, never as policy instructions.
- Keep model routing explicit. Never silently send private content to a cloud model when a local model is unavailable.

## Implementation order

1. **Registry and policy:** typed tool definitions, JSON-schema-like validation, risk levels, owner allowlists, per-tool limits, and tests. No execution adapters.
2. **Approval ledger:** create exact previews with expiry, canonical action hash, owner-bound approval, cancellation/revocation, and immutable audit events.
3. **Read-only adapters:** Git status, allowlisted project file listing/reading/search, repository metadata, and server health summaries. No arbitrary shell.
4. **Bounded write adapters:** create-only project files and task/project updates after preview and approval. No overwrite or delete.
5. **External integrations:** GitHub, Google Workspace, email, browser and messaging; each gets provider scopes, secret references, output redaction, quotas and separate approval rules.
6. **Infrastructure and physical systems:** server deployment/restart, DNS/firewall, finance, and greenhouse/IoT actuator controls remain highest risk. Require action-time confirmation, target display, preflight, rollback or fail-safe behavior, and emergency stop.

## Risk tiers

| Tier | Examples | Default behavior |
| --- | --- | --- |
| 0 | Read-only project status and approved documents | Allow only within owner-approved target scope; audit |
| 1 | Drafts, reports, proposed tasks | Save as draft; audit |
| 2 | Create files, send messages, publish, push code | Exact preview and explicit owner approval |
| 3 | Production deploy, deletion, credentials, DNS/firewall, financial or physical action | Strong action-time confirmation, preflight, rollback/fail-safe and emergency stop |

The model cannot grant itself permissions, approve its own actions, choose arbitrary filesystem roots, or pass free-form shell commands to an executor.

## Current release boundary

The current AI Planner can generate proposals and, after explicit approval, save the proposed tasks atomically. That approval is not permission to execute external tools. The first bounded read-only adapters are now implemented in `src/app/api/agents/tools/execute/route.ts`. The Specialist Agents console exposes them only to the authenticated owner; each invocation is stored in `agent_runs`. The project/task adapters are owner-scoped SQL reads; GitHub is pinned to `bikash-ananda/personal-webpage` and read-only. The runtime policy enables only these three adapters. All other registry entries remain disabled and unimplemented. Approval ledger UI, emergency stop, comprehensive executor integration tests and the remaining specialist adapters are still future work.


## First implementation slice — policy boundary

The integration branch now contains `src/lib/agents/runtime.ts`:
- A typed metadata-only tool catalog for the current specialist capabilities.
- Every tool is disabled and unimplemented by default; registry presence is not execution permission.
- Policy checks agent identity, tool existence, the agent's allowlist, enabled state and implementation state.
- Risk tiers 0–1 may be allowed only for read-only/draft actions; tier 2 returns an approval-required decision; tier 3 returns an explicit-confirmation decision.
- Canonical SHA-256 action digests bind owner, agent, tool, target and exact JSON arguments. The eventual approval ledger must store and compare this digest and re-evaluate policy immediately before execution.
- This module does not execute tools, issue approvals, or turn model output into permission.

Automated regression tests now cover canonicalization, allowlist denial, disabled-by-default behavior, invalid payloads, tier-two approval decisions and tier-three deployment/actuator confirmation. The CI run must pass before enabling any adapter.

## Free-first model gateway (implemented)

- `src/lib/ai/provider-gateway.ts` provides a shared OpenAI-compatible chat-completions interface for Ollama, Gemini, Groq, OpenRouter, Cloudflare Workers AI and NVIDIA NIM.
- Local Ollama is eligible without an API key. External providers are blocked unless `AI_ALLOW_EXTERNAL_PROVIDERS=true` is explicitly set in the private server environment.
- Provider order is owner-configurable with `AI_PROVIDER_ORDER`. Arbitrary custom endpoints are intentionally unsupported so a paid endpoint cannot be added accidentally.
- A provider must have a configured model (and an API key for hosted providers) before it can be selected. The gateway tries the configured order and returns only a generic failure message, never provider credentials.
- This is a routing/configuration layer, not a guarantee that a provider's free quota is unlimited. Keep billing disabled with providers and monitor their quotas. No paid fallback is implemented.
- Planner requests now use this gateway and record the selected provider/model in the run response.
- Tests cover local-only defaults, external opt-in, configured ordering and explicit custom endpoint opt-in.


## First executable slice — owner-scoped read-only tools

- `project_read`: reads up to 50 active owner projects.
- `task_read`: reads up to 50 owner tasks with project names.
- `github_read`: reads repository metadata and the five latest commits from the fixed `bikash-ananda/personal-webpage` repository; optional token is read-only and never returned.
- `POST /api/agents/tools/execute` checks trusted origin, owner session, agent identity, declared tool allowlist, enabled/implemented state and risk policy. Tool arguments must be an empty JSON object; targets are selected server-side and cannot be supplied by the model or browser.
- Each run is persisted as `running` then `succeeded` or `failed` in `agent_runs`, with a per-owner hourly cap.
- No shell, filesystem write, GitHub mutation, email, production deployment or actuator adapter is enabled by this slice.


## Research and knowledge — staged capabilities

- The Research specialist can use `encyclopedia_search`, a fixed-host, read-only search against English Wikipedia. Queries are bounded to 2–180 characters, requests time out after 8 seconds, and results are limited to eight. This is initial source discovery only; it is not general web search and does not replace primary research, official sources or independent verification.
- The Research specialist can retrieve owner-scoped knowledge records and save a research dossier only through an explicit approval request.
- The Knowledge specialist can retrieve up to 100 owner-scoped records. Knowledge writes create a pending `action_approvals` record bound to a canonical SHA-256 payload digest and expire after 15 minutes.
- Approval locks the exact pending record, verifies owner, expiry, action type, digest and current runtime policy, then inserts the knowledge item and marks the approval/run executed in one database transaction. The browser submits only the approval ID at execution time; it cannot alter the approved payload.
- Sensitive and restricted labels are metadata, not a substitute for future encryption/key-management controls. The current UI is owner-only; no public access is granted.
- The Research and Knowledge workspace pages expose source discovery, owner-scoped retrieval, and explicit save approval. General public-web search, page crawling, document ingestion/OCR, semantic/vector retrieval and model-generated cited synthesis remain future work until safe free-tier providers and source verification are integrated.


## Task planning and communications draft slice

- The task-planning endpoint now enforces the shared runtime policy for `task_propose`. The model may propose tasks, but only the existing owner approval endpoint can persist the exact server-stored proposal. No task is created by the planning request itself.
- The Communications specialist can create private unsent drafts through `POST /api/agents/drafts`. Drafts are stored as owner-scoped knowledge records tagged with `unsent_communication_draft` and logged in the append-only activity journal.
- The Communications workspace can list and review those drafts. No email, SMS, social post or other external send action is implemented or enabled.
- Pending knowledge approvals can be retrieved from the owner-only approval inbox, approved against their exact digest-bound payload, or rejected. Rejection marks the associated run cancelled and records an audit event.
- These are bounded actions only; the model gateway still requires a configured free provider before model-generated task plans or message content can be produced.
