import { NextResponse } from "next/server";
import { getConfiguredAiProviders } from "@/lib/ai/provider-gateway";
import { getOwnerContext } from "@/lib/server/owner";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store, max-age=0" };

export async function GET() {
  const owner = await getOwnerContext();
  if (!owner.ok) {
    return NextResponse.json({ error: owner.error }, { status: owner.status, headers: noStore });
  }

  const providers = getConfiguredAiProviders();
  return NextResponse.json({
    externalProvidersAllowed: process.env.AI_ALLOW_EXTERNAL_PROVIDERS === "true",
    configuredCount: providers.length,
    providers: providers.map(({ id, model }) => ({
      id,
      model,
      kind: id === "ollama" ? "local" : "hosted",
      status: "configured",
    })),
  }, { headers: noStore });
}
