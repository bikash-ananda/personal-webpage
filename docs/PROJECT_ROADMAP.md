# Personal AI OS — Single Source of Truth Roadmap

Last updated: 2026-11-19

This document is the working checklist for the Personal AI OS project. Update it whenever a milestone changes so decisions and unfinished work are not lost between sessions.

## Non-negotiable project rules

- Work only on `integration/bikash-personal-ai-os` until the owner explicitly approves a merge.
- Never deploy this project to Contabo without explicit owner approval after tests pass.
- Do not alter, restart, proxy over, or consume reserved resources from the other VPS projects.
- Free-first: no paid API is required; no automatic paid fallback. External model providers remain disabled unless the owner explicitly opts in.
- Never commit API keys, passwords, tokens, private user data or server credentials.
- High-impact server deployments and physical IoT actions require action-time owner confirmation.
- ChatGPT is currently the development partner; a ChatGPT subscription does not itself provide an OpenAI API key or API credits.

## Current state

### Completed / implemented (not yet production-approved)

- Public landing and information pages: About, Projects, Research, Writing, Contact.
- Workspace owner-context and read-only preview gating.
- Project/task/hardware activity journal with append-only smoke test.
- Planner proposal and owner approval route with owner binding, expiry, replay protection and rate limiting.
- Metadata-only Agent Runtime policy boundary with risk tiers and action digests.
- Free-first model gateway for Ollama, Gemini, Groq, OpenRouter, Cloudflare Workers AI and NVIDIA NIM.
- External hosted providers are disabled unless `AI_ALLOW_EXTERNAL_PROVIDERS=true`; Ollama remains local-only.
- Arbitrary custom endpoints are unsupported to avoid accidentally using a paid API.
- Planner now uses the shared gateway; provider/model metadata is returned with the plan.
- Owner-authenticated `GET /api/ai/providers` reports configured providers without exposing keys or endpoint URLs.
- Regression scripts exist for agent policy and free-first provider selection; both are wired into CI.

### Validation state

- Branch is ahead of `main`; keep it isolated.
- A previous CI run failed during `npm install` because `package.json` contained a literal escaped newline. The manifest has been corrected.
- Agent runtime and AI gateway tests were added to CI after that failure.
- Latest Vercel status at last check: pending. Do not claim the build is green until the provider reports success.
- Database migration/activity journal smoke test passed in the previous CI run.
- No production deployment has been performed.

## Next work — execute in this order

1. **Restore green validation**
   - Confirm latest GitHub Actions run completes dependency install, both policy tests, typecheck, lint, production build and database migration tests.
   - Inspect and fix the first failing step; do not bypass checks.
   - Retrieve the actual Vercel build log if its status fails.

2. **Finish AI gateway operational layer**
   - Add owner dashboard visibility for configured providers, local/hosted classification and safe configuration state.
   - Add provider health/latency and usage tracking without exposing keys or sending test prompts automatically.
   - Add request-level provider/model audit metadata.
   - Keep external provider use disabled until owner configures a free-tier key and explicitly opts in.

3. **Harden approval ledger**
   - Persist exact action digest, owner ID, tool, target, arguments hash, expiry and one-time consumption.
   - Re-check current policy and digest immediately before dispatch.
   - Add tests for owner isolation, tampering, replay, expiry, concurrent approval and atomic rollback.
   - No generic executor until these tests pass.

4. **Enable the first safe read-only tools**
   - Start with allowlisted GitHub repository metadata/status and public web research.
   - Add bounded timeouts, response-size limits, provenance and audit events.
   - Treat repository files, web pages and tool outputs as untrusted input.

5. **Shared memory and specialist delegation**
   - Add owner-scoped, source-attributed knowledge storage and retrieval.
   - Add one orchestrator with specialist profiles; do not create duplicate agent runtimes or duplicate memory stores.
   - Track cost/usage and keep local/private data local by default.

6. **External integrations and device automation**
   - Gmail/Calendar and other messaging connectors only after scopes, token storage, revocation and approval controls are complete.
   - IoT telemetry may be read-only first; actuator writes remain disabled until device-specific interlocks, fail-safe and action-time confirmation exist.

7. **Production readiness**
   - Backup/restore rehearsal, security review, migration rehearsal, resource limits and Caddy reverse-proxy plan.
   - Deploy only after owner explicitly approves.

## Definition of done

A milestone is not complete because code was added. It is complete only when tests pass, security boundaries are verified, documentation is updated, and the owner is told exactly what remains disabled or requires credentials/approval.

## Milestone progress — 2026-11-19

### 1. CI/CD baseline — complete on development branch
- GitHub Actions validate job passed: agent runtime tests, AI Gateway tests, TypeScript, ESLint and production build.
- Database job passed: core, hardware inventory, immutable stock ledger migrations and Activity Journal smoke test.
- Vercel check passed for the validated commit. This is a build/deployment check only; no Contabo production deployment was performed.
- Latest validated commit at the time of this update: `23215e8991465358ae049288039fc263e4134ff0`. New integration work below is pending a fresh CI run.

### 2. AI Provider Manager — first UI/API slice implemented
- Owner-only provider status API exposes provider ID, model, local/hosted classification and configured state; it never returns API keys or provider base URLs.
- Workspace Integrations page now displays configured AI providers and explains that configured does not equal live health/quota.
- External provider use remains blocked unless the owner explicitly opts in. No paid fallback was added.
- Live provider health/latency checks and owner-controlled provider enable/disable settings remain future work; do not imply they are implemented.

### 3. GitHub read-only integration — first slice implemented
- Owner-only `GET /api/integrations/github` reads repository metadata and up to five latest commits from GitHub's official API.
- Repository target is fixed by server configuration (`GITHUB_READONLY_REPOSITORY`); client cannot supply an arbitrary repository URL.
- Public repository access needs no token. Optional `GITHUB_READONLY_TOKEN` should be a fine-grained token with only Metadata and Contents read-only permissions.
- No write endpoints, shell execution, webhook or automatic commit/issue/PR actions exist.
- Workspace Integrations page displays repository state and recent commits. Private repo visibility/token behavior must be verified with owner configuration.

### 4. Windows Local Agent — safe bootstrap foundation implemented
- Added `scripts/windows-local-agent.ps1` to check local Ollama and list already-installed models; optional `-StartOllama` starts Ollama on loopback only.
- Added `docs/WINDOWS_LOCAL_AGENT.md` describing phased local runtime, pairing, revocation, lazy MCP and resource policy.
- Script does not download models, install MCP servers, create startup tasks, expose public ports or execute arbitrary computer actions.
- Actual paired local agent runtime, Windows Credential Manager/DPAPI device credential, outbound secure tunnel and computer/file automation remain future implementation and require security tests.

### Next acceptance gates
- Run full CI on the integration API/UI/Windows bootstrap changes and fix every failure.
- Add tests for GitHub route owner isolation, upstream errors/timeouts and bounded response mapping.
- Verify GitHub repository access under the configured public/private visibility without widening token scopes.
- Add explicit owner-controlled provider enable/disable only after a secure persistence design; do not implement client-side secret storage.
- Implement local pairing/revocation before connecting PC tools to the VPS.

## Runtime footprint and integration policy (2026-11-19)

### Lightweight operating model

- Keep the Contabo VPS as a thin control plane: Next.js app/API, existing PostgreSQL, scheduled lightweight jobs only. Do not host local LLM inference or launch a fleet of always-on MCP processes on this shared VPS.
- Run local models (Ollama) and desktop/computer/file MCP servers on the user's Windows PC when that PC is online. The VPS must continue operating if the PC is offline.
- Use remote SaaS APIs directly through small server-side adapters when an official stable REST API exists. Use MCP when interoperability/tool discovery is valuable; do not wrap every API in a separate MCP server.
- MCP connections are lazy/on-demand, per task, allowlisted and closed/released after use. Load tool schemas only for the specialist agent that needs them; cap tool count, output size, timeouts and concurrent calls.
- Prefer stateless Streamable HTTP for remote MCP integrations; use local stdio MCP for desktop-only tools. Never expose a local stdio server directly to the public internet.
- No Docker container or system service per integration. Start with in-process adapters; add a separately isolated service only when a measured need justifies it.
- Reuse the existing PostgreSQL and existing host Caddy. No additional database, Redis, vector database, reverse proxy or always-on worker is approved until resource measurements show a need.
- Apply resource caps, request timeouts, rate limits, bounded retries and circuit breakers. Do not retry write operations unless idempotency is guaranteed.

### API and MCP integration roadmap

1. Core: internal app API, provider gateway, PostgreSQL, GitHub API (read-only first), public web research.
2. Productivity: Google OAuth + Gmail and Calendar APIs, with read-only scopes first and explicit approval for sending/updating.
3. Files/knowledge: Google Drive or user-selected storage, local PC file access via local MCP only, owner-scoped indexing with file size/type limits.
4. Development/operations: GitHub issues/PR/status, deployment diagnostics read-only, VPS diagnostics with fixed allowlisted commands only. No arbitrary shell MCP.
5. Communication: WhatsApp Business Platform / official messaging APIs only after provider eligibility, costs and webhook requirements are checked; no unofficial session scraping.
6. Smart agriculture/IoT: existing Digital Agriculture API as the integration boundary; telemetry read-only first. Device commands remain disabled until device identity, interlocks, audit and action-time confirmation are tested.
7. Optional future APIs: weather, maps/geocoding, speech-to-text/text-to-speech and image analysis only when the feature needs them and a genuinely free tier/local alternative is verified.

### MCP security and context budget

- Maintain a central registry of MCP servers and individual tool allowlists; never give every agent every tool.
- Treat MCP descriptions, resources, results and linked URLs as untrusted data; defend against prompt injection and data exfiltration.
- Each tool receives only the minimum arguments/data it needs; no whole-chat transcript, secrets or unrelated private memory.
- Read-only tools may run automatically within strict limits. Drafts require review before external submission. Writes, messages, deployment and physical actuation require explicit owner approval at action time.
- Record server identity/version, tool name, approval decision, latency, bounded result summary and action digest. Never log credentials or full sensitive payloads.
- Require official/verified server provenance where possible; review source, permissions, update history and data handling before enabling third-party MCP servers.

### API cost policy

- No paid provider fallback and no hidden paid calls. External model providers stay disabled until the owner supplies a key and explicitly opts in.
- Free tiers are quotas, not guaranteed unlimited capacity; show configured provider and last-known health, but do not claim remaining quota unless the provider exposes it.
- Prefer local processing for private data and use hosted free tiers only for data that is safe to disclose under that provider's terms.
- Check each API's current free-tier limits, data retention and terms before activation; API availability does not imply free usage.
