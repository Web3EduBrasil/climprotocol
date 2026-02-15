# Phase 1: Planejamento e Design

Esta fase documenta todo o planejamento e arquitetura inicial do Clim Protocol.

## 📄 Documentos

### [ARCHITECTURE.md](./ARCHITECTURE.md)
Visão geral da arquitetura completa do sistema:
- Diagrama de componentes
- Fluxos de dados principais
- Integrações Chainlink (Functions + Automation)
- Design de contratos inteligentes

### [SMART_CONTRACTS_EXPLAINED.md](./SMART_CONTRACTS_EXPLAINED.md)
Explicação detalhada de cada smart contract:
- `ClimateEventToken` (ERC-1155)
- `ClimateEventFactory`
- `LiquidityPool`
- `SettlementEngine`
- `ClimateOracle`
- `ClimProtocol` (facade)

Inclui:
- Funções principais de cada contrato
- Roles e permissões
- Fluxos de interação
- Exemplos de uso

### [TODO_ROADMAP.md](./TODO_ROADMAP.md)
Roadmap completo do projeto:
- Fase 1: MVP Core Contracts ✅
- Fase 2: Integração Chainlink ✅
- Fase 3: Testes e Segurança ✅
- Fase 4: Frontend (planejado)
- Fase 5: Deploy Testnet (próximo)

---

## 🎯 Decisões de Design Principais

### 1. ERC-1155 vs ERC-721
**Escolha:** ERC-1155  
**Razão:** Múltiplos tokens fungíveis por evento, gas-efficient para batch operations

### 2. Oracle Solution
**Escolha:** Chainlink Functions  
**Razão:** Acesso direto a APIs externas, Open-Meteo para dados climáticos históricos

### 3. Liquidação Automática
**Escolha:** Chainlink Automation  
**Razão:** Execução confiável sem intervenção manual, crítico para pagamentos agrícolas

### 4. Pool de Liquidez
**Escolha:** Overcollateralization (150%)  
**Razão:** Garantir solvência mesmo em múltiplos eventos simultâneos

---

## 📐 Diagramas Principais

Veja [ARCHITECTURE.md](./ARCHITECTURE.md) para diagramas detalhados de:
- Fluxo de compra de proteção
- Fluxo de liquidação via Chainlink
- Arquitetura de contratos
- Integração Oracle → Settlement

---

**Próximo:** [Phase 2: Implementação](../phase2-implementacao/)
