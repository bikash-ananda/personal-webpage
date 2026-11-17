/**
 * Temporary public preview gate.
 *
 * Workspace pages are browseable without an account during the design/review phase.
 * All data-changing API routes keep their server-side owner/session checks. Re-enable
 * the owner-only layout gate before enabling private data or production writes.
 */
export const dynamic = "force-dynamic";

export default function WorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
