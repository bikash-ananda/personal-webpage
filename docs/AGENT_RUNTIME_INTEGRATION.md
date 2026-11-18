# Agent runtime integration plan

Status: design review only. No operating-system, browser, email, server, or IoT tool is executable yet.

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

The current AI Planner can generate proposals and, after explicit approval, save the proposed tasks atomically. That approval is not permission to execute external tools. The registry, tool adapters, approval ledger UI, emergency stop and end-to-end tool execution tests remain future work.


## First implementation slice — policy boundary

The integration branch now contains `src/lib/agents/runtime.ts`:
- A typed metadata-only tool catalog for the current specialist capabilities.
- Every tool is disabled and unimplemented by default; registry presence is not execution permission.
- Policy checks agent identity, tool existence, the agent's allowlist, enabled state and implementation state.
- Risk tiers 0–1 may be allowed only for read-only/draft actions; tier 2 returns an approval-required decision; tier 3 returns an explicit-confirmation decision.
- Canonical SHA-256 action digests bind owner, agent, tool, target and exact JSON arguments. The eventual approval ledger must store and compare this digest and re-evaluate policy immediately before execution.
- This module does not execute tools, issue approvals, or turn model output into permission.

Next engineering gate: add focused automated tests for canonicalization, allowlist denial, disabled/unimplemented denial, approval digest stability and action mutation before enabling any adapter.
