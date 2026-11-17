import { headers } from "next/headers";
import { auth, isAuthConfigured } from "@/lib/auth";

export type OwnerContext =
  | { ok: true; ownerId: string }
  | { ok: false; status: 401 | 503; error: string };

export async function getOwnerContext(): Promise<OwnerContext> {
  if (!isAuthConfigured()) {
    return { ok: false, status: 503, error: "Authentication and database are not configured." };
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.email.toLowerCase() !== "bikashananda40@gmail.com") {
    return { ok: false, status: 401, error: "Authentication required." };
  }

  return { ok: true, ownerId: session.user.id };
}
