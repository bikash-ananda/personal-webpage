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
  return value.trim().replace(/[/]+$/, "");
}

function isAllowedProviderUrl(id: AiProviderId, value: string): boolean {
  try {
    const url = new URL(value);
    if (url.username || url.password || url.search || url.hash) return false;
    if (id === "ollama") {
      return ["http:", "https:"].includes(url.protocol)
        && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    }
    const allowedHosts: Record<Exclude<AiProviderId, "ollama">, string[]> = {
      gemini: ["generativelanguage.googleapis.com"],
      groq: ["api.groq.com"],
      openrouter: ["openrouter.ai"],
      cloudflare: ["api.cloudflare.com", "gateway.ai.cloudflare.com"],
      nvidia: ["integrate.api.nvidia.com"],
    };
    return url.protocol === "https:"
      && (url.port === "" || url.port === "443")
      && allowedHosts[id].includes(url.hostname);
  } catch {
    return false;
  }
}

/**
 * Free-first provider discovery. A provider needs an explicit model and, for
 * hosted providers, an API key. Arbitrary custom endpoints are unsupported so
 * a paid API cannot be added accidentally.
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
    if (!baseUrl || !isAllowedProviderUrl(id, baseUrl)) continue;
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
  if (!Array.isArray(input.messages) || input.messages.length < 1 || input.messages.length > 30) {
    throw new AiGatewayError("AI requests must contain between 1 and 30 messages.");
  }
  let totalMessageChars = 0;
  for (const message of input.messages) {
    if (!message || !["system", "user", "assistant"].includes(message.role)
      || typeof message.content !== "string" || message.content.length > 12000) {
      throw new AiGatewayError("AI request contains an invalid or oversized message.");
    }
    totalMessageChars += message.content.length;
  }
  if (totalMessageChars > 30000) {
    throw new AiGatewayError("AI request exceeds the total message size limit.");
  }

  const providers = getConfiguredAiProviders(input.env);
  if (providers.length === 0) {
    throw new AiGatewayError("No free AI provider is configured. Configure a local Ollama model or a free-tier provider key and model.");
  }

  for (const provider of providers) {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (provider.apiKey) headers.Authorization = "Bearer " + provider.apiKey;
      const timeoutMs = Math.max(1000, Math.min(input.timeoutMs ?? 45000, 60000));
      const endpoint = provider.baseUrl + "/chat/completions";
      const requestBody = {
        model: provider.model,
        messages: input.messages,
        temperature: 0.2,
      };
      let response = await fetch(endpoint, {
        method: "POST",
        headers,
        signal: AbortSignal.timeout(timeoutMs),
        body: JSON.stringify({ ...requestBody, response_format: { type: "json_object" } }),
      });
      // Some OpenAI-compatible providers/models do not implement JSON mode.
      if (response.status === 400 || response.status === 422) {
        response = await fetch(endpoint, {
          method: "POST",
          headers,
          signal: AbortSignal.timeout(timeoutMs),
          body: JSON.stringify(requestBody),
        });
      }
      if (!response.ok) continue;
      const declaredLength = Number(response.headers.get("content-length") || "0");
      if (declaredLength > 256000) continue;
      const responseText = await response.text();
      if (responseText.length > 256000) continue;
      const payload = JSON.parse(responseText) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const completionContent = payload.choices?.[0]?.message?.content;
      if (typeof completionContent === "string" && completionContent.trim()) {
        return { content: completionContent, provider: provider.id, model: provider.model };
      }
    } catch {
      // A provider outage, timeout or incompatible response must not expose
      // secrets or prevent trying the next explicitly configured free provider.
    }
  }

  throw new AiGatewayError("All configured free AI providers are unavailable, rate-limited or returned an invalid response. Check provider quotas and configuration.");
}
