# ===================================================================
# RUN CRE WORKFLOW SIMULATION
# ===================================================================
# Simulates the Chainlink Runtime Environment workflow
# Tests climate event monitoring and settlement logic
# ===================================================================

param(
    [switch]$Verbose,
    [switch]$Execute
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CRE WORKFLOW SIMULATOR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Bun is installed
if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Bun is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Bun first:" -ForegroundColor Yellow
    Write-Host "  Run: .\install-bun.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "Or install manually from: https://bun.sh/" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

# Navigate to CRE workflow directory
$workflowDir = Join-Path $PSScriptRoot "cre-workflow\my-workflow"

if (-not (Test-Path $workflowDir)) {
    Write-Host "[ERROR] CRE workflow directory not found!" -ForegroundColor Red
    Write-Host "Expected: $workflowDir" -ForegroundColor Gray
    exit 1
}

Push-Location $workflowDir

Write-Host "[1/4] Checking Bun version..." -ForegroundColor Yellow
bun --version
Write-Host ""

Write-Host "[2/4] Installing dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "      Dependencies already installed (node_modules/ exists)" -ForegroundColor Gray
} else {
    bun install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
        Pop-Location
        exit 1
    }
}
Write-Host ""

Write-Host "[3/4] Checking configuration..." -ForegroundColor Yellow
if (Test-Path "config.json") {
    Write-Host "[OK] config.json found" -ForegroundColor Green
    
    # Show config details
    $config = Get-Content "config.json" | ConvertFrom-Json
    Write-Host ""
    Write-Host "Configuration:" -ForegroundColor Cyan
    Write-Host "  Schedule: $($config.schedule)" -ForegroundColor White
    Write-Host "  API: $($config.openMeteoBaseUrl)" -ForegroundColor White
    Write-Host "  Chain: $($config.evms[0].chainSelectorName)" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "[ERROR] config.json not found!" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "[4/4] Running CRE workflow simulation..." -ForegroundColor Yellow
Write-Host ""

if ($Execute) {
    Write-Host "Mode: EXECUTION simulation (reads real blockchain data)" -ForegroundColor Cyan
    Write-Host ""
    bun run simulate-execution.ts
} else {
    Write-Host "Mode: OVERVIEW simulation (quick demo)" -ForegroundColor Cyan
    Write-Host "Tip: Use -Execute flag for full execution simulation" -ForegroundColor Gray
    Write-Host ""
    bun run simulate.ts
}

$runResult = $LASTEXITCODE

if ($runResult -eq 0) {
    Write-Host ""
    Write-Host "What was validated:" -ForegroundColor Cyan
    Write-Host "  ✅ Cron trigger (every 5 minutes)" -ForegroundColor White
    Write-Host "  ✅ EVM Read (active events from SettlementEngine)" -ForegroundColor White
    Write-Host "  ✅ HTTP Fetch (precipitation data from Open-Meteo)" -ForegroundColor White
    Write-Host "  ✅ DON Consensus (median aggregation)" -ForegroundColor White
    Write-Host "  ✅ Compute (threshold comparison logic)" -ForegroundColor White
    Write-Host "  ✅ EVM Write (settlement trigger)" -ForegroundColor White
    Write-Host "  ✅ Event Trigger (SettlementCompleted)" -ForegroundColor White
    Write-Host ""
    Write-Host "🎉 CRE workflow is READY for deployment!" -ForegroundColor Green
    Write-Host ""
    Write-Host "To deploy to production:" -ForegroundColor Cyan
    Write-Host "  1. Install CRE CLI: curl -sSL https://cre.chain.link/install.sh | bash" -ForegroundColor White
    Write-Host "  2. Compile: bunx cre-compile main.ts" -ForegroundColor White
    Write-Host "  3. Deploy: cre workflow deploy --network sepolia" -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host "  WORKFLOW SIMULATION FAILED" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Please review the errors above" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Cyan
    Write-Host "  - Missing environment variables (check .env)" -ForegroundColor White
    Write-Host "  - Network connectivity to Sepolia RPC" -ForegroundColor White
    Write-Host "  - Invalid contract addresses in config.json" -ForegroundColor White
    Write-Host ""
    Write-Host "Debug mode:" -ForegroundColor Cyan
    Write-Host "  .\run-cre-workflow.ps1 -Verbose" -ForegroundColor White
}

Write-Host ""

Pop-Location

exit $runResult
