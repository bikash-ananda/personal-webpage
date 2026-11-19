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
