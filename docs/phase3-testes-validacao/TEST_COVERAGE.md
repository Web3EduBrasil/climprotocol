# Test Coverage Report

Este documento fornece instruções para executar e analisar o coverage de testes do Clim Protocol.

## Quick Start

```powershell
# Windows PowerShell
.\run-tests.ps1

# Ou manual
cd contracts
forge test -vv
forge coverage --report summary
```

## Comandos de Teste

### Testes Básicos
```bash
# Rodar todos os testes
forge test

# Testes com output verboso
forge test -vv

# Testes com trace completo
forge test -vvvv

# Rodar teste específico
forge test --match-test testCreateEvent

# Rodar testes de um contrato específico
forge test --match-contract ClimateEventTokenTest
```

### Coverage Analysis
```bash
# Coverage summary
forge coverage --report summary

# Coverage detalhado por função
forge coverage --report debug

# Gerar LCOV para visualização
forge coverage --report lcov

# Visualizar LCOV (requer genhtml)
genhtml lcov.info --branch-coverage --output-dir coverage
```

### Gas Analytics
```bash
# Snapshot de gas usage
forge snapshot

# Gas report detalhado
forge test --gas-report

# Comparar gas usage
forge snapshot --diff .gas-snapshot
```

### Análise Estática (Opcional)
```bash
# Slither (requer instalação)
slither contracts/src --print human-summary

# Análise de herança
forge inspect ClimProtocol storage-layout
```

## Interpretação de Coverage

### Métricas Importantes
- **Line Coverage**: % de linhas executadas
- **Branch Coverage**: % de branches (if/else) testados
- **Function Coverage**: % de funções chamadas
- **Statement Coverage**: % de statements executados

### Meta de Coverage (Fase 1)
- ✅ Line Coverage: > 80%
- ✅ Branch Coverage: > 70%
- ✅ Function Coverage: > 90%
- ⚠️ Critical Functions: 100%

### Funções Críticas (Requerem 100% Coverage)
- `ClimateEventToken.redeemTokens()`
- `LiquidityPool.lockCollateral()` / `releaseCollateral()`
- `ClimateEventFactory.buyClimateTokens()`
- `SettlementEngine.processSettlement()`
- `ClimateOracle.fulfillRequest()`

## Testes Implementados

### ClimateEventToken.t.sol (26 testes)
- [x] Roles e permissões
- [x] Criação de eventos (happy path e edge cases)
- [x] Settlement de eventos
- [x] Redeem com/sem payout
- [x] Proteção contra double-redeem
- [x] Validações de input

### LiquidityPool.t.sol (20 testes)
- [x] Deposit/withdraw
- [x] Lock/release collateral
- [x] Cálculo de overcollateralization
- [x] Available liquidity
- [x] Transfer payout
- [x] Validações e limites

### ClimateEventFactory.t.sol (24 testes)
- [x] Criação de eventos climáticos
- [x] Compra de tokens
- [x] Cálculo de premium
- [x] Validações geográficas e temporais
- [x] Refund de excess payment
- [x] Limites e edge cases

### ClimProtocol.t.sol (7 testes)
- [x] Integration tests básicos
- [x] Protocol stats
- [x] Contract addresses
- [x] Quick buy/provide

**Total: 77+ test cases**

## Gaps de Coverage Identificados

### Alta Prioridade
1. ~~`SettlementEngine` - faltam testes de integração com Automation~~
2. ~~`ClimateOracle` - conversão de timestamps e string helpers~~
3. Edge cases de múltiplos eventos simultâneos
4. Testes de reentrancy específicos

### Média Prioridade
1. Gas optimization benchmarks
2. Fuzz testing para premium calculation
3. Invariant testing para liquidity conservation
4. Testes de fork com Sepolia

### Baixa Prioridade
1. UI integration tests (quando frontend existir)
2. E2E tests com dados reais Open-Meteo
3. Load testing (múltiplos usuários)

## Como Adicionar Novos Testes

### Template de Teste
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import "../src/YourContract.sol";

contract YourContractTest is Test {
    YourContract public contract;
    
    function setUp() public {
        contract = new YourContract();
    }
    
    function testYourFeature() public {
        // Arrange
        uint256 expected = 100;
        
        // Act
        uint256 result = contract.yourFunction();
        
        // Assert
        assertEq(result, expected);
    }
}
```

### Checklist para Novos Testes
- [ ] Happy path testado
- [ ] Edge cases identificados e testados
- [ ] Reverts com mensagens corretas
- [ ] Access control verificado
- [ ] Events emitidos verificados
- [ ] State changes verificados
- [ ] Gas usage razoável

## Continuous Integration (Futuro)

### GitHub Actions (Exemplo)
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1
      - name: Run tests
        run: |
          cd contracts
          forge test -vv
      - name: Coverage
        run: |
          cd contracts
          forge coverage --report summary
```

## Troubleshooting

### Testes Falhando
```bash
# Rodar com max verbosity
forge test -vvvvv

# Usar debugger
forge test --debug testFailingTest
```

### Coverage Baixo
```bash
# Identificar funções não testadas
forge coverage --report debug | grep "0.00%"
```

### Gas Muito Alto
```bash
# Comparar com snapshot anterior
forge snapshot --diff

# Otimizar loops e storage
forge test --gas-report
```

---

Última atualização: 14/02/2026