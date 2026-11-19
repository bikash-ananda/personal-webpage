param(
  [switch]$StartOllama,
  [string]$Model = ""
)

$ErrorActionPreference = "Stop"
$baseUrl = "http://127.0.0.1:11434"
Write-Host ""
Write-Host "BIKASH OS - WINDOWS LOCAL AI CHECK" -ForegroundColor Cyan
Write-Host "This script checks your local Ollama setup. It does not expose a public port, install MCP servers, or control your computer."
Write-Host ""

$ollama = Get-Command ollama -ErrorAction SilentlyContinue
if (-not $ollama) {
  Write-Host "[MISSING] Ollama CLI not found." -ForegroundColor Yellow
  Write-Host "Install Ollama for Windows from https://ollama.com/download, then reopen PowerShell."
  exit 1
}

Write-Host "[OK] Ollama CLI: $($ollama.Source)" -ForegroundColor Green
$healthy = $false
try {
  $null = Invoke-RestMethod -Uri "$baseUrl/api/tags" -TimeoutSec 3
  $healthy = $true
} catch {
  if ($StartOllama) {
    Write-Host "[START] Starting Ollama locally..." -ForegroundColor Cyan
    Start-Process -FilePath $ollama.Source -ArgumentList "serve" -WindowStyle Hidden
    for ($i = 0; $i -lt 15; $i++) {
      Start-Sleep -Seconds 1
      try {
        $null = Invoke-RestMethod -Uri "$baseUrl/api/tags" -TimeoutSec 2
        $healthy = $true
        break
      } catch {}
    }
  }
}

if (-not $healthy) {
  Write-Host "[OFFLINE] Ollama is installed but its local API is not responding." -ForegroundColor Yellow
  Write-Host "Run: ollama serve"
  Write-Host "Or rerun this script with -StartOllama."
  exit 2
}

$inventory = Invoke-RestMethod -Uri "$baseUrl/api/tags" -TimeoutSec 5
Write-Host "[OK] Ollama local API is responding at $baseUrl" -ForegroundColor Green
if ($inventory.models.Count -eq 0) {
  Write-Host "[NO MODEL] No local model is downloaded yet." -ForegroundColor Yellow
  Write-Host "Choose a model that fits your PC RAM before downloading it."
} else {
  Write-Host "Installed local models:" -ForegroundColor Cyan
  $inventory.models | ForEach-Object { Write-Host (" - " + $_.name) }
}

if ($Model) {
  $found = $inventory.models | Where-Object { $_.name -eq $Model }
  if (-not $found) {
    Write-Host "[NOT FOUND] Model '$Model' is not installed. This script will not download models automatically." -ForegroundColor Yellow
    exit 3
  }
  Write-Host "[READY] Requested model '$Model' is installed." -ForegroundColor Green
}

Write-Host ""
Write-Host "LOCAL CHECK COMPLETE. No cloud provider, MCP server, startup task, or remote tunnel was enabled." -ForegroundColor Green
