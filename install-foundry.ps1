# ===================================================================
# INSTALL FOUNDRY - Windows PowerShell Script
# ===================================================================
# Run this as Administrator to install Foundry
# ===================================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FOUNDRY INSTALLER FOR WINDOWS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "[WARNING] Not running as Administrator" -ForegroundColor Yellow
    Write-Host "          Some operations may fail" -ForegroundColor Yellow
    Write-Host ""
}

# Check if Foundry is already installed
if (Get-Command forge -ErrorAction SilentlyContinue) {
    Write-Host "[OK] Foundry is already installed!" -ForegroundColor Green
    forge --version
    Write-Host ""
    Write-Host "Do you want to update Foundry? (y/n): " -NoNewline
    $update = Read-Host
    
    if ($update -eq 'y' -or $update -eq 'Y') {
        Write-Host ""
        Write-Host "Updating Foundry..." -ForegroundColor Yellow
        foundryup
    }
    exit 0
}

Write-Host "[1/3] Downloading Foundry installer..." -ForegroundColor Yellow

try {
    # Method 1: Try official installer
    Write-Host "      Using official foundry installer..." -ForegroundColor Gray
    
    Invoke-Expression (Invoke-RestMethod -Uri 'https://github.com/foundry-rs/foundry/releases/latest/download/foundry_installer.ps1')
    
    Write-Host ""
    Write-Host "[2/3] Installation complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "[3/3] Verifying installation..." -ForegroundColor Yellow
    
    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    if (Get-Command forge -ErrorAction SilentlyContinue) {
        Write-Host ""
        Write-Host "[SUCCESS] Foundry installed successfully!" -ForegroundColor Green
        Write-Host ""
        forge --version
        cast --version
        anvil --version
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  INSTALLATION COMPLETE!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "  1. Close and reopen PowerShell" -ForegroundColor White
        Write-Host "  2. Run: cd contracts" -ForegroundColor White
        Write-Host "  3. Run: forge install" -ForegroundColor White
        Write-Host "  4. Run: forge build" -ForegroundColor White
        Write-Host "  5. Run: forge test" -ForegroundColor White
        Write-Host ""
        
    } else {
        Write-Host ""
        Write-Host "[INFO] Installation completed but forge not in PATH yet" -ForegroundColor Yellow
        Write-Host "       Please close and reopen PowerShell, then run: forge --version" -ForegroundColor Yellow
        Write-Host ""
    }
    
} catch {
    Write-Host ""
    Write-Host "[ERROR] Automatic installation failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual Installation Steps:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://github.com/foundry-rs/foundry/releases" -ForegroundColor White
    Write-Host "2. Download the latest Windows release (foundry_nightly_windows_amd64.zip)" -ForegroundColor White
    Write-Host "3. Extract to: C:\foundry\" -ForegroundColor White
    Write-Host "4. Add C:\foundry\ to your PATH" -ForegroundColor White
    Write-Host ""
    Write-Host "Error details: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""
