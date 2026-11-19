import { NextResponse } from "next/server";
import { getOwnerContext } from "@/lib/server/owner";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store, max-age=0" };
const repository = process.env.GITHUB_READONLY_REPOSITORY || "bikash-ananda/personal-webpage";

type GitHubRepository = {
  full_name: string;
  html_url: string;
  description: string | null;
  default_branch: string;
  stargazers_count: number;
  open_issues_count: number;
  private: boolean;
  updated_at: string;
};

type GitHubCommit = {
  sha: string;
  html_url: string;
  commit: { message: string; author: { name: string; date: string } | null };
};

export async function GET() {
  const owner = await getOwnerContext();
  if (!owner.ok) {
    return NextResponse.json({ error: owner.error }, { status: owner.status, headers: noStore });
  }

  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    return NextResponse.json({ error: "GitHub repository configuration is invalid." }, { status: 503, headers: noStore });
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Bikash-Personal-OS-ReadOnly-Integration",
  };
  if (process.env.GITHUB_READONLY_TOKEN) {
    headers.Authorization = "Bearer " + process.env.GITHUB_READONLY_TOKEN;
  }

  try {
    const [repoResponse, commitsResponse] = await Promise.all([
      fetch("https://api.github.com/repos/" + repository, {
        headers, signal: AbortSignal.timeout(8000), cache: "no-store",
      }),
      fetch("https://api.github.com/repos/" + repository + "/commits?per_page=5", {
        headers, signal: AbortSignal.timeout(8000), cache: "no-store",
      }),
    ]);

    if (!repoResponse.ok || !commitsResponse.ok) {
      const status = repoResponse.status === 404 || commitsResponse.status === 404 ? 404 : 502;
      return NextResponse.json({
        configured: true,
        connected: false,
        repository,
        error: status === 404
          ? "Repository not found or not accessible. Check its visibility and read-only token."
          : "GitHub API is temporarily unavailable or rate-limited.",
      }, { status, headers: noStore });
    }

    const repoData = await repoResponse.json() as GitHubRepository;
    const commits = await commitsResponse.json() as GitHubCommit[];
    return NextResponse.json({
      configured: true,
      connected: true,
      permission: "read-only",
      repository: {
        name: repoData.full_name,
        url: repoData.html_url,
        description: repoData.description,
        defaultBranch: repoData.default_branch,
        stars: repoData.stargazers_count,
        openIssuesAndPullRequests: repoData.open_issues_count,
        private: repoData.private,
        updatedAt: repoData.updated_at,
      },
      recentCommits: commits.slice(0, 5).map((commit) => ({
        sha: commit.sha.slice(0, 7),
        url: commit.html_url,
        message: commit.commit.message.split("\n")[0].slice(0, 180),
        author: commit.commit.author?.name || "Unknown",
        date: commit.commit.author?.date || null,
      })),
    }, { headers: noStore });
  } catch {
    return NextResponse.json({
      configured: true,
      connected: false,
      repository,
      error: "GitHub connection timed out or could not be reached.",
    }, { status: 502, headers: noStore });
  }
}
