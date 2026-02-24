#!/usr/bin/env pwsh
# ==========================================================================
# Clim Protocol — Frontend Deploy (GitHub Pages)
# ==========================================================================
# This script builds the Next.js frontend and pushes to main,
# which triggers the GitHub Actions workflow (.github/workflows/deploy.yml)
# to deploy to GitHub Pages automatically.
#
# Usage: .\deploy-frontend.ps1
# ==========================================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Clim Protocol — Frontend Deploy" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Build locally first to catch errors
Write-Host "[1/3] Building frontend locally..." -ForegroundColor Yellow
Push-Location frontend

if (-not (Test-Path "node_modules")) {
  Write-Host "  Installing dependencies..." -ForegroundColor DarkGray
  npm ci
  if ($LASTEXITCODE -ne 0) { Pop-Location; throw "npm ci failed" }
}

$env:NODE_ENV = "production"
npm run build
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "Build failed! Fix errors before deploying." }

Pop-Location
Write-Host "  Build successful!" -ForegroundColor Green

# 2. Check git status
Write-Host ""
Write-Host "[2/3] Checking git status..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
  Write-Host "  Uncommitted changes detected:" -ForegroundColor DarkYellow
  git status --short
  Write-Host ""
  $confirm = Read-Host "  Commit all changes and deploy? (y/N)"
  if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "  Aborted." -ForegroundColor Red
    exit 1
  }
  git add -A
  $msg = Read-Host "  Commit message (default: 'deploy: update frontend')"
  if (-not $msg) { $msg = "deploy: update frontend" }
  git commit -m $msg
}
else {
  Write-Host "  Working tree clean." -ForegroundColor Green
}

# 3. Push to main
Write-Host ""
Write-Host "[3/3] Pushing to main (triggers GitHub Pages deploy)..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -ne 0) { throw "Push failed!" }

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Deploy triggered!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  GitHub Actions will build and deploy to Pages." -ForegroundColor DarkGray
Write-Host "  Check progress: https://github.com/<your-user>/climprotocol/actions" -ForegroundColor DarkGray
Write-Host "  Live URL: https://<your-user>.github.io/climprotocol/" -ForegroundColor DarkGray
Write-Host ""
