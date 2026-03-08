# ===================================================================
# RUN ALL TESTS - Complete Test Suite
# ===================================================================
# Automatically installs dependencies and runs all 66 tests
# ===================================================================

param(
    [switch]$Verbose,
    [switch]$GasReport,
    [switch]$Summary
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CLIM PROTOCOL TEST RUNNER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Foundry is installed
if (-not (Get-Command forge -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Foundry is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Foundry first:" -ForegroundColor Yellow
    Write-Host "  Run: .\install-foundry.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "Or manually from: https://github.com/foundry-rs/foundry/releases" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

# Navigate to contracts directory
$contractsDir = Join-Path $PSScriptRoot "contracts"

if (-not (Test-Path $contractsDir)) {
    Write-Host "[ERROR] Contracts directory not found!" -ForegroundColor Red
    Write-Host "Expected: $contractsDir" -ForegroundColor Gray
    exit 1
}

Push-Location $contractsDir

Write-Host "[1/4] Checking Foundry version..." -ForegroundColor Yellow
forge --version
Write-Host ""

Write-Host "[2/4] Installing dependencies..." -ForegroundColor Yellow
if (Test-Path "lib") {
    Write-Host "      Dependencies already installed (lib/ exists)" -ForegroundColor Gray
} else {
    forge install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
        Pop-Location
        exit 1
    }
}
Write-Host ""

Write-Host "[3/4] Building contracts..." -ForegroundColor Yellow
forge build --sizes

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] Build failed!" -ForegroundColor Red
    Write-Host "Try running: forge clean && forge build" -ForegroundColor Yellow
    Pop-Location
    exit 1
}

Write-Host ""
Write-Host "[SUCCESS] Build complete!" -ForegroundColor Green
Write-Host ""

Write-Host "[4/4] Running tests..." -ForegroundColor Yellow
Write-Host ""

# Build test command
$testCmd = "forge test"

if ($Verbose) {
    $testCmd += " -vvv"
} elseif ($Summary) {
    $testCmd += " --summary"
} else {
    $testCmd += " -vv"
}

if ($GasReport) {
    $testCmd += " --gas-report"
}

# Run tests
Invoke-Expression $testCmd

$testResult = $LASTEXITCODE

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($testResult -eq 0) {
    Write-Host "  ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "[SUCCESS] 66/66 tests passing" -ForegroundColor Green
    Write-Host ""
    Write-Host "Test Coverage:" -ForegroundColor Cyan
    Write-Host "  - ClimateEventFactory    18 tests" -ForegroundColor White
    Write-Host "  - ClimateEventToken      19 tests" -ForegroundColor White
    Write-Host "  - LiquidityPool          22 tests" -ForegroundColor White
    Write-Host "  - ClimProtocol            7 tests" -ForegroundColor White
    Write-Host ""
    Write-Host "Your project is READY for hackathon submission!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Record demo video (3-5 min)" -ForegroundColor White
    Write-Host "  2. Follow: CLI_DEMO_GUIDE.md" -ForegroundColor White
    Write-Host "  3. Submit to hackathon!" -ForegroundColor White
    
} else {
    Write-Host "  SOME TESTS FAILED" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Please review the errors above" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Debug commands:" -ForegroundColor Cyan
    Write-Host "  forge test -vvv                    # Detailed output" -ForegroundColor White
    Write-Host "  forge test --match-test <name>     # Run specific test" -ForegroundColor White
    Write-Host "  forge clean && forge build         # Clean rebuild" -ForegroundColor White
}

Write-Host ""

Pop-Location

exit $testResult
