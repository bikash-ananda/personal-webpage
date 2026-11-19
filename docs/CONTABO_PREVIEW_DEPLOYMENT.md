# Contabo public-preview deployment

This is an isolated, temporary public-preview deployment for the Personal AI OS.
It does not enable owner authentication, private data, AI providers, or write APIs.

## Safety boundaries

- Deploy only this branch after its CI is green.
- Use the dedicated Compose project `personal-ai-os-preview`.
- The app binds only to host loopback on port `3107`; the shared host Caddy remains the only public reverse proxy.
- No database, Redis, vector store, extra proxy, or background worker is created.
- No existing project containers, networks, volumes, Caddy sites, or databases are modified.
- Do not add production secrets for this preview. With auth variables absent, owner-only routes fail closed and the workspace stays in read-only preview mode.
- Do not expose port 3107 publicly.

## Preflight on the VPS

Run read-only checks before building:

```bash
hostname
git -C /opt/personal-ai-os status --short --branch 2>/dev/null || true
docker --version
docker compose version
ss -ltnp
docker ps --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}'
free -h
df -h /
```

Confirm port 3107 is unused and the directory `/opt/personal-ai-os` does not contain another application. Inspect the existing Caddyfile and any site block for `bikashbhattarai.com.np` before editing it.

## Build and start

Clone/check out only `integration/bikash-personal-ai-os` into `/opt/personal-ai-os`.
Do not merge into `main`.

```bash
cd /opt/personal-ai-os
git status --short --branch
git rev-parse --short HEAD
docker compose -p personal-ai-os-preview -f infra/docker-compose.preview.yml config
docker compose -p personal-ai-os-preview -f infra/docker-compose.preview.yml up -d --build
docker compose -p personal-ai-os-preview -f infra/docker-compose.preview.yml ps
curl -fsS http://127.0.0.1:3107/ >/dev/null
```

The expected commit must be the exact CI-green integration branch commit approved for rollout. Do not continue if the build fails, port 3107 is occupied, or the Compose configuration differs from this file.

## Caddy

Only after the app is healthy, add or update the existing site block for `bikashbhattarai.com.np` to proxy to `127.0.0.1:3107`. Preserve every other site block and keep the existing Caddy service. Validate with `caddy validate --config /etc/caddy/Caddyfile` before reloading Caddy. Do not start a second Caddy process or container.

## Public-preview limitations

- Public landing pages and read-only workspace preview are available.
- Owner login returns unavailable until a dedicated PostgreSQL database, Better Auth schema, SMTP sender and end-to-end authentication tests are completed.
- Real owner projects/tasks/hardware data remain unavailable.
- AI providers remain unconfigured and external providers remain disabled.
- Agent execution, messaging, computer automation and IoT actuation remain disabled.
- Do not put database credentials, SMTP passwords, API keys or auth secrets into this preview.

## Rollback

```bash
docker compose -p personal-ai-os-preview -f infra/docker-compose.preview.yml down
```

Remove only the Personal AI OS Caddy site block if it was added, validate the Caddyfile, then reload the existing Caddy service. Never use broad Docker prune commands.

## Automatic deployment from GitHub

The `Personal OS CI` workflow deploys only pushes to
`integration/bikash-personal-ai-os`, and only after both validation jobs pass.
The deploy job sends the exact tested commit SHA over SSH. It does not deploy
`main`, pull arbitrary branches, run database migrations, or change Caddy.
The VPS-side forced-command script accepts only the current integration-branch
tip, builds the isolated Compose project, checks both HTTP and Docker health,
and attempts to restore the previous commit if the new deployment fails.

### One-time VPS setup

Run as root after reviewing `infra/personal-ai-os-deploy.sh`:

1. Create a dedicated `personal-ai-deploy` account with Docker access.
2. Install the deployment script as root-owned
   `/usr/local/sbin/personal-ai-os-deploy`.
3. Generate a dedicated Ed25519 key for GitHub Actions and add its public key
   to the deploy account's `authorized_keys` with a forced command pointing
   to that script and forwarding/PTY disabled.
4. Ensure `/opt/personal-ai-os` is owned by `personal-ai-deploy` so Git can
   fetch and check out the integration branch.

Do not reuse a personal SSH key or the root login key.

### Required GitHub Actions secrets

Add these repository secrets in **Settings → Secrets and variables → Actions**:

- `VPS_DEPLOY_HOST`: VPS IP address or SSH hostname.
- `VPS_DEPLOY_USER`: `personal-ai-deploy`.
- `VPS_DEPLOY_KEY`: private half of the dedicated Ed25519 key.
- `VPS_DEPLOY_KNOWN_HOSTS`: pinned SSH host-key line for the VPS, verified
  against the host-key fingerprint displayed by the VPS.

The private key must be pasted directly into the GitHub secret UI and must
never be committed or sent in chat. Verify the host-key fingerprint out of
band; do not trust an unverified `ssh-keyscan` result.

After adding the VPS account and all four secrets, push a new commit to the
integration branch to trigger the first automatic deployment. Inspect the
`Personal OS CI` workflow run; deployment is complete only when its
`Deploy Personal AI OS preview` job succeeds and the VPS container is healthy.
