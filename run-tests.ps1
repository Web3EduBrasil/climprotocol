# PowerShell script para executar testes e análise de coverage

Write-Host "🧪 Clim Protocol - Test & Coverage Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"

# Verificar se estamos no diretório correto
if (!(Test-Path "contracts")) {
    Write-Host "❌ Diretório 'contracts' não encontrado!" -ForegroundColor Red
    Write-Host "   Execute este script da raiz do projeto." -ForegroundColor Yellow
    exit 1
}

Set-Location "contracts"

Write-Host "📦 Verificando dependências Foundry..." -ForegroundColor Yellow
try {
    $forgeVersion = forge --version
    Write-Host "✅ Foundry instalado" -ForegroundColor Green
} catch {
    Write-Host "❌ Foundry não encontrado. Instale antes de continuar." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔨 Compilando contratos..." -ForegroundColor Yellow
forge build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Falha na compilação!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Compilação concluída" -ForegroundColor Green
Write-Host ""

# Executar testes unitários
Write-Host "🧪 Executando testes unitários..." -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Cyan
forge test -vv

$testExitCode = $LASTEXITCODE

if ($testExitCode -eq 0) {
    Write-Host "✅ Todos os testes passaram!" -ForegroundColor Green
} else {
    Write-Host "❌ Alguns testes falharam" -ForegroundColor Red
}

Write-Host ""
Write-Host "📊 Executando análise de coverage..." -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan

# Coverage básico
forge coverage

Write-Host ""
Write-Host "📊 Gerando relatório detalhado de coverage..." -ForegroundColor Yellow
forge coverage --report summary

Write-Host ""
Write-Host "📈 Gerando relatório LCOV..." -ForegroundColor Yellow
forge coverage --report lcov

if (Test-Path "lcov.info") {
    Write-Host "✅ Relatório LCOV gerado: lcov.info" -ForegroundColor Green
    Write-Host "   Use lcov-viewer ou genhtml para visualização HTML" -ForegroundColor Blue
}

Write-Host ""
Write-Host "🔍 Executando snapshot de gas..." -ForegroundColor Yellow
forge snapshot

if (Test-Path ".gas-snapshot") {
    Write-Host "✅ Gas snapshot salvo em .gas-snapshot" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Sumário de Testes:" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan

# Contar testes
$testFiles = Get-ChildItem -Path "test" -Filter "*.t.sol" -Recurse
Write-Host "Arquivos de teste encontrados: $($testFiles.Count)" -ForegroundColor White

Write-Host ""
Write-Host "💡 Próximos passos sugeridos:" -ForegroundColor Yellow
Write-Host "   1. Revise o coverage e adicione testes para funções não cobertas" -ForegroundColor White
Write-Host "   2. Execute: forge test --gas-report para análise de gas" -ForegroundColor White
Write-Host "   3. Execute: slither . (se instalado) para análise estática" -ForegroundColor White
Write-Host "   4. Revise SECURITY_ANALYSIS.md para melhorias críticas" -ForegroundColor White
Write-Host ""

if ($testExitCode -ne 0) {
    Write-Host "⚠️  AVISO: Alguns testes falharam. Corrija antes de continuar." -ForegroundColor Red
    Set-Location ".."
    exit 1
}

Write-Host "✨ Análise completa!" -ForegroundColor Green
Set-Location ".."