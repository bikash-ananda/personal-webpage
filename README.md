# Bikash Personal OS

A unified public identity and private digital workspace for Bikash Bhattarai.

**Canonical domain:** https://bikashbhattarai.com.np  
**Repository:** https://github.com/bikash-ananda/personal-webpage  
**Active development branch:** `integration/bikash-personal-ai-os`

## Product surfaces

- Public profile: biography, work, projects, research and contact.
- Private workspace: command centre, assistant, specialist agents, projects, tasks, research, knowledge, automations, approvals, activity and integrations.

Both surfaces share a design system. Private data and actions must remain behind server-side authentication and authorization.

## Local development

Requirements: Node.js 22+ and npm.

```powershell
npm install
npm run dev
```

Open http://localhost:3000.

Validation:

```powershell
npm run typecheck
npm run lint
npm run build
```

## Current status

The current branch contains the first frontend foundation and visual preview. Authentication, persistent storage, model providers, agent execution and live integrations are not yet implemented. See [Implementation Status](docs/IMPLEMENTATION_STATUS.md), [Product Architecture](docs/PRODUCT_ARCHITECTURE.md) and [Delivery Roadmap](docs/DELIVERY_ROADMAP.md).

## Deployment safety

No VPS deployment, DNS update, Caddy change, firewall change, or production service modification is part of this stage. Future deployment must use a dedicated directory, isolated Compose project/network/volumes, a dedicated database and a loopback-only application port. The shared host Caddy and all unrelated projects must remain untouched.
