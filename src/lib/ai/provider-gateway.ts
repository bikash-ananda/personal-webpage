export type AiProviderId = "ollama" | "gemini" | "groq" | "openrouter" | "cloudflare" | "nvidia";

export type AiMessage = { role: "system" | "user" | "assistant"; content: string };
export type AiProviderConfig = {
  id: AiProviderId;
  baseUrl: string;
  model: string;
  apiKey?: string;
};

type Env = Record<string, string | undefined>;

const FREE_PROVIDER_ORDER: AiProviderId[] = [
  "ollama", "gemini", "groq", "openrouter", "cloudflare", "nvidia",
];

const PROVIDER_ENV: Record<Exclude<AiProviderId, "custom">, {
  baseUrl: string;
  defaultBaseUrl?: string;
  model: string;
  apiKey: string;
}> = {
  ollama: { baseUrl: "OLLAMA_BASE_URL", defaultBaseUrl: "http://127.0.0.1:11434/v1", model: "OLLAMA_MODEL", apiKey: "" },
  gemini: { baseUrl: "GEMINI_BASE_URL", defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", model: "GEMINI_MODEL", apiKey: "GEMINI_API_KEY" },
  groq: { baseUrl: "GROQ_BASE_URL", defaultBaseUrl: "https://api.groq.com/openai/v1", model: "GROQ_MODEL", apiKey: "GROQ_API_KEY" },
  openrouter: { baseUrl: "OPENROUTER_BASE_URL", defaultBaseUrl: "https://openrouter.ai/api/v1", model: "OPENROUTER_MODEL", apiKey: "OPENROUTER_API_KEY" },
  cloudflare: { baseUrl: "CLOUDFLARE_BASE_URL", model: "CLOUDFLARE_MODEL", apiKey: "CLOUDFLARE_API_TOKEN" },
  nvidia: { baseUrl: "NVIDIA_BASE_URL", defaultBaseUrl: "https://integrate.api.nvidia.com/v1", model: "NVIDIA_MODEL", apiKey: "NVIDIA_API_KEY" },
};

function cleanBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

/**
 * Free-first provider discovery. A provider is never inferred from an API key
 * alone: it must have an explicit model configured. Paid/custom endpoints are
 * Custom endpoints are deliberately unsupported to avoid accidental paid APIs.
 */
export function getConfiguredAiProviders(env: Env = process.env): AiProviderConfig[] {
  const requestedOrder = (env.AI_PROVIDER_ORDER || FREE_PROVIDER_ORDER.join(","))
    .split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
  const order = requestedOrder.filter((value): value is AiProviderId =>
    ["ollama", "gemini", "groq", "openrouter", "cloudflare", "nvidia"].includes(value),
  );
  const providers: AiProviderConfig[] = [];

  for (const id of order) {
    if (id !== "ollama" && env.AI_ALLOW_EXTERNAL_PROVIDERS !== "true") continue;
    const names = PROVIDER_ENV[id];
    const baseUrl = cleanBaseUrl(env[names.baseUrl] || names.defaultBaseUrl || "");
    const model = env[names.model]?.trim() || "";
    const apiKey = names.apiKey ? env[names.apiKey]?.trim() : undefined;
    if (!baseUrl || !model) continue;
    if (id !== "ollama" && !apiKey) continue;
    providers.push({ id, baseUrl, model, apiKey: apiKey || undefined });
  }
  return providers;
}

export class AiGatewayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiGatewayError";
  }
}

export async function createAiChatCompletion(input: {
  messages: AiMessage[];
  timeoutMs?: number;
  env?: Env;
}): Promise<{ content: string; provider: AiProviderId; model: string }> {
  const providers = getConfiguredAiProviders(input.env);
  if (providers.length === 0) {
    throw new AiGatewayError("No free AI provider is configured. Configure a local Ollama model or a free-tier provider key and model.");
  }

  for (const provider of providers) {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (provider.apiKey) headers.Authorization = "Bearer " + provider.apiKey;
      const response = await fetch(provider.baseUrl + "/chat/completions", {
        method: "POST",
        headers,
        signal: AbortSignal.timeout(input.timeoutMs ?? 45000),
        body: JSON.stringify({
          model: provider.model,
          messages: input.messages,
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
      });
      if (!response.ok) continue;
      const payload = await response.json() as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = payload.choices?.[0]?.message?.content;
      if (typeof content === "string" && content.trim()) {
        return { content, provider: provider.id, model: provider.model };
      }
    } catch {
      // A provider outage, timeout or incompatible response must not expose
      // secrets or prevent trying the next explicitly configured free provider.
    }
  }

  throw new AiGatewayError("All configured free AI providers are unavailable, rate-limited or returned an invalid response. Check provider quotas and configuration.");
}
