# Guia Prático — Como Testar os Contratos

Este guia explica passo a passo como testar e validar os contratos do Clim Protocol.

## Pré-requisitos

### No Windows (sua plataforma atual)

1. **Instalar Rust** (necessário para Foundry)
```powershell
# Baixar e executar rustup-init.exe
Invoke-WebRequest -Uri "https://win.rustup.rs/" -OutFile "rustup-init.exe"
.\rustup-init.exe -y
```

2. **Instalar Foundry**
```powershell
# Após instalar Rust, reinicie o terminal e execute:
cargo install --git https://github.com/foundry-rs/foundry foundry-cli anvil --bins --locked
```

3. **Verificar instalação**
```powershell
forge --version
anvil --version
```

## Teste Método 1: Script Automatizado (Mais Fácil)

```powershell
# Da raiz do projeto
.\run-tests.ps1
```

Este script irá:
- ✅ Compilar todos os contratos
- ✅ Executar todos os testes
- ✅ Gerar relatório de coverage
- ✅ Criar snapshot de gas usage
- ✅ Mostrar sumário de resultados

## Teste Método 2: Manual (Passo a Passo)

### 1. Navegar para o diretório de contratos
```powershell
cd contracts
```

### 2. Instalar dependências Foundry
```powershell
forge install OpenZeppelin/openzeppelin-contracts --no-commit
forge install smartcontractkit/chainlink --no-commit
```

### 3. Compilar contratos
```powershell
forge build
```

Você deve ver:
```
[⠊] Compiling...
[⠒] Compiling 45 files with 0.8.20
[⠢] Solc 0.8.20 finished in 3.21s
Compiler run successful!
```

### 4. Executar todos os testes
```powershell
# Testes básicos
forge test

# Com output verboso
forge test -vv

# Com stack traces completos (para debug)
forge test -vvvv
```

### 5. Testar contrato específico
```powershell
# Apenas testes do ClimateEventToken
forge test --match-contract ClimateEventTokenTest

# Apenas testes do LiquidityPool
forge test --match-contract LiquidityPoolTest
```

### 6. Testar função específica
```powershell
# Apenas teste de criação de evento
forge test --match-test testCreateEvent

# Apenas testes de redeem
forge test --match-test testRedeem
```

### 7. Análise de Coverage
```powershell
# Coverage summary
forge coverage --report summary

# Coverage detalhado
forge coverage --report debug

# Gerar LCOV para visualização
forge coverage --report lcov
```

### 8. Gas Report
```powershell
forge test --gas-report
```

## Teste Método 3: Deploy Local e Teste Manual

### 1. Iniciar blockchain local (Anvil)
```powershell
# Em um terminal separado
anvil
```

Anvil irá:
- Criar 10 accounts com 10,000 ETH cada
- Mostrar private keys (APENAS PARA TESTE!)
- Rodar em `http://localhost:8545`

### 2. Deploy local
```powershell
# Em outro terminal, da pasta contracts
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
```

### 3. Interagir via cast (CLI)
```powershell
# Exemplo: verificar totalLiquidity
cast call [POOL_ADDRESS] "totalLiquidity()(uint256)" --rpc-url http://localhost:8545

# Exemplo: adicionar liquidez
cast send [POOL_ADDRESS] "deposit()" --value 10ether --private-key [KEY] --rpc-url http://localhost:8545
```

## Interpretando os Resultados

### ✅ Testes Passando
```
Running 77 tests for test/ClimateEventToken.t.sol:ClimateEventTokenTest
[PASS] testCannotCreateDuplicateEvent() (gas: 234567)
[PASS] testCannotCreateEventWithPastStartTime() (gas: 123456)
[PASS] testCannotRedeemTwice() (gas: 345678)
...
Test result: ok. 77 passed; 0 failed; finished in 5.43s
```

### ❌ Teste Falhando
```
[FAIL. Reason: Insufficient liquidity] testCreateEventWithLowLiquidity() (gas: 123456)
```

### 📊 Coverage Report
```
| File                          | % Lines        | % Statements   | % Branches    |
|-------------------------------|----------------|----------------|---------------|
| src/ClimProtocol.sol          | 85.71% (12/14) | 87.50% (14/16) | 75.00% (6/8)  |
| src/core/ClimateEventToken.sol| 92.31% (24/26) | 93.75% (30/32) | 83.33% (10/12)|
| src/core/LiquidityPool.sol    | 88.89% (16/18) | 90.00% (18/20) | 80.00% (8/10) |
```

Meta: > 80% em todas as métricas

### ⛽ Gas Report
```
| Function                      | min    | avg    | median | max    |
|-------------------------------|--------|--------|--------|--------|
| createEvent                   | 452123 | 487654 | 487654 | 523185 |
| buyClimateTokens              | 123456 | 145678 | 145678 | 167890 |
```

## Testes Específicos por Contrato

### ClimateEventToken.t.sol

**O que testa:**
- ✅ Criação de eventos climáticos
- ✅ Validações de input (timestamps, payouts)
- ✅ Settlement de eventos
- ✅ Redeem de tokens com/sem payout
- ✅ Proteção contra double-redeem
- ✅ Access control (roles)

**Como executar:**
```powershell
forge test --match-contract ClimateEventTokenTest -vv
```

**Casos importantes:**
- `testRedeemTokensWithPayout` - Verifica payout quando precipitação < threshold
- `testRedeemTokensWithoutPayout` - Verifica queima sem payout quando precipitação > threshold
- `testCannotRedeemTwice` - Proteção contra duplo resgate

### LiquidityPool.t.sol

**O que testa:**
- ✅ Deposit/withdraw de liquidez
- ✅ Lock/release de collateral
- ✅ Cálculo de availableLiquidity
- ✅ Overcollateralization ratio
- ✅ Validações de saldo

**Como executar:**
```powershell
forge test --match-contract LiquidityPoolTest -vv
```

**Casos importantes:**
- `testLockCollateral` - Verifica lock correto
- `testReleaseCollateralWithPayout` - Simula payout após evento
- `testCannotWithdrawMoreThanAvailable` - Proteção de solvência

### ClimateEventFactory.t.sol

**O que testa:**
- ✅ Criação de eventos com validações
- ✅ Compra de tokens
- ✅ Cálculo de premium
- ✅ Validações geográficas (lat/lon)
- ✅ Refund de excesso de pagamento

**Como executar:**
```powershell
forge test --match-contract ClimateEventFactoryTest -vv
```

**Casos importantes:**
- `testBuyClimateTokens` - Fluxo completo de compra
- `testCannotBuyAfterEventStarts` - Janela de compra limitada
- `testRefundExcessPayment` - Devolução de excesso

### ClimProtocol.t.sol

**O que testa:**
- ✅ Integração entre contratos
- ✅ Stats do protocolo
- ✅ Funções de conveniência (quickBuy)

**Como executar:**
```powershell
forge test --match-contract ClimProtocolTest -vv
```

## Simulando Fluxo Completo

### Cenário: Evento de Seca no Sertão de Pernambuco (90 dias)

```solidity
// 1. LP fornece liquidez
vm.prank(liquidityProvider);
liquidityPool.deposit{value: 50 ether}();

// 2. Admin cria evento de seca (90 dias)
uint256 eventId = factory.createClimateEvent(
    -8_285_000,      // Sertão de Pernambuco latitude
    -37_975_000,     // Sertão de Pernambuco longitude  
    block.timestamp + 1 days,
    block.timestamp + 91 days,  // 90 dias de duração
    150_000,         // Threshold: 150mm (seca severa)
    0.05 ether,      // Payout por token
    1000             // Total de tokens
);

// 3. Agricultor compra proteção
uint256 premium = factory.getEventPremium(eventId);
vm.prank(farmer);
factory.buyClimateTokens{value: premium * 10}(eventId, 10);

// 4. Evento termina, precipitação foi 98mm (< 150mm threshold)
vm.warp(block.timestamp + 92 days);
vm.prank(settler);
token.settleEvent(eventId, 98_000); // Seca confirmada!

// 5. Agricultor resgata payout
vm.prank(farmer);
token.redeemTokens(eventId);
// Agricultor recebe: 10 tokens × 0.05 ETH = 0.5 ETH (~R$ 5.000)
```

## Troubleshooting

### Erro: "forge: command not found"
```powershell
# Verificar PATH
$env:PATH

# Adicionar Cargo bin ao PATH
$env:PATH += ";$env:USERPROFILE\.cargo\bin"
```

### Erro: "Failed to resolve dependencies"
```powershell
# Limpar cache e reinstalar
forge clean
rm -rf lib/
forge install OpenZeppelin/openzeppelin-contracts --no-commit
forge install smartcontractkit/chainlink --no-commit
```

### Erro: "Stack too deep"
```powershell
# Compilar com otimizador
forge build --via-ir
```

### Testes lentos
```powershell
# Rodar em paralelo
forge test --jobs 4
```

## Próximos Passos Após Testes Passarem

1. ✅ **Todos os testes passam** → Prosseguir para Sepolia
2. ⚠️ **Coverage < 80%** → Adicionar mais testes
3. ❌ **Testes falhando** → Debug com `forge test -vvvv`
4. 💰 **Gas muito alto** → Otimizar contratos

## Commands Cheat Sheet

```powershell
# Build
forge build

# Test
forge test                           # Todos os testes
forge test -vv                       # Verboso
forge test --match-test testName     # Teste específico
forge test --match-contract Contract # Contrato específico

# Coverage
forge coverage --report summary

# Gas
forge test --gas-report
forge snapshot

# Deploy local
anvil                                # Terminal 1
forge script script/Deploy.s.sol ... # Terminal 2

# Limpar
forge clean
```

---

**Dica**: Execute `.\run-tests.ps1` primeiro para validar tudo de uma vez!

Data: 15/02/2026
