import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const filename = new URL("../src/lib/ai/provider-gateway.ts", import.meta.url).pathname;
const source = await readFile(filename, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  fileName: filename,
}).outputText;
const module = { exports: {} };
const wrapper = vm.runInThisContext(`(function(exports, require, module) { ${compiled}\n})`, { filename });
wrapper(module.exports, require, module);
const { getConfiguredAiProviders } = module.exports;

const localOnly = getConfiguredAiProviders({ OLLAMA_MODEL: "llama3" });
assert.deepEqual(localOnly.map((provider) => provider.id), ["ollama"], "local Ollama is available without external opt-in");

const blockedExternal = getConfiguredAiProviders({
  GEMINI_API_KEY: "test-key",
  GEMINI_MODEL: "gemini-test",
});
assert.equal(blockedExternal.length, 0, "external providers must be blocked by default");

const enabledExternal = getConfiguredAiProviders({
  AI_ALLOW_EXTERNAL_PROVIDERS: "true",
  AI_PROVIDER_ORDER: "gemini,groq",
  GEMINI_API_KEY: "test-gemini",
  GEMINI_MODEL: "gemini-test",
  GROQ_API_KEY: "test-groq",
  GROQ_MODEL: "groq-test",
});
assert.deepEqual(enabledExternal.map((provider) => provider.id), ["gemini", "groq"], "configured free providers follow owner-defined order");

const customEndpointIgnored = getConfiguredAiProviders({
  AI_ALLOW_EXTERNAL_PROVIDERS: "true",
  AI_PROVIDER_ORDER: "custom",
  AI_BASE_URL: "https://paid.example/v1",
  AI_MODEL: "paid-model",
});
assert.equal(customEndpointIgnored.length, 0, "arbitrary custom endpoints are unsupported to prevent accidental paid API use");

console.log("Free-first AI gateway policy tests passed.");
