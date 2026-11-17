import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, isAuthConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!isAuthConfigured()) {
    redirect("/login?setup=required");
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  if (session.user.email.toLowerCase() !== "bikashananda40@gmail.com") {
    redirect("/login?error=unauthorized");
  }

  return children;
}
