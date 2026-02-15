# Setup e Teste Automatizado - Clim Protocol
# Para Windows com PowerShell

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Clim Protocol - Setup & Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Verificar Rust
Write-Host "[1/6] Verificando Rust..." -ForegroundColor Yellow
$rustVersion = rustc --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Rust instalado: $rustVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Rust não encontrado. Instalando..." -ForegroundColor Red
    Write-Host "Baixando rustup-init.exe..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "https://win.rustup.rs/" -OutFile "$env:TEMP\rustup-init.exe"
    Write-Host "Executando instalador (isso pode levar alguns minutos)..." -ForegroundColor Yellow
    Start-Process -FilePath "$env:TEMP\rustup-init.exe" -ArgumentList "-y" -Wait -NoNewWindow
    
    # Atualizar PATH na sessão atual
    $env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"
    
    Write-Host "✅ Rust instalado com sucesso!" -ForegroundColor Green
}

# 2. Verificar/Instalar Foundry
Write-Host "`n[2/6] Verificando Foundry..." -ForegroundColor Yellow
$forgeVersion = forge --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Foundry instalado: $forgeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Foundry não encontrado. Instalando..." -ForegroundColor Red
    Write-Host "Isso pode levar 5-10 minutos..." -ForegroundColor Yellow
    
    cargo install --git https://github.com/foundry-rs/foundry foundry-cli anvil --bins --locked
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Foundry instalado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao instalar Foundry. Verifique a conexão e tente novamente." -ForegroundColor Red
        exit 1
    }
}

# 3. Instalar dependências Foundry
Write-Host "`n[3/6] Instalando dependências Foundry..." -ForegroundColor Yellow
cd contracts

if (-Not (Test-Path "lib")) {
    Write-Host "Criando diretório lib..." -ForegroundColor Gray
    New-Item -ItemType Directory -Path "lib" -Force | Out-Null
}

Write-Host "Instalando OpenZeppelin..." -ForegroundColor Gray
forge install OpenZeppelin/openzeppelin-contracts --no-commit 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ OpenZeppelin instalado" -ForegroundColor Green
} else {
    Write-Host "⚠️  OpenZeppelin já instalado" -ForegroundColor DarkYellow
}

Write-Host "Instalando Chainlink..." -ForegroundColor Gray
forge install smartcontractkit/chainlink --no-commit 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Chainlink instalado" -ForegroundColor Green
} else {
    Write-Host "⚠️  Chainlink já instalado" -ForegroundColor DarkYellow
}

# 4. Compilar contratos
Write-Host "`n[4/6] Compilando contratos..." -ForegroundColor Yellow
forge build --force

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Contratos compilados com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro na compilação. Verifique os erros acima." -ForegroundColor Red
    cd ..
    exit 1
}

# 5. Executar testes
Write-Host "`n[5/6] Executando testes..." -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

$testOutput = forge test -vv 2>&1

Write-Host $testOutput

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ TODOS OS TESTES PASSARAM!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Alguns testes falharam. Verifique acima." -ForegroundColor Red
}

# 6. Gas Report
Write-Host "`n[6/6] Gerando relatório de gas..." -ForegroundColor Yellow
forge test --gas-report | Select-String -Pattern "│" -Context 0

# Voltar ao diretório raiz
cd ..

# Sumário final
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Setup Completo!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nPróximos passos:" -ForegroundColor Yellow
Write-Host "1. Revisar resultados dos testes acima" -ForegroundColor White
Write-Host "2. Executar 'cd contracts; forge coverage' para coverage report" -ForegroundColor White
Write-Host "3. Ver HOW_TO_TEST.md para comandos avançados" -ForegroundColor White
Write-Host "4. Ver SMART_CONTRACTS_EXPLAINED.md para entender cada contrato" -ForegroundColor White
Write-Host "`n"
