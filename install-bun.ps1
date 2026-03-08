# ===================================================================
# INSTALL BUN - JavaScript Runtime for CRE Workflow
# ===================================================================
# Bun is required to run the Chainlink Runtime Environment workflow
# ===================================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BUN INSTALLER FOR WINDOWS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Bun is already installed
if (Get-Command bun -ErrorAction SilentlyContinue) {
    Write-Host "[OK] Bun is already installed!" -ForegroundColor Green
    bun --version
    Write-Host ""
    Write-Host "Do you want to update Bun? (y/n): " -NoNewline
    $update = Read-Host
    
    if ($update -eq 'y' -or $update -eq 'Y') {
        Write-Host ""
        Write-Host "Updating Bun..." -ForegroundColor Yellow
        bun upgrade
    }
    exit 0
}

Write-Host "[1/3] Downloading Bun installer..." -ForegroundColor Yellow
Write-Host ""

try {
    # Download and run Bun installer
    Write-Host "      Using official Bun installer for Windows..." -ForegroundColor Gray
    
    irm bun.sh/install.ps1 | iex
    
    Write-Host ""
    Write-Host "[2/3] Installation complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "[3/3] Verifying installation..." -ForegroundColor Yellow
    
    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    # Add Bun to PATH for this session
    $bunPath = "$env:USERPROFILE\.bun\bin"
    if (Test-Path $bunPath) {
        $env:Path = "$bunPath;$env:Path"
    }
    
    if (Get-Command bun -ErrorAction SilentlyContinue) {
        Write-Host ""
        Write-Host "[SUCCESS] Bun installed successfully!" -ForegroundColor Green
        Write-Host ""
        bun --version
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  INSTALLATION COMPLETE!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "  1. Close and reopen PowerShell" -ForegroundColor White
        Write-Host "  2. Run: cd cre-workflow\my-workflow" -ForegroundColor White
        Write-Host "  3. Run: bun install" -ForegroundColor White
        Write-Host "  4. Run: bun run main.ts" -ForegroundColor White
        Write-Host ""
        
    } else {
        Write-Host ""
        Write-Host "[INFO] Installation completed but bun not in PATH yet" -ForegroundColor Yellow
        Write-Host "       Please close and reopen PowerShell, then run: bun --version" -ForegroundColor Yellow
        Write-Host ""
    }
    
} catch {
    Write-Host ""
    Write-Host "[ERROR] Automatic installation failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual Installation:" -ForegroundColor Yellow
    Write-Host "1. Visit: https://bun.sh/" -ForegroundColor White
    Write-Host "2. Download Windows installer" -ForegroundColor White
    Write-Host "3. Run installer and follow instructions" -ForegroundColor White
    Write-Host ""
    Write-Host "Alternative - Use npm instead:" -ForegroundColor Yellow
    Write-Host "  npm install -g bun" -ForegroundColor White
    Write-Host ""
    Write-Host "Error details: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""
