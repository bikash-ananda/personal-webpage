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
