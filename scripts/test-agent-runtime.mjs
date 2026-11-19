import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = new URL("../", import.meta.url);

async function loadTypeScript(relativePath, mocks = {}) {
  const filename = new URL(relativePath, root).pathname;
  const source = await readFile(filename, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  }).outputText;
  const compiledModule = { exports: {} };
  const localRequire = (specifier) => {
    if (Object.prototype.hasOwnProperty.call(mocks, specifier)) return mocks[specifier];
    return require(specifier);
  };
  const wrapper = vm.runInThisContext(`(function(exports, require, module, __filename, __dirname) { ${compiled}\n})`, { filename });
  wrapper(compiledModule.exports, localRequire, compiledModule, filename, new URL(".", `file://${filename}`).pathname);
  return compiledModule.exports;
}

const agents = await loadTypeScript("src/lib/agents/registry.ts");
const runtime = await loadTypeScript("src/lib/agents/runtime.ts", {
  "@/lib/agents/registry": agents,
});

const findTool = (key) => runtime.toolRegistry.find((tool) => tool.key === key);
const setReady = (key, ready) => {
  const tool = findTool(key);
  tool.enabled = ready;
  tool.implemented = ready;
  return tool;
};

assert.deepEqual(
  runtime.evaluateToolRequest({ ownerId: "owner-1", agentKey: "missing", toolKey: "project_read", target: "owner", args: {} }),
  { outcome: "deny", reason: "unknown_agent" },
  "unknown agents must be denied",
);

assert.deepEqual(
  runtime.evaluateToolRequest({ ownerId: "owner-1", agentKey: "chief_of_staff", toolKey: "github_read", target: "repo:demo", args: {} }),
  { outcome: "deny", reason: "not_allowlisted" },
  "agents must not call tools outside their allowlist",
);

for (const toolKey of ["project_read", "task_read"]) {
  assert.deepEqual(
    runtime.evaluateToolRequest({ ownerId: "owner-1", agentKey: "chief_of_staff", toolKey, target: "owner_workspace", args: {} }),
    { outcome: "allow", reason: "read_only_or_draft" },
    toolKey + " must be executable as a bounded owner-scoped read-only tool",
  );
}
assert.deepEqual(
  runtime.evaluateToolRequest({ ownerId: "owner-1", agentKey: "engineering", toolKey: "github_read", target: "bikash-ananda/personal-webpage", args: {} }),
  { outcome: "allow", reason: "read_only_or_draft" },
  "engineering must be able to read the fixed allowlisted GitHub repository",
);
assert.deepEqual(
  runtime.evaluateToolRequest({ ownerId: "owner-1", agentKey: "chief_of_staff", toolKey: "github_read", target: "bikash-ananda/personal-webpage", args: {} }),
  { outcome: "deny", reason: "not_allowlisted" },
  "Chief of Staff must not gain GitHub access outside its declared tool allowlist",
);
assert.deepEqual(
  runtime.evaluateToolRequest({ ownerId: "owner-1", agentKey: "infrastructure", toolKey: "server_deploy", target: "production", args: {} }),
  { outcome: "deny", reason: "disabled" },
  "high-risk tools must remain disabled until a dedicated approval and execution path exists",
);

const digestA = runtime.createActionDigest({
  ownerId: "owner-1", agentKey: "engineering", toolKey: "github_read",
  target: "repo:demo", args: { path: "src", depth: 2 },
});
const digestB = runtime.createActionDigest({
  ownerId: "owner-1", agentKey: "engineering", toolKey: "github_read",
  target: "repo:demo", args: { depth: 2, path: "src" },
});
assert.equal(digestA, digestB, "object key order must not change the action digest");
assert.notEqual(digestA, runtime.createActionDigest({
  ownerId: "owner-1", agentKey: "engineering", toolKey: "github_read",
  target: "repo:demo", args: { depth: 3, path: "src" },
}), "changing arguments must change the action digest");
assert.notEqual(digestA, runtime.createActionDigest({
  ownerId: "owner-2", agentKey: "engineering", toolKey: "github_read",
  target: "repo:demo", args: { path: "src", depth: 2 },
}), "changing owner identity must change the action digest");

assert.throws(() => runtime.createActionDigest({
  ownerId: "owner-1", agentKey: "engineering", toolKey: "github_read",
  target: "repo:demo", args: { unsafe: new Date() },
}), /plain JSON objects/);
assert.throws(() => runtime.createActionDigest({
  ownerId: "owner-1", agentKey: "engineering", toolKey: "github_read",
  target: "repo:demo", args: { unsafe: Number.NaN },
}), /finite numbers/);
const sparse = [];
sparse.length = 1;
assert.throws(() => runtime.createActionDigest({
  ownerId: "owner-1", agentKey: "engineering", toolKey: "github_read",
  target: "repo:demo", args: sparse,
}), /Sparse arrays/);

const knowledge = setReady("knowledge_write", true);
try {
  const decision = runtime.evaluateToolRequest({
    ownerId: "owner-1", agentKey: "knowledge", toolKey: "knowledge_write",
    target: "owner-knowledge", args: { title: "Test", body: "Draft" },
  });
  assert.equal(decision.outcome, "approval_required", "tier-two writes require owner approval");
  assert.equal(decision.actionDigest.length, 64, "approval must bind a SHA-256 action digest");
} finally {
  knowledge.enabled = false;
  knowledge.implemented = false;
}

const deployment = setReady("server_deploy", true);
try {
  const decision = runtime.evaluateToolRequest({
    ownerId: "owner-1", agentKey: "infrastructure", toolKey: "server_deploy",
    target: "production", args: { service: "personal-os" },
  });
  assert.equal(decision.outcome, "explicit_confirmation_required", "production deployment requires explicit confirmation");
} finally {
  deployment.enabled = false;
  deployment.implemented = false;
}

const actuator = setReady("iot_actuate", true);
try {
  const decision = runtime.evaluateToolRequest({
    ownerId: "owner-1", agentKey: "agriculture_iot", toolKey: "iot_actuate",
    target: "greenhouse:relay-1", args: { state: "on" },
  });
  assert.equal(decision.outcome, "explicit_confirmation_required", "physical actuator changes require explicit confirmation");
} finally {
  actuator.enabled = false;
  actuator.implemented = false;
}

console.log("Agent runtime policy tests passed.");
