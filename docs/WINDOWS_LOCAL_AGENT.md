# Windows Local Agent — phase 1

The Windows PC is the local execution side of Personal AI OS. The Contabo VPS remains a lightweight control plane; it must not run a local LLM or a collection of always-on MCP servers.

## Phase 1: local model readiness

Requirements:
- Windows 10/11 and PowerShell 5.1+.
- Ollama for Windows, installed only when the owner chooses.
- A local model selected to fit the PC's available RAM/VRAM.

Run from the repository root:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\windows-local-agent.ps1
```

If Ollama is installed but not running:

```powershell
.\scripts\windows-local-agent.ps1 -StartOllama
```

To verify one already-installed model:

```powershell
.\scripts\windows-local-agent.ps1 -Model "your-installed-model-tag"
```

The script only checks the Ollama CLI and its loopback API at `127.0.0.1:11434`. With `-StartOllama`, it starts Ollama locally. It does not download models, create a Windows startup task, expose a public port, install MCP servers, or execute arbitrary commands.

## Phase 2: local agent runtime (next implementation)

- A user-started Windows process with explicit pairing to the owner workspace.
- Outbound authenticated connection only; no public inbound listener or router port forwarding.
- Local Ollama adapter and lazy/on-demand MCP process manager.
- Per-task allowlists and bounded tool schemas/output/timeouts.
- File and browser access disabled until individual permissions are granted.
- All writes and computer actions require action-time owner approval.
- Emergency stop and an inspectable local audit log.

## Pairing and security gates

Do not paste a VPS admin credential or broad GitHub token into the local agent. Pairing must use a revocable, narrowly scoped device credential, stored in Windows Credential Manager/DPAPI, with rotation and device revocation. The server must authenticate the device and enforce owner policy; model output can never grant itself permissions.

## Resource policy

- Ollama runs only when the owner starts it or explicitly enables its own Windows startup setting.
- MCP servers start only when a task needs them and stop after the task.
- No Docker Desktop, Redis, vector database, or always-on background worker is required for this phase.
- The web dashboard continues to work when the Windows PC is offline.
