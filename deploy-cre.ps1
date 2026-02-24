#!/usr/bin/env pwsh
# ==========================================================================
# Clim Protocol — CRE Workflow Deploy
# ==========================================================================
# Deploys the Chainlink CRE (Compute Runtime Environment) workflow
# that automates climate event settlement.
#
# Prerequisites:
#   1. CRE CLI installed: npm i -g @chainlink/cre-cli
#   2. Authenticated: cre auth login
#   3. Organization has FULL_ACCESS (not GATED)
#   4. Private key configured in cre-workflow/.env
#
# Usage:
#   .\deploy-cre.ps1                  # Deploy to staging
#   .\deploy-cre.ps1 -Production      # Deploy to production
# ==========================================================================

param(
    [switch]$Production,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Clim Protocol — CRE Workflow Deploy" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$target = if ($Production) { "production-settings" } else { "staging-settings" }
$targetLabel = if ($Production) { "PRODUCTION" } else { "STAGING" }

# 1. Pre-flight checks
Write-Host "[1/5] Pre-flight checks..." -ForegroundColor Yellow

# Check CRE CLI
try {
    $creVersion = cre version 2>&1
    Write-Host "  CRE CLI: $creVersion" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: CRE CLI not found. Install with: npm i -g @chainlink/cre-cli" -ForegroundColor Red
    exit 1
}

# Check authentication
try {
    $whoami = cre auth whoami 2>&1
    Write-Host "  Auth: $whoami" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Not authenticated. Run: cre auth login" -ForegroundColor Red
    exit 1
}

# 2. Check .env
Write-Host ""
Write-Host "[2/5] Checking environment..." -ForegroundColor Yellow
Push-Location cre-workflow

if (-not (Test-Path ".env")) {
    Write-Host "  ERROR: cre-workflow/.env not found!" -ForegroundColor Red
    Write-Host "  Create it with:" -ForegroundColor DarkGray
    Write-Host "    CRE_ETH_PRIVATE_KEY=<your-funded-sepolia-private-key>" -ForegroundColor DarkGray
    Pop-Location
    exit 1
}

$envContent = Get-Content ".env" -Raw
if ($envContent -match "0000000000000000000000000000000000000000000000000000000000000001") {
    Write-Host "  WARNING: .env has dummy private key!" -ForegroundColor Red
    Write-Host "  Replace CRE_ETH_PRIVATE_KEY with a real funded Sepolia key." -ForegroundColor DarkYellow
    $confirm = Read-Host "  Continue anyway? (y/N)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Pop-Location
        exit 1
    }
}

Write-Host "  Environment OK" -ForegroundColor Green

# 3. Validate workflow
Write-Host ""
Write-Host "[3/5] Validating workflow artifacts..." -ForegroundColor Yellow

$requiredFiles = @(
    "my-workflow/main.ts",
    "my-workflow/config.json",
    "my-workflow/workflow.yaml",
    "project.yaml"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  OK: $file" -ForegroundColor Green
    } else {
        Write-Host "  MISSING: $file" -ForegroundColor Red
        Pop-Location
        exit 1
    }
}

# 4. Show config summary
Write-Host ""
Write-Host "[4/5] Deploy configuration..." -ForegroundColor Yellow
Write-Host "  Target:    $targetLabel" -ForegroundColor White
Write-Host "  Workflow:  clim-protocol-settlement-workflow" -ForegroundColor White
Write-Host "  Chain:     ethereum-testnet-sepolia" -ForegroundColor White

$config = Get-Content "my-workflow/config.json" | ConvertFrom-Json
foreach ($evm in $config.evms) {
    Write-Host "  Protocol:  $($evm.protocolAddress)" -ForegroundColor DarkGray
    Write-Host "  Settlement: $($evm.settlementAddress)" -ForegroundColor DarkGray
    Write-Host "  Oracle:    $($evm.oracleAddress)" -ForegroundColor DarkGray
    Write-Host "  Factory:   $($evm.factoryAddress)" -ForegroundColor DarkGray
    Write-Host "  Schedule:  $($config.schedule)" -ForegroundColor DarkGray
}

# 5. Deploy
Write-Host ""
Write-Host "[5/5] Deploying workflow..." -ForegroundColor Yellow

if ($DryRun) {
    Write-Host "  DRY RUN — skipping actual deploy." -ForegroundColor DarkYellow
    Write-Host "  Command would be:" -ForegroundColor DarkGray
    Write-Host "    cre workflow deploy ./my-workflow --yes -T $target -v" -ForegroundColor DarkGray
    Pop-Location
    exit 0
}

Write-Host "  Target: $targetLabel" -ForegroundColor White
Write-Host ""

cre workflow deploy ./my-workflow --yes -T $target -v
$deployResult = $LASTEXITCODE

Pop-Location

if ($deployResult -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  CRE Workflow Deployed!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  The workflow will run on schedule: $($config.schedule)" -ForegroundColor DarkGray
    Write-Host "  Monitor: cre workflow list" -ForegroundColor DarkGray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  Deploy FAILED" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Common issues:" -ForegroundColor DarkYellow
    Write-Host "    - Organization is GATED (request access: https://cre.chain.link/request-access)" -ForegroundColor DarkGray
    Write-Host "    - Invalid private key in .env" -ForegroundColor DarkGray
    Write-Host "    - Workflow build errors in main.ts" -ForegroundColor DarkGray
    Write-Host ""
    exit 1
}
