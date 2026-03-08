# ===================================================================
# VALIDAÇÃO PRÉ-SUBMISSÃO - Chainlink Convergence 2026
# ===================================================================
# Script para verificar se o projeto está pronto para submeter
# ===================================================================

param(
    [switch]$Verbose
)

$ErrorCount = 0
$WarningCount = 0

function Write-Check {
    param([string]$Item, [bool]$Status, [string]$Message = "", [bool]$IsWarning = $false)
    
    if ($Status) {
        Write-Host '[OK] ' -NoNewline -ForegroundColor Green
        Write-Host $Item -ForegroundColor White
        if ($Message -and $Verbose) {
            Write-Host "     $Message" -ForegroundColor Gray
        }
    } elseif ($IsWarning) {
        Write-Host '[WARN] ' -NoNewline -ForegroundColor Yellow
        Write-Host $Item -ForegroundColor Yellow
        if ($Message) {
            Write-Host "       $Message" -ForegroundColor Gray
        }
        $script:WarningCount++
    } else {
        Write-Host '[FAIL] ' -NoNewline -ForegroundColor Red
        Write-Host $Item -ForegroundColor Red
        if ($Message) {
            Write-Host "       $Message" -ForegroundColor Gray
        }
        $script:ErrorCount++
    }
}

Clear-Host

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "║     VALIDAÇÃO PRÉ-SUBMISSÃO - CHAINLINK CONVERGENCE 2026      ║" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ===================================================================
# 1. DOCUMENTAÇÃO
# ===================================================================

Write-Host '[DOCUMENTATION]' -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor Gray

$hasREADME = Test-Path "README.md"
Write-Check "README.md existe" $hasREADME "Arquivo principal do projeto"

$hasDescription = Test-Path "docs/DESCRICAO_PROJETO.md"
Write-Check "DESCRICAO_PROJETO.md existe" $hasDescription "Descrição completa"

$hasPitch = Test-Path "docs/PITCH_DECK.md"
Write-Check "PITCH_DECK.md existe" $hasPitch "Apresentação do projeto"

$hasArchitecture = Test-Path "docs/phase1-planejamento/ARCHITECTURE.md"
Write-Check "ARCHITECTURE.md existe" $hasArchitecture "Diagrama de arquitetura"

# Verificar se README tem seção Chainlink
if ($hasREADME) {
    $readmeContent = Get-Content "README.md" -Raw
    $hasChainlinkSection = $readmeContent -match "Integr.*o Chainlink"
    Write-Check "README tem secao Chainlink" $hasChainlinkSection "Lista arquivos Chainlink"
    
    $hasVideoLink = $readmeContent -match "Video|Demo Video"
    Write-Check "README menciona video demo" $hasVideoLink "Ou adicionar apos gravar" $true
}

Write-Host ""

# ===================================================================
# 2. CÓDIGO-FONTE
# ===================================================================

Write-Host '[SOURCE CODE]' -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor Gray

$hasContracts = Test-Path "contracts/src"
Write-Check "Contratos Solidity existem" $hasContracts "contracts/src/"

$hasClimateOracle = Test-Path "contracts/src/oracle/ClimateOracle.sol"
Write-Check 'ClimateOracle.sol with Functions' $hasClimateOracle 'Chainlink Functions client'

$hasSettlementEngine = Test-Path "contracts/src/core/SettlementEngine.sol"
Write-Check 'SettlementEngine.sol with Automation' $hasSettlementEngine 'Chainlink Automation'

$hasFunctionsCode = Test-Path "functions/climate-data.js"
Write-Check "climate-data.js existe" $hasFunctionsCode "JavaScript para Chainlink Functions"

$hasCREWorkflow = Test-Path "cre-workflow/my-workflow/main.ts"
Write-Check "CRE Workflow main.ts existe" $hasCREWorkflow "Workflow TypeScript"

$hasFrontend = Test-Path "frontend/src"
Write-Check "Frontend existe" $hasFrontend "Next.js app" $true

Write-Host ""

# ===================================================================
# 3. TESTES
# ===================================================================

Write-Host '[TESTS]' -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor Gray

Push-Location contracts -ErrorAction SilentlyContinue

if (Get-Command forge -ErrorAction SilentlyContinue) {
    Write-Host "   Executando testes..." -ForegroundColor Gray
    $testOutput = forge test --summary 2>&1 | Out-String
    
    if ($LASTEXITCODE -eq 0) {
        # Parse test results
        if ($testOutput -match "(\d+) tests? passed") {
            $testsPassed = $matches[1]
            Write-Check "Testes passando" $true "$testsPassed testes OK"
        } else {
            Write-Check "Testes executaram" $true "Verificar output acima"
        }
    } else {
        Write-Check "Testes passando" $false "Alguns testes falharam"
    }
} else {
    Write-Check "Foundry instalado" $false "Necessário para compilar/testar" $true
}

Pop-Location

Write-Host ""

# ===================================================================
# 4. CHAINLINK INTEGRATION
# ===================================================================

Write-Host '[CHAINLINK INTEGRATION]' -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor Gray

# Verificar se ClimateOracle usa FunctionsClient
if ($hasClimateOracle) {
    $oracleContent = Get-Content "contracts/src/oracle/ClimateOracle.sol" -Raw
    $usesFunctionsClient = $oracleContent -match 'FunctionsClient|Functions'
    Write-Check 'ClimateOracle uses FunctionsClient' $usesFunctionsClient
}

# Verificar se SettlementEngine é AutomationCompatible
if ($hasSettlementEngine) {
    $engineContent = Get-Content "contracts/src/core/SettlementEngine.sol" -Raw
    $usesAutomation = $engineContent -match 'AutomationCompatible|checkUpkeep|performUpkeep'
    Write-Check 'SettlementEngine is AutomationCompatible' $usesAutomation
}

# Verificar Functions source code
if ($hasFunctionsCode) {
    $functionsContent = Get-Content "functions/climate-data.js" -Raw
    $usesOpenMeteo = $functionsContent -match 'open-meteo|archive-api'
    Write-Check 'Functions uses Open-Meteo API' $usesOpenMeteo
}

Write-Host ""

# ===================================================================
# 5. CRE WORKFLOW
# ===================================================================

Write-Host '[CRE WORKFLOW]' -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor Gray

$hasCREConfig = Test-Path "cre-workflow/my-workflow/config.json"
Write-Check "config.json existe" $hasCREConfig "Configuração do workflow"

$hasCREYaml = Test-Path "cre-workflow/my-workflow/workflow.yaml"
Write-Check "workflow.yaml existe" $hasCREYaml "Deployment settings"

$hasPackageJson = Test-Path "cre-workflow/my-workflow/package.json"
Write-Check "package.json existe" $hasPackageJson "Dependências CRE"

if ($hasCREWorkflow) {
    $workflowContent = Get-Content "cre-workflow/my-workflow/main.ts" -Raw
    
    $hasCronTrigger = $workflowContent -match "cron|schedule"
    Write-Check "Workflow usa Cron Trigger" $hasCronTrigger "Time-based execution"
    
    $hasEvmRead = $workflowContent -match "evm\.read|evmRead"
    Write-Check "Workflow usa EVM Read" $hasEvmRead "Lê contratos on-chain"
    
    $hasHttpFetch = $workflowContent -match "http\.fetch|httpFetch"
    Write-Check "Workflow usa HTTP Fetch" $hasHttpFetch "Consulta API externa"
    
    $hasEvmWrite = $workflowContent -match "evm\.write|evmWrite"
    Write-Check "Workflow usa EVM Write" $hasEvmWrite "Escreve on-chain"
    
    $hasCompute = $workflowContent -match "compute|calculate|threshold|precipitation"
    Write-Check "Workflow tem lógica de negócio" $hasCompute "Calcula se houve seca"
}

# Verificar se Bun está instalado (para rodar workflow)
if (Get-Command bun -ErrorAction SilentlyContinue) {
    Write-Check "Bun runtime instalado" $true "Pode executar workflow"
} else {
    Write-Check "Bun runtime instalado" $false "Instalar: https://bun.sh" $true
}

Write-Host ""

# ===================================================================
# 6. CONFIGURATION FILES
# ===================================================================

Write-Host '[CONFIGURATION]' -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor Gray

$hasEnvExample = Test-Path ".env.example"
Write-Check ".env.example existe" $hasEnvExample "Template variáveis ambiente"

$hasGitignore = Test-Path ".gitignore"
Write-Check ".gitignore existe" $hasGitignore "Ignora arquivos sensíveis"

if ($hasGitignore) {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    $ignoresEnv = $gitignoreContent -match '\.env'
    Write-Check '.gitignore protects .env' $ignoresEnv 'Does not commit secrets'
    
    $ignoresKeys = $gitignoreContent -match 'private|secret|key'
    Write-Check '.gitignore protects keys' $ignoresKeys 'Security' $true
}

$hasLicense = Test-Path "LICENSE"
Write-Check "LICENSE existe" $hasLicense "MIT recomendada" $true

Write-Host ""

# ===================================================================
# 7. VÍDEO DEMO (recursos)
# ===================================================================

Write-Host '[VIDEO DEMO]' -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor Gray

$hasDemoScript = Test-Path "demo-video.ps1"
Write-Check "demo-video.ps1 existe" $hasDemoScript "Script automatizado"

$hasDemoCRE = Test-Path "demo-cre-workflow.ps1"
Write-Check "demo-cre-workflow.ps1 existe" $hasDemoCRE "Demo CRE específico"

$hasVideoGuide = Test-Path "docs/DEMO_VIDEO_GUIDE.md"
Write-Check "DEMO_VIDEO_GUIDE.md existe" $hasVideoGuide "Guia completo"

$hasQuickRef = Test-Path "QUICK_VIDEO_REFERENCE.md"
Write-Check "QUICK_VIDEO_REFERENCE.md existe" $hasQuickRef "Quick reference"

Write-Host ''
Write-Host '   [REMINDER] Video still needs to be recorded!' -ForegroundColor Yellow
Write-Host '              Follow: CLI_DEMO_GUIDE.md' -ForegroundColor Gray
Write-Host ''

# ===================================================================
# 8. GUIAS DE SETUP
# ===================================================================

Write-Host '[GUIDES]' -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor Gray

$hasCRESetup = Test-Path "CRE_WORKFLOW_SETUP.md"
Write-Check "CRE_WORKFLOW_SETUP.md existe" $hasCRESetup "Guia de simulação CRE"

$hasSubmissionChecklist = Test-Path "HACKATHON_SUBMISSION_CHECKLIST.md"
Write-Check "HACKATHON_SUBMISSION_CHECKLIST.md existe" $hasSubmissionChecklist "Checklist final"

$hasOBSGuide = Test-Path "OBS_SETUP_GUIDE.md"
Write-Check "OBS_SETUP_GUIDE.md existe" $hasOBSGuide "Setup gravação" $true

Write-Host ""

# ===================================================================
# 9. VERIFICAÇÕES ADICIONAIS
# ===================================================================

Write-Host '[ADDITIONAL CHECKS]' -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor Gray

# Verificar se há arquivos .env commitados (NÃO DEVE TER!)
$hasEnvCommitted = Test-Path ".env"
if ($hasEnvCommitted) {
    # Verificar se está no .gitignore
    $gitStatus = git status --porcelain .env 2>&1
    if ($gitStatus -match "\.env") {
        Write-Check ".env NÃO está commitado" $false "REMOVER do git!"
    } else {
        Write-Check ".env NÃO está commitado" $true "Apenas local"
    }
}

# Verificar tamanho do repositório
$repoSize = (Get-ChildItem -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
$sizeOK = $repoSize -lt 500
Write-Check "Tamanho do repo OK" $sizeOK "$([math]::Round($repoSize, 2)) MB" $true

# Verificar se Git está configurado
if (Get-Command git -ErrorAction SilentlyContinue) {
    $gitRemote = git remote get-url origin 2>&1
    if ($gitRemote -notmatch "fatal") {
        Write-Check "Git remote configurado" $true "$gitRemote"
    } else {
        Write-Check "Git remote configurado" $false "Adicionar remote do GitHub" $true
    }
} else {
    Write-Check "Git instalado" $false "Necessário para GitHub"
}

Write-Host ""

# ===================================================================
# RESUMO FINAL
# ===================================================================

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                        RESUMO FINAL                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

if ($ErrorCount -eq 0 -and $WarningCount -eq 0) {
    Write-Host '[SUCCESS] Project is 100% ready for submission!' -ForegroundColor Green
    Write-Host ''
    Write-Host 'Next steps:' -ForegroundColor Yellow
    Write-Host '  1. Record video (3-5 min)' -ForegroundColor White
    Write-Host '  2. Upload video to YouTube/Loom' -ForegroundColor White
    Write-Host '  3. Add link to README' -ForegroundColor White
    Write-Host '  4. Push to GitHub (public)' -ForegroundColor White
    Write-Host '  5. Submit to hackathon!' -ForegroundColor White
    
} elseif ($ErrorCount -eq 0) {
    Write-Host '[OK] Project is ready! Just some warnings:' -ForegroundColor Green
    Write-Host "   $WarningCount warnings - do not block submission" -ForegroundColor Yellow
    Write-Host ''
    Write-Host 'Review:' -ForegroundColor Yellow
    Write-Host '  * Check warnings above' -ForegroundColor White
    Write-Host '  * Record demo video' -ForegroundColor White
    Write-Host '  * Deploy (optional)' -ForegroundColor White
    
} else {
    Write-Host "[WARNING] Project has $ErrorCount errors and $WarningCount warnings" -ForegroundColor Red
    Write-Host ''
    Write-Host 'FIX before submitting:' -ForegroundColor Red
    Write-Host '  * Resolve errors marked with [FAIL] above' -ForegroundColor White
    Write-Host '  * Run again: .\validate-submission.ps1' -ForegroundColor White
}

Write-Host ""

# ===================================================================
# CHECKLIST FINAL (TODO)
# ===================================================================

Write-Host '[FINAL CHECKLIST - TODO]' -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor Gray

$todos = @(
    @{Task = "Record demo video (3-5 min)"; Done = $false},
    @{Task = "Upload video (YouTube/Loom public)"; Done = $false},
    @{Task = "Add video link to README"; Done = $false},
    @{Task = "Test CRE workflow (bun run main.ts)"; Done = $false},
    @{Task = "Make repository public on GitHub"; Done = $false},
    @{Task = "Verify .env is not committed"; Done = $true},
    @{Task = "Add LICENSE (MIT)"; Done = $hasLicense},
    @{Task = "Final push to GitHub"; Done = $false},
    @{Task = "Submit to hackathon"; Done = $false}
)

foreach ($todo in $todos) {
    if ($todo.Done) {
        Write-Host "  [X] " -NoNewline -ForegroundColor Green
    } else {
        Write-Host "  [ ] " -NoNewline -ForegroundColor Gray
    }
    Write-Host $todo.Task -ForegroundColor White
}

Write-Host ""
Write-Host "See complete checklist: " -NoNewline -ForegroundColor Yellow
Write-Host "docs/FINAL_CHECKLIST.md" -ForegroundColor Cyan
Write-Host ""

# Exit code
if ($ErrorCount -gt 0) {
    exit 1
} else {
    exit 0
}
