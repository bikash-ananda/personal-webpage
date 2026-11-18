# Agent Framework and Repository Research

Status: research baseline; no third-party runtime adopted and no executable adapters enabled.

## Objective

Improve the Personal AI OS agents by learning from mature open-source agent runtimes and specialist tools. Reuse architectural patterns and narrowly scoped components; do not copy a full framework into the application or make the product depend on a developer-preview API.

## Repositories reviewed

| Project | What it is good for | Decision |
|---|---|---|
| DeepSeek AI / deepseek-harness | Plugin-composed runtime, typed event seams, durable session log, tool pipeline, approval, subagents, agent teams, profile composition | Deep architecture reference. Do not adopt wholesale while developer preview APIs are unstable. |
| LangGraph (langchain-ai/langgraph) | Stateful graph orchestration, explicit nodes/edges, checkpointable workflows | Evaluate as an orchestration alternative/prototype; do not add alongside another full orchestrator without a measured need. |
| Letta (letta-ai/letta) | Persistent agent memory and long-lived agent state | Evaluate memory patterns and data model; keep our PostgreSQL ownership and privacy boundary. |
| CrewAI (crewAIInc/crewAI) | Role-based agent crews plus event-driven Flows and human review | Borrow task decomposition and Flow patterns; likely a specialist workflow service, not the core runtime. |
| REA (morluto/rea, rea.tools) | MCP-based evidence-led reverse engineering of websites, JS/Electron, binaries, firmware, Android and runtime behavior | Optional specialist capability for the Research/Reverse Engineering agent. It is not an agent orchestrator. |

## DeepSeek Harness patterns worth learning from

1. **Everything is a plugin / capability seam.** Define service interfaces and let providers implement them. Keep model providers, tools, storage, subagent backends and UI replaceable.
2. **Separate durable facts from live events.** Persist user-visible state transitions in an append-only session/activity log; use transient events only for streaming and runtime coordination.
3. **One guarded tool pipeline.** Every call passes argument validation, owner/target policy, approval, sandboxing, timeout/cancellation, output validation and audit. Tool schemas shown to the model must not expose host-only execution metadata.
4. **Closed, fail-closed approval outcomes.** Only an explicit one-shot grant allows the exact requested action. Missing, cancelled, malformed or unavailable approval means deny.
5. **Managed subagent lifecycle.** Child agents need stable identity, bounded depth, cancellation, result delivery, and explicit parent-child relationships.
6. **Replayable session state.** Model-visible context should be reconstructable from durable events; avoid hidden mutable state that changes what the model sees.
7. **Profile-based composition.** Different modes (public/read-only, owner workspace, headless automation, desktop) should compose different capabilities rather than share an unrestricted tool set.

Caution: DeepSeek Harness itself identifies as developer preview and warns of compatibility-breaking changes. Treat it as an architectural reference and run isolated experiments before any adoption.

## Proposed Personal AI OS agent model

### A. One orchestrator, specialist agents

- **Orchestrator / Chief of Staff:** receives user intent, classifies risk, creates a plan, delegates, tracks progress, reconciles results and reports back.
- **Project & Development Agent:** GitHub issues/PRs, repository inspection, code review, CI status, project plans and bounded code changes.
- **Research & Reverse Engineering Agent:** web/document research, source comparison, evidence ledger, REA MCP when explicitly enabled, and technical reports.
- **Business Operations Agent:** customer follow-ups, proposals, CRM-like records, email drafts and approved communication.
- **Productivity Agent:** tasks, calendar, reminders, meeting preparation and daily review.
- **Infrastructure Agent:** read-only VPS health, container status, logs and deployment preflight first; production changes remain high-risk.
- **IoT / Greenhouse Agent:** device telemetry and diagnostics first; actuator commands require target-specific safeguards and action-time confirmation.
- **Learning & Knowledge Agent:** learning roadmap, notes, technical explanations and project-linked knowledge.

Specialists are configurations/roles on a shared runtime, not separate independent products with duplicate memory and permissions.

### B. Shared runtime services

1. Model Gateway: local and hosted providers with explicit routing, per-task budgets, fallback policy and no silent cloud fallback for private data.
2. Agent Registry: identity, role, allowed tools, model policy, context budget, max delegation depth and concurrency limits.
3. Task/Workflow Engine: durable states, dependencies, retries, deadlines, cancellation and resumability.
4. Memory Service: PostgreSQL-backed user facts, project knowledge, episodic activity and retrieval; explicit source, confidence, timestamp and retention.
5. Tool Registry: typed input/output schemas, owner and target scopes, risk tier, timeout, output cap, rate limit, enabled state and audit policy.
6. Approval Ledger: preview + canonical action hash + owner-bound one-shot approval + expiry/revocation + immutable outcome.
7. Event/Audit Log: append-only durable actions and outcomes, with separate transient streaming events.
8. Observability: token/cost, latency, tool success/failure, retries, handoffs, approval wait, task completion and quality feedback.

### C. Execution lifecycle

User request -> intent/risk classification -> plan -> specialist assignment -> tool proposal -> schema validation -> policy check -> (approval if needed) -> sandboxed execution -> output validation/redaction -> durable audit -> memory update -> result verification -> user report.

The model must never grant itself permissions, approve its own action, invent a tool result, or bypass a failed policy check.

### D. Risk tiers

- Tier 0: read-only, allowlisted project data and status; audit.
- Tier 1: drafts, summaries, research and proposed tasks; save as draft.
- Tier 2: create/update files, push code, send messages, publish; exact preview and explicit approval.
- Tier 3: production deployment, destructive operations, credentials, DNS/firewall, financial actions and physical actuators; action-time confirmation, preflight, rollback/fail-safe and emergency stop.

## Adoption plan

1. **Research and baseline tests:** document interfaces, security assumptions, license, maintenance and compatibility. Benchmark one representative task per framework.
2. **Our own registry and policy:** implement typed tool definitions, allowlists, risk tiers, schemas and tests; no executor initially.
3. **Approval ledger:** exact-action hash, expiry, revocation, owner binding and audit.
4. **Read-only adapters:** GitHub metadata/status, allowlisted file search/read, VPS health summaries and IoT telemetry.
5. **Subagent orchestration:** bounded child agents with durable task states, cancellation, result contracts and token budgets.
6. **Memory and retrieval:** project-scoped memory with provenance and user correction.
7. **Bounded writes and integrations:** one adapter at a time, with preview and approval.
8. **High-risk actions:** only after tests, sandboxing, preflight, rollback/fail-safe and emergency stop.

## Evaluation criteria

Compare frameworks on:
- task success and factual correctness;
- tool-call validity and policy violations;
- resumability after process restart;
- cancellation and timeout correctness;
- owner/tenant isolation;
- audit completeness and replayability;
- token/cost and latency per completed task;
- local-model compatibility and privacy routing;
- plugin/adapter maintenance burden;
- license, release cadence and security response.

Do not select a framework based on GitHub stars alone.

## Immediate recommendation

Continue the current custom Next.js/PostgreSQL application and build a small, framework-neutral runtime boundary. Study DeepSeek Harness most deeply for plugin seams, tool pipeline, session/event model and approval; evaluate LangGraph for durable workflows; evaluate Letta for memory; borrow CrewAI's Crews/Flows distinction; keep REA as an optional research specialist MCP.

No third-party agent framework is installed, no arbitrary shell executor is enabled, and no VPS deployment is authorized by this research.
