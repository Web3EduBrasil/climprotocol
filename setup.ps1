# PowerShell script para setup do Clim Protocol no Windows

Write-Host "🌦️  Clim Protocol - Setup Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Verificar se Node.js está instalado
Write-Host "Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js instalado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado. Por favor, instale Node.js v18+" -ForegroundColor Red
    Write-Host "   Download: https://nodejs.org/" -ForegroundColor White
    exit 1
}

# Verificar se Foundry está instalado
Write-Host "Verificando Foundry..." -ForegroundColor Yellow
try {
    $forgeVersion = forge --version
    Write-Host "✅ Foundry instalado: $forgeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Foundry não encontrado." -ForegroundColor Red
    Write-Host "   Instalando Foundry via Rust..." -ForegroundColor Yellow
    
    # Verificar Rust
    try {
        rustc --version | Out-Null
        Write-Host "✅ Rust encontrado" -ForegroundColor Green
    } catch {
        Write-Host "❌ Rust não encontrado. Instalando Rust..." -ForegroundColor Yellow
        # Usar instalador oficial do Rust
        Invoke-WebRequest -Uri "https://win.rustup.rs/" -OutFile "rustup-init.exe"
        Start-Process -Wait -FilePath ".\rustup-init.exe" -ArgumentList "-y"
        Remove-Item "rustup-init.exe"
        
        # Recarregar PATH
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
    }
    
    # Instalar Foundry
    Write-Host "Instalando Foundry..." -ForegroundColor Yellow
    cargo install --git https://github.com/foundry-rs/foundry foundry-cli anvil --bins --locked
}

# Setup do projeto
Write-Host "Configurando projeto..." -ForegroundColor Yellow

# Criar arquivo .env se não existir
if (!(Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Arquivo .env criado. EDITE-O com suas chaves!" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Arquivo .env já existe" -ForegroundColor Blue
}

# Instalar dependências do projeto raiz (se necessário)
if (Test-Path "package.json") {
    Write-Host "Instalando dependências npm..." -ForegroundColor Yellow
    npm install
}

# Configurar contratos
Write-Host "Configurando contratos Foundry..." -ForegroundColor Yellow
Set-Location "contracts"

# Instalar dependências Foundry
Write-Host "Instalando dependências Foundry..." -ForegroundColor Yellow
forge install OpenZeppelin/openzeppelin-contracts --no-commit
forge install smartcontractkit/chainlink --no-commit

# Build contracts
Write-Host "Compilando contratos..." -ForegroundColor Yellow
forge build

# Voltar para diretório raiz
Set-Location ".."

Write-Host ""
Write-Host "🎉 Setup concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Edite o arquivo .env com suas chaves" -ForegroundColor White
Write-Host "2. Obtenha ETH e LINK testnet: https://faucets.chain.link/sepolia" -ForegroundColor White
Write-Host "3. Execute: forge script script/Deploy.s.sol:Deploy --rpc-url $env:SEPOLIA_RPC_URL --private-key $env:PRIVATE_KEY --broadcast" -ForegroundColor White
Write-Host "4. Configure Chainlink Functions subscription" -ForegroundColor White
Write-Host "5. Configure Chainlink Automation upkeep" -ForegroundColor White
Write-Host ""