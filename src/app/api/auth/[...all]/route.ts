import { toNextJsHandler } from "better-auth/next-js";
import { auth, isAuthConfigured } from "@/lib/auth";

const handler = toNextJsHandler(auth);

function unavailable() {
  return Response.json(
    { error: "Authentication is not configured on this environment." },
    { status: 503, headers: { "Cache-Control": "no-store" } }
  );
}

export const GET = (request: Request) =>
  isAuthConfigured() ? handler.GET(request) : unavailable();

export const POST = (request: Request) =>
  isAuthConfigured() ? handler.POST(request) : unavailable();
