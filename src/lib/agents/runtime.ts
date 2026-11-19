import { createHash } from "node:crypto";
import { getAgent } from "@/lib/agents/registry";

export type RiskTier = 0 | 1 | 2 | 3;
export type ToolDecision =
  | { outcome: "allow"; reason: "read_only_or_draft" }
  | { outcome: "approval_required"; reason: "owner_approval_required"; actionDigest: string }
  | { outcome: "explicit_confirmation_required"; reason: "high_impact_action"; actionDigest: string }
  | { outcome: "deny"; reason: "unknown_agent" | "unknown_tool" | "not_allowlisted" | "disabled" | "not_implemented" | "invalid_action" };

export type ToolDefinition = {
  key: string;
  label: string;
  description: string;
  riskTier: RiskTier;
  enabled: boolean;
  implemented: boolean;
  sideEffect: "none" | "draft" | "write" | "external" | "physical";
  targetScope: "owner" | "project" | "repository" | "server" | "device" | "external_account";
};

/**
 * Only the three bounded read-only adapters below are executable. All other
 * capabilities remain disabled until their adapter and approval flow are tested.
 */
export const toolRegistry: readonly ToolDefinition[] = [
  { key: "project_read", label: "Read projects", description: "Read owner-scoped project records.", riskTier: 0, enabled: true, implemented: true, sideEffect: "none", targetScope: "owner" },
  { key: "task_read", label: "Read tasks", description: "Read owner-scoped task records.", riskTier: 0, enabled: true, implemented: true, sideEffect: "none", targetScope: "owner" },
  { key: "task_propose", label: "Propose tasks", description: "Create a task proposal for owner review; does not save tasks.", riskTier: 1, enabled: false, implemented: false, sideEffect: "draft", targetScope: "owner" },
  { key: "github_read", label: "Read GitHub", description: "Read allowlisted repository metadata and status.", riskTier: 0, enabled: true, implemented: true, sideEffect: "none", targetScope: "repository" },
  { key: "web_research", label: "Web research", description: "Search public sources and return cited findings.", riskTier: 0, enabled: false, implemented: false, sideEffect: "none", targetScope: "external_account" },
  { key: "knowledge_read", label: "Read knowledge", description: "Retrieve owner-authorized knowledge records.", riskTier: 0, enabled: true, implemented: true, sideEffect: "none", targetScope: "owner" },
  { key: "knowledge_write", label: "Save knowledge", description: "Propose a knowledge record; owner approval is required before saving.", riskTier: 2, enabled: true, implemented: true, sideEffect: "write", targetScope: "owner" },
  { key: "draft_create", label: "Create draft", description: "Save an unsent communication draft.", riskTier: 1, enabled: false, implemented: false, sideEffect: "draft", targetScope: "owner" },
  { key: "server_diagnostics", label: "Server diagnostics", description: "Read allowlisted VPS health and service status only.", riskTier: 0, enabled: false, implemented: false, sideEffect: "none", targetScope: "server" },
  { key: "iot_read", label: "Read IoT telemetry", description: "Read device telemetry without changing actuators or configuration.", riskTier: 0, enabled: false, implemented: false, sideEffect: "none", targetScope: "device" },
  { key: "server_deploy", label: "Deploy server", description: "Perform a production deployment after preflight, rollback checks and explicit owner confirmation.", riskTier: 3, enabled: false, implemented: false, sideEffect: "external", targetScope: "server" },
  { key: "iot_actuate", label: "Control IoT actuator", description: "Change a physical device or actuator state after device-specific safety checks and explicit owner confirmation.", riskTier: 3, enabled: false, implemented: false, sideEffect: "physical", targetScope: "device" },
] as const;

const toolsByKey = new Map(toolRegistry.map((tool) => [tool.key, tool]));

function canonicalJson(value: unknown, depth = 0): string {
  if (depth > 20) throw new Error("Action payload is too deeply nested.");
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    const encoded = JSON.stringify(value);
    if (encoded === undefined) throw new Error("Action payload must contain JSON values only.");
    return encoded;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Action payload must contain finite numbers.");
    const encoded = JSON.stringify(value);
    if (encoded === undefined) throw new Error("Action payload must contain finite numbers.");
    return encoded;
  }
  if (Array.isArray(value)) {
    const items: string[] = [];
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.prototype.hasOwnProperty.call(value, index)) throw new Error("Sparse arrays are not valid action payloads.");
      items.push(canonicalJson(value[index], depth + 1));
    }
    return "[" + items.join(",") + "]";
  }
  if (typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error("Action payload objects must be plain JSON objects.");
    }
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return "{" + keys.map((key) => JSON.stringify(key) + ":" + canonicalJson(record[key], depth + 1)).join(",") + "}";
  }
  throw new Error("Action payload must contain JSON values only.");
}

export function createActionDigest(input: {
  ownerId: string;
  agentKey: string;
  toolKey: string;
  target: string;
  args: unknown;
}): string {
  if (!input.ownerId || !input.agentKey || !input.toolKey || !input.target || input.target.length > 500) {
    throw new Error("Action identity and target are required.");
  }
  const canonical = canonicalJson({
    ownerId: input.ownerId,
    agentKey: input.agentKey,
    toolKey: input.toolKey,
    target: input.target,
    args: input.args,
  });
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

/**
 * Policy evaluation only. It never executes tools or treats a model response
 * as an approval. The eventual executor must re-evaluate this policy immediately
 * before dispatch and verify the same digest against an unexpired owner approval.
 */
export function evaluateToolRequest(input: {
  ownerId: string;
  agentKey: string;
  toolKey: string;
  target: string;
  args: unknown;
}): ToolDecision {
  const agent = getAgent(input.agentKey);
  if (!agent) return { outcome: "deny", reason: "unknown_agent" };

  const tool = toolsByKey.get(input.toolKey);
  if (!tool) return { outcome: "deny", reason: "unknown_tool" };
  if (!agent.tools.includes(tool.key)) return { outcome: "deny", reason: "not_allowlisted" };
  if (!tool.enabled) return { outcome: "deny", reason: "disabled" };
  if (!tool.implemented) return { outcome: "deny", reason: "not_implemented" };

  let actionDigest: string;
  try {
    actionDigest = createActionDigest(input);
  } catch {
    return { outcome: "deny", reason: "invalid_action" };
  }

  if (tool.riskTier <= 1 && (tool.sideEffect === "none" || tool.sideEffect === "draft")) {
    return { outcome: "allow", reason: "read_only_or_draft" };
  }
  if (tool.riskTier === 2) {
    return { outcome: "approval_required", reason: "owner_approval_required", actionDigest };
  }
  return { outcome: "explicit_confirmation_required", reason: "high_impact_action", actionDigest };
}

export function getAgentToolCatalog(agentKey: string) {
  const agent = getAgent(agentKey);
  if (!agent) return null;
  return toolRegistry
    .filter((tool) => agent.tools.includes(tool.key))
    .map(({ key, label, description, riskTier, enabled, implemented, sideEffect, targetScope }) => ({
      key, label, description, riskTier, enabled, implemented, sideEffect, targetScope,
    }));
}
