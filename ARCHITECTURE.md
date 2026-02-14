# Clim Protocol - Arquitetura de Contratos

## Visão Geral dos Contratos

```
ClimProtocol.sol (Facade)
├── ClimateEventToken.sol (ERC-1155)
├── ClimateEventFactory.sol 
├── LiquidityPool.sol
├── SettlementEngine.sol + Chainlink Automation
└── ClimateOracle.sol + Chainlink Functions
```

## Contratos Core

### 1. ClimateEventToken.sol
- **Tipo**: ERC-1155 Multi-token
- **Função**: Representa proteção contra eventos climáticos específicos
- **Recursos**:
  - Cada `tokenId` = evento climático único
  - Mint via Factory autorizada
  - Redeem após liquidação (settlement)
  - Queima automatica tokens após payout ou expiração

### 2. ClimateEventFactory.sol
- **Função**: Cria novos eventos climáticos e vende tokens
- **Recursos**:
  - Validação de parâmetros de evento
  - Cálculo de prêmio baseado em risco
  - Interface para compra de tokens
  - Verificação de liquidez disponível

### 3. LiquidityPool.sol
- **Função**: Gerencia liquidez para garantir payouts
- **Recursos**:  
  - Depósitos/saques de LPs
  - Sistema de colateral bloqueado por evento
  - Overcollateralization configurável (150%)
  - Proteção contra bank run

### 4. SettlementEngine.sol
- **Função**: Coordena liquidação automática de eventos
- **Recursos**:
  - Integração com Chainlink Automation
  - Sistema de fila de eventos ativos
  - Trigger automático após fim do evento
  - Processamento de payouts

### 5. ClimateOracle.sol
- **Função**: Consulta dados climáticos via Chainlink Functions
- **Recursos**:
  - Integração com Open-Meteo API
  - Conversão de coordenadas e datas
  - Agregação de precipitação histórica
  - Armazenamento on-chain dos resultados

## Fluxo de Operação

### Criação de Evento

1. **Admin** chama `ClimateEventFactory.createClimateEvent()`
2. Factory valida parâmetros e verifica liquidez disponível
3. Factory chama `LiquidityPool.lockCollateral()` para reservar funds
4. Factory chama `ClimateEventToken.createEvent()` para mint tokens
5. Factory chama `SettlementEngine.addEventForSettlement()` para monitoramento

### Compra de Tokens

1. **Usuário** chama `ClimateEventFactory.buyClimateTokens()` com ETH
2. Factory calcula e cobra prêmio
3. Factory transfere tokens do estoque para o comprador
4. Factory deposita prêmio no LiquidityPool

### Liquidação Automática

1. **Chainlink Automation** chama `SettlementEngine.checkUpkeep()` periodicamente
2. Settlement identifica eventos que expiraram
3. Settlement chama `ClimateOracle.requestClimateData()` 
4. **Chainlink Functions** executa JavaScript code, consulta Open-Meteo
5. Oracle recebe resposta via `fulfillRequest()` callback
6. **Admin/Keeper** chama `SettlementEngine.processSettlement()`
7. Settlement chama `ClimateEventToken.settleEvent()` com resultado
8. Settlement Call `LiquidityPool.releaseCollateral()` para payout

### Resgate de Tokens

1. **Usuário** chama `ClimateEventToken.redeemTokens()`
2. Contrato verifica se evento foi liquidado
3. Se evento foi triggered → transfere ETH para usuário
4. Queima tokens do usuário

## Roles e Permissões

```
ClimateEventToken:
├── MINTER_ROLE → ClimateEventFactory
└── SETTLER_ROLE → SettlementEngine

LiquidityPool:
└── POOL_MANAGER_ROLE → Factory + SettlementEngine

ClimateOracle:
└── ORACLE_REQUESTER_ROLE → SettlementEngine

SettlementEngine:
└── AUTOMATION_ROLE → Chainlink Automation + Admin

ClimateEventFactory:
└── EVENT_CREATOR_ROLE → Admin
```

## Parâmetros de Configuração

### Evento Climático
- `latitude/longitude`: Coordenadas (scaled 1e6)
- `startTime/endTime`: Período do evento  
- `thresholdMm`: Limite de precipitação (scaled 1e3)
- `payoutPerToken`: Valor do payout em wei

### Liquidez
- `overcollateralizationRatio`: 150% padrão
- `MIN_PAYOUT_PER_TOKEN`: 0.001 ETH mínimo

### Oráculos
- `gasLimit`: 300,000 gas (limit Chainlink Functions)
- `subscriptionId`: ID da subscription Functions
- `donID`: Identificador da rede DON

## Custos Estimados (Sepolia)

| Operação | Gas Estimado | Custo LINK |
|----------|--------------|------------|
| Criar evento | ~500k | - |
| Comprar tokens | ~150k | - |
| Request dados | ~100k | ~0.25 |
| Automation upkeep | ~200k | ~0.02 |
| Settlement | ~300k | - |

## Principais Dependências

- **OpenZeppelin**: ERC1155, AccessControl, ReentrancyGuard
- **Chainlink**: FunctionsClient, AutomationCompatible
- **Solidity**: ^0.8.20

## Segurança

### Mitigações Implementadas
- Reentrancy guards em funções críticas
- Access control granular via roles  
- Overflow protection (Solidity 0.8+)
- Validação de parâmetros de entrada
- Limite de gas para callbacks Functions

### Riscos Identificados
- Dependência de oráculos externos (Open-Meteo API)
- Risco de liquidez em eventos extremos 
- Manipulação potencial de dados climáticos
- Risk de smart contract bugs

## Testing

Testes implementados em `test/ClimProtocol.t.sol`:
- Setup básico de contratos
- Provisão de liquidez
- Criação de eventos
- Compra de tokens  
- Integração entre componentes