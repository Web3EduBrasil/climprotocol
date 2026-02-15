# Explicação Detalhada dos Smart Contracts — Clim Protocol

Este documento explica em detalhes cada smart contract, sua função no sistema e como todos se integram para criar a solução completa de tokenização de risco climático.

---

## 📋 Índice
1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Contratos Core](#contratos-core)
3. [Integração Chainlink](#integração-chainlink)
4. [Fluxo Completo](#fluxo-completo)
5. [Casos de Uso Reais](#casos-de-uso-reais)

---

## Visão Geral do Sistema

### O Problema que Resolvemos
Pequenos agricultores do **Semiárido de Pernambuco** sofrem com **secas recorrentes** mas não têm acesso a seguros tradicionais por serem caros, burocráticos e lentos. Quando a precipitação fica abaixo de 150mm em 90 dias, as safras são severamente prejudicadas.

### Nossa Solução: Parametric Drought Protection
Um protocolo DeFi focado em **proteção contra seca**:
- 🌵 **Eventos de seca** viram **tokens negociáveis** (ERC-1155)
- 📊 **Dados reais de precipitação** via **oráculos Chainlink** (Open-Meteo API)
- 💰 **Pagamento automático** quando precipitação < 150mm em 90 dias
- 🔄 **Sem burocracia**, liquidação automática em minutos/horas
- 🌾 **Foco no Semiárido**: região mais afetada por secas no Brasil

---

## Contratos Core

### 1. ClimateEventToken.sol
**Tipo:** ERC-1155 Multi-Token  
**Arquivo:** `contracts/src/core/ClimateEventToken.sol`

#### O que faz?
É o **"certificado de seguro"** tokenizado. Cada `tokenId` representa um evento climático específico.

#### Conceito
Imagine que você tem um certificado que diz:
> "Se chover menos de 150mm no Sertão de Pernambuco durante 90 dias (jan-mar 2026), este certificado vale R$ 250"

No Clim Protocol, esse certificado é um token ERC-1155 que protege contra seca.

#### Funcionalidades Principais

**1. createEvent()** - Cria um novo evento climático
```solidity
function createEvent(
    uint256 eventId,           // ID único do evento
    ClimateEventData memory data, // Dados: lat, lon, período, threshold
    address recipient,         // Quem recebe os tokens iniciais
    uint256 amount            // Quantos tokens criar
)
```

**Exemplo Real:**
```solidity
// Evento: "Seca no Sertão PE - Jan-Mar 2026 (90 dias)"
eventData = {
    latitude: -8.285.000 (Sertão de Pernambuco),
    longitude: -37.975.000,
    startTime: 1º janeiro 2026,
    endTime: 31 março 2026,  // 90 dias
    thresholdMm: 150.000 (150mm de chuva acumulada),
    payoutPerToken: 0.05 ETH (~R$ 250),
    totalSupply: 1000 tokens
}
```

**2. settleEvent()** - Liquida o evento com dados reais
```solidity
function settleEvent(
    uint256 eventId,
    uint256 actualMm  // Precipitação real que ocorreu
)
```

**Exemplo:**
```solidity
// 90 dias terminaram, choveu apenas 120mm (seca severa!)
settleEvent(eventId, 120_000); // 120mm < 150mm → Payout disparado!
```

**3. redeemTokens()** - Usuário resgata payout
```solidity
function redeemTokens(uint256 eventId)
```

**Lógica:**
- Se `actualMm < thresholdMm` → Usuário recebe payout
- Se `actualMm >= thresholdMm` → Tokens são queimados sem payout

#### Por que ERC-1155?
- ✅ Um contrato gerencia **múltiplos eventos** (gas eficiente)
- ✅ Tokens podem ser **transferidos/negociados**
- ✅ Integração fácil com wallets e marketplaces

#### Papel no Sistema
É o **núcleo** do protocolo. Todos os outros contratos existem para criar, vender, financiar e liquidar esses tokens.

---

### 2. LiquidityPool.sol
**Arquivo:** `contracts/src/core/LiquidityPool.sol`

#### O que faz?
É a **caixa do seguro**. Armazena capital para pagar os agricultores quando eventos são disparados.

#### Conceito
Como uma seguradora tradicional tem uma reserva de dinheiro para pagar sinistros, o Clim Protocol tem este pool.

#### Funcionalidades Principais

**1. deposit()** - Provedores de liquidez depositam ETH
```solidity
function deposit() external payable
```

**Quem são os LPs (Liquidity Providers)?**
- Investidores que querem retorno
- Fundos de impacto social
- Cooperativas agrícolas com capital
- DAOs e protocolos DeFi

**O que ganham?**
- Prêmios dos agricultores que compram proteção
- Rendimento passivo (APY depende da oferta/demanda)

**2. lockCollateral()** - Bloqueia capital quando evento é criado
```solidity
function lockCollateral(uint256 eventId, uint256 amount)
```

**Por que bloquear?**
Garantir que há dinheiro suficiente para pagar se o evento disparar.

**Overcollateralization:**
- Evento com payout máximo de 1 ETH
- Pool bloqueia 1.5 ETH (150%)
- Margem de segurança contra múltiplos eventos simultâneos

**3. releaseCollateral()** - Libera capital após liquidação
```solidity
function releaseCollateral(uint256 eventId, uint256 payoutAmount)
```

**Dois cenários:**
- **Evento disparou:** Paga `payoutAmount`, libera resto
- **Evento não disparou:** Libera tudo, LPs mantêm prêmios

**4. withdraw()** - LPs retiram capital
```solidity
function withdraw(uint256 amount)
```

**Proteções:**
- Só pode sacar se não estiver bloqueado em eventos ativos
- Previne "bank run" deixando protocolo insolvente

#### Variáveis Críticas

```solidity
// ANTES DA CORREÇÃO (BUGADO)
function availableLiquidity() public view returns (uint256) {
    uint256 totalLocked = 0; // ❌ Sempre zero!
    return totalLiquidity - totalLocked;
}

// DEPOIS DA CORREÇÃO (SEGURO)
uint256 public totalLockedCollateral; // ✅ Tracking global

function availableLiquidity() public view returns (uint256) {
    return totalLiquidity > totalLockedCollateral 
        ? totalLiquidity - totalLockedCollateral 
        : 0;
}
```

**Por que isso é crítico?**
Evita criar mais eventos do que o pool pode cobrir (insolvência).

#### Papel no Sistema
É o **cofre** que garante solvência e pagamentos. Sem ele, tokens seriam apenas promessas vazias.

---

### 3. ClimateEventFactory.sol
**Arquivo:** `contracts/src/core/ClimateEventFactory.sol`

#### O que faz?
É a **"lojinha"** onde eventos são criados e tokens são vendidos.

#### Funcionalidades Principais

**1. createClimateEvent()** - Cria novo evento
```solidity
function createClimateEvent(
    int256 latitude,       // Ex: -8.285.000 (Sertão de Pernambuco)
    int256 longitude,      // Ex: -37.975.000
    uint256 startTime,     // Quando começa
    uint256 endTime,       // Quando termina (90 dias depois)
    uint256 thresholdMm,   // Limiar de precipitação (ex: 150mm)
    uint256 payoutPerToken,// Quanto vale cada token
    uint256 tokensToCreate // Quantos tokens criar
) returns (uint256 eventId)
```

**Validações importantes:**
```solidity
// Geografia
require(latitude >= -90_000_000 && latitude <= 90_000_000);
require(longitude >= -180_000_000 && longitude <= 180_000_000);

// Tempo
require(startTime > block.timestamp + 1 hour); // Não pode começar imediatamente
require(endTime - startTime >= 1 day);         // Duração mínima
require(endTime - startTime <= 365 days);      // Duração máxima

// Economia
require(payoutPerToken >= 0.001 ether);        // Payout mínimo
```

**Por que essas validações?**
- Evitar coordenadas inválidas
- Dar tempo para usuários comprarem tokens
- Garantir viabilidade econômica

**2. buyClimateTokens()** - Usuários compram proteção
```solidity
function buyClimateTokens(
    uint256 eventId,
    uint256 tokenAmount
) external payable
```

**Fluxo interno:**
1. Calcula prêmio (taxa que o usuário paga)
2. Verifica que há tokens disponíveis
3. Verifica que evento ainda não começou
4. Transfere tokens para comprador
5. Deposita prêmio no LiquidityPool
6. Devolve troco se pagou a mais

**3. calculatePremium()** - Calcula quanto custa a proteção
```solidity
function calculatePremium(
    uint256 payoutPerToken,
    uint256 duration
) public view returns (uint256)
```

**Fórmula:**
```
premium = payoutPerToken × basePremiumRate × durationMultiplier

Onde:
- basePremiumRate = 10% (100/1000)
- durationMultiplier = 1 + (dias × riskMultiplier)
```

**Exemplo (Evento de 90 dias):**
- Payout: 0.05 ETH
- Duração: 90 dias
- Premium base: 0.05 × 10% = 0.005 ETH
- Multiplicador: 1 + (90 × 0.05) = 5.5
- Premium final: 0.005 × 5.5 = 0.0275 ETH (~R$ 275)

**Por que premium < payout?**
Nem todas as secas ocorrem. LPs lucram quando precipitação fica > 150mm (evento não dispara).

#### Papel no Sistema
É a **interface de mercado** entre usuários e o protocolo.

---

### 4. SettlementEngine.sol
**Arquivo:** `contracts/src/core/SettlementEngine.sol`

#### O que faz?
É o **robô automático** que verifica eventos expirados e dispara liquidações.

#### Integração com Chainlink Automation

**1. checkUpkeep()** - Chainlink chama periodicamente
```solidity
function checkUpkeep(bytes calldata) 
    external view 
    returns (bool upkeepNeeded, bytes memory performData)
```

**Lógica:**
```solidity
// Percorre eventos ativos
for (cada evento in activeEvents) {
    // Verifica se expirou e não foi liquidado
    if (block.timestamp > evento.endTime && !settled) {
        eventsToSettle.push(evento);
    }
}

if (eventsToSettle.length > 0) {
    return (true, encode(eventsToSettle)); // Sim, precisa upkeep!
}
```

**2. performUpkeep()** - Chainlink executa automaticamente
```solidity
function performUpkeep(bytes calldata performData) external
```

**Fluxo:**
1. Recebe lista de eventos para liquidar
2. Para cada evento, chama `ClimateOracle.requestClimateData()`
3. Aguarda resposta do oráculo
4. Chama `processSettlement()` quando dados chegam

**3. processSettlement()** - Finaliza liquidação
```solidity
function processSettlement(uint256 eventId) external
```

**Passos:**
1. Pega dados de precipitação do oracle
2. Chama `ClimateEventToken.settleEvent()`
3. Calcula se payout é necessário
4. Chama `LiquidityPool.releaseCollateral()`
5. Remove evento da lista de ativos

#### Proteção contra DoS

**ANTES (Vulnerável):**
```solidity
for (uint256 i = 0; i < activeEvents.length; i++) {
    // Se activeEvents tem 10.000 itens = OUT OF GAS!
}
```

**DEPOIS (Seguro):**
```solidity
uint256 public constant MAX_EVENTS_PER_UPKEEP = 10;

for (uint256 i = 0; i < activeEvents.length && checked < MAX_EVENTS_PER_UPKEEP; i++) {
    // Máximo 10 eventos por vez
}
```

#### Papel no Sistema
É o **piloto automático** que garante que eventos sejam liquidados mesmo se ninguém fizer nada manualmente.

---

### 5. ClimateOracle.sol
**Arquivo:** `contracts/src/oracle/ClimateOracle.sol`

#### O que faz?
É a **ponte** entre blockchain (on-chain) e mundo real (off-chain).

#### Por que precisamos de um oráculo?
Blockchains não podem acessar APIs da internet diretamente. Chainlink Functions resolve isso executando código JavaScript em uma rede descentralizada de nós.

#### Funcionalidades Principais

**1. requestClimateData()** - Solicita dados climáticos
```solidity
function requestClimateData(
    uint256 eventId,
    int256 latitude,
    int256 longitude,
    uint256 startTime,
    uint256 endTime
) external returns (bytes32 requestId)
```

**O que acontece:**
1. Converte parâmetros para strings
2. Cria request Chainlink Functions
3. Envia para DON (Decentralized Oracle Network)
4. DON executa JavaScript em `functions/climate-data.js`
5. Retorna `requestId` para tracking

**2. fulfillRequest()** - Recebe resposta do oráculo
```solidity
function fulfillRequest(
    bytes32 requestId,
    bytes memory response,
    bytes memory err
) internal override
```

**Callback automático:**
```solidity
if (err.length > 0) {
    emit RequestFailed(requestId, err);
    return; // Falhou, registrar erro
}

uint256 precipitationMm = abi.decode(response, (uint256));

// Validação de sanidade
require(precipitationMm < MAX_VALID_PRECIPITATION, "Valor absurdo!");

eventPrecipitationData[eventId] = precipitationMm;
emit ClimateDataReceived(requestId, eventId, precipitationMm);
```

#### O Código JavaScript (functions/climate-data.js)

```javascript
// Recebe argumentos do contrato
const lat = args[0];    // "-8.05"
const lon = args[1];    // "-34.881"
const startDate = args[2]; // "2026-03-01"
const endDate = args[3];   // "2026-03-31"

// Chama Open-Meteo API
const apiResponse = await Functions.makeHttpRequest({
  url: "https://archive-api.open-meteo.com/v1/archive",
  params: {
    latitude: lat,
    longitude: lon,
    start_date: startDate,
    end_date: endDate,
    daily: "precipitation_sum"
  }
});

// Processa resposta
const precipitationArray = apiResponse.data.daily.precipitation_sum;
const totalPrecipitation = precipitationArray
  .filter(val => val !== null)
  .reduce((sum, val) => sum + val, 0);

// Retorna valor escalado (mm × 1000)
return Functions.encodeUint256(Math.floor(totalPrecipitation * 1000));
```

**Por que escalar por 1000?**
Solidity não tem decimais. `25.3mm` vira `25300` (25.3 × 1000).

#### API Open-Meteo

**Por que Open-Meteo?**
- ✅ Gratuita
- ✅ Sem API key
- ✅ Dados históricos completos
- ✅ Cobertura global
- ✅ Alta confiabilidade

**Resposta exemplo:**
```json
{
  "daily": {
    "time": ["2026-03-01", "2026-03-02", ..., "2026-03-31"],
    "precipitation_sum": [0.0, 2.3, 15.7, ..., 1.2]
  }
}
```

#### Papel no Sistema
É o **termômetro confiável** que traz verdade do mundo real para a blockchain.

---

### 6. ClimProtocol.sol (Facade)
**Arquivo:** `contracts/src/ClimProtocol.sol`

#### O que faz?
É a **recepção** do protocolo. Simplifica interação agrupando funcionalidades.

#### Funcionalidades Principais

**1. getProtocolStats()** - Estatísticas gerais
```solidity
function getProtocolStats() external view returns (
    uint256 totalLiquidity,    // Quanto $ no pool
    uint256 availableLiquidity, // Quanto disponível
    uint256 activeEvents,       // Eventos ativos
    string memory version       // Versão do protocolo
)
```

**2. quickBuy()** - Compra simplificada
```solidity
function quickBuy(uint256 eventId, uint256 tokenAmount) external payable
```

Apenas chama `factory.buyClimateTokens()` internamente.

**3. getUserPortfolio()** - Portfólio do usuário
```solidity
function getUserPortfolio(address user) external view returns (
    uint256[] memory eventIds,       // Eventos que possui tokens
    uint256[] memory tokenBalances, // Quantos tokens de cada
    uint256[] memory potentialPayouts, // Quanto pode receber
    bool[] memory canRedeem         // Quais pode resgatar agora
)
```

#### Papel no Sistema
É o **ponto de entrada** para frontends e integrações externas.

---

## Integração Chainlink

### Chainlink Functions
**O que é:** Permite executar código JavaScript off-chain de forma descentralizada.

**Como usamos:**
`ClimateOracle` → envia request → DON executa JS → retorna dados → callback `fulfillRequest()`

**Configuração:**
1. Criar subscription em https://functions.chain.link/
2. Financiar com LINK tokens
3. Adicionar `ClimateOracle` como consumer

### Chainlink Automation
**O que é:** Executa funções smart contract automaticamente (como um cron job).

**Como usamos:**
Chainlink → chama `SettlementEngine.checkUpkeep()` periodicamente → se retorna `true` → chama `performUpkeep()`

**Configuração:**
1. Registrar `SettlementEngine` em https://automation.chain.link/
2. Configurar schedule (ex: check a cada 1 hora)
3. Financiar com LINK tokens

---

## Fluxo Completo (Exemplo Real)

### Cenário: João, agricultor do Sertão de Pernambuco

**Janeiro-Março de 2026 - Estação Chuvosa (90 dias)**

**1. LP Fornece Liquidez (15 de dezembro 2025)**
```solidity
// Maria deposita 50 ETH no pool
liquidityPool.deposit{value: 50 ether}();
```

**2. Admin Cria Evento (20 de dezembro 2025)**
```solidity
// "Seca no Sertão PE - Janeiro-Março 2026 (90 dias)"
factory.createClimateEvent(
    -8_285_000,  // Sertão de Pernambuco (lat)
    -37_975_000, // Sertão de Pernambuco (lon)
    1º janeiro 2026,
    31 março 2026,  // 90 dias
    150_000,     // Se chover < 150mm (seca severa)
    0.05 ether,  // Paga 0.05 ETH por token
    1000         // 1000 tokens disponíveis
);
```

**Internamente:**
```
✅ Factory valida parâmetros
✅ Pede para Pool bloquear: 1000 × 0.05 ETH × 1.5 = 75 ETH collateral
✅ ClimateEventToken minta 1000 tokens para Factory
✅ SettlementEngine adiciona evento à lista de monitoramento
```

**3. João Compra Proteção (27 de dezembro 2025)**
```solidity
// João compra 20 tokens (protegendo sua plantação de feijão)
uint256 premium = factory.getEventPremium(eventId); 
// premium = ~0.0275 ETH por token (90 dias, maior risco)
// total = 0.0275 × 20 = 0.55 ETH (~R$ 5.500)

factory.buyClimateTokens{value: 0.55 ether}(eventId, 20);
```

**Internamente:**
```
✅ Factory transfere 20 tokens para João
✅ Deposita 0.55 ETH no LiquidityPool (prêmio para Maria)
✅ João agora tem "seguro" contra seca por 90 dias
```

**31 de março - Evento Termina**

**4. Chainlink Automation Detecta (1º de abril 2026)**
```solidity
// Chainlink chama automaticamente
settlementEngine.checkUpkeep() 
// Retorna: (true, [eventId]) - precisa liquidar!

settlementEngine.performUpkeep([eventId])
// ↓ Dispara
oracle.requestClimateData(eventId, lat, lon, startDate, endDate)
```

**5. Chainlink Functions Busca Dados**
```javascript
// JavaScript roda em DON
GET https://archive-api.open-meteo.com/v1/archive?
    latitude=-8.285&
    longitude=-37.975&
    start_date=2026-01-01&
    end_date=2026-03-31&
    daily=precipitation_sum

// Resposta: Total acumulado em 90 dias = 98.4mm (seca severa!)

return encodeUint256(98400); // 98.4mm × 1000
```

**6. Oracle Recebe Callback**
```solidity
oracle.fulfillRequest(requestId, response, "")
// Decodifica: precipitationMm = 98400 (98.4mm em 90 dias)
// Armazena: eventPrecipitationData[eventId] = 98400
```

**7. Settlement Processa**
```solidity
settlementEngine.processSettlement(eventId)
```

**Internamente:**
```
✅ Pega precipitação: 98400 (98.4mm em 90 dias)
✅ Compara com threshold: 98400 < 150000 → SECA SEVERA CONFIRMADA!
✅ ClimateEventToken.settleEvent(eventId, 98400)
✅ Status muda para SETTLED
✅ LiquidityPool.releaseCollateral(eventId, payout=20 × 0.05 ETH = 1.0 ETH)
```

**8. João Resgata Payout (qualquer momento após settlement)**
```solidity
climateEventToken.redeemTokens(eventId)
```

**Internamente:**
```
✅ Verifica: 98400 < 150000 → payout = 20 × 0.05 ETH = 1.0 ETH
✅ Queima 20 tokens de João
✅ Transfere 1.0 ETH (~R$ 10.000) para João
✅ Marca como resgatado (anti double-redeem)
```

**Resultado Final:**
- João pagou: 0.55 ETH (R$ 5.500)
- João recebeu: 1.0 ETH (R$ 10.000)
- Lucro líquido: 0.45 ETH (R$ 4.500) 🎉
- **Safra salva**: João tem capital para replantio e sustento da família

- Maria obteve: prêmios de todos que compraram
- Maria pagou: payouts dos eventos que dispararam (secas reais)
- Lucro depende da taxa de eventos disparados vs. não disparados

---

## Casos de Uso Reais

### 1. Agricultor de Feijão - Seca Sazonal (Caso Principal)
**Problema:** Plantação de feijão no Semiárido precisa de pelo menos 150mm de chuva durante a estação chuvosa (jan-mar).

**Solução:**
```solidity
createClimateEvent(
    latitude: -8.285.000 (Sertão de Pernambuco),
    longitude: -37.975.000,
    threshold: 150_000 (150mm em 90 dias),
    period: Janeiro-Março 2026,
    payout: 0.05 ETH por token
)
```

Se chover < 150mm em 90 dias → payout cobre prejuízo da safra perdida.

### 2. Cooperativa Agrícola - Milho e Mandioca
**Problema:** Cooperativa com 50 agricultores precisa proteger toda a produção.

**Solução:**
```solidity
// Compra coletiva de proteção
buyClimateTokens(eventId, 500 tokens)
// Total: 500 × 0.05 ETH = 25 ETH de payout potencial
// Premium: ~13.75 ETH para proteção de 90 dias
```

Cada membro contribui proporcionalmente, proteção coletiva contra seca.

### 3. Agricultor - Seca no Período de Plantio
**Problema:** Se chover muito pouco no início (jan-fev), não vale plantar.

**Solução:**
```solidity
createClimateEvent(
    latitude: -7.874.000 (Cariri, Paraíba),
    longitude: -36.524.000,
    threshold: 100_000 (100mm em 60 dias),
    period: Janeiro-Fevereiro 2026,
    payout: 0.03 ETH por token
)
```

Payout compensa custo de sementes/insumos não utilizados.

### 4. Expansão Futura - Outros Fenômenos
**Chuva Excessiva (versão futura):**
```solidity
createClimateEvent(
    region: Zona da Mata PE,
    metric: PRECIPITATION,
    threshold: 400_000 (400mm),
    condition: ABOVE, // Paga se > threshold
    period: Abril-Junho 2026,
    payout: 0.04 ETH por token
)
```

**Temperatura Extrema (versão futura):**
```solidity
createClimateEvent(
    region: Sertão PE,
    metric: TEMPERATURE_MAX,
    threshold: 42_000 (42°C),
    condition: ABOVE,
    period: Novembro 2026 (colheita),
    payout: 0.06 ETH por token
)
```

---

## Resumo da Integração

```
┌─────────────────────────────────────────────────────────┐
│                 USUÁRIOS (Agricultores)                  │
└──────────┬──────────────────────────────────────┬────────┘
           │ compram tokens                       │ resgatam payout
           ▼                                      ▼
    ┌──────────────┐                    ┌──────────────────┐
    │   Factory    │◄───────────────────│  EventToken      │
    │ (Lojinha)    │ minta tokens       │  (Certificados)  │
    └──────┬───────┘                    └────────┬─────────┘
           │                                     ▲
           │ lock collateral                     │ settle
           ▼                                     │
    ┌──────────────┐                    ┌──────────────────┐
    │ LiquidityPool│                    │ SettlementEngine │
    │   (Cofre)    │◄───────────────────│    (Automação)   │
    └──────────────┘  release funds     └────────┬─────────┘
           ▲                                     │
           │ prêmios                             │ request data
           │                                     ▼
    ┌──────────────┐                    ┌──────────────────┐
    │   LPs        │                    │ ClimateOracle    │
    │ (Investidores)│                   │  (Ponte Dados)   │
    └──────────────┘                    └────────┬─────────┘
                                                 │
                                                 ▼
                                        ┌─────────────────┐
                                        │ Chainlink DON   │
                                        │ (Dados Reais)   │
                                        └─────────────────┘
                                                 │
                                                 ▼
                                        ┌─────────────────┐
                                        │ Open-Meteo API  │
                                        │ (Meteorologia)  │
                                        └─────────────────┘
```

---

## Por Que Isso Funciona?

### 1. Transparência
Todos os contratos são open-source. Qualquer um pode verificar as regras.

### 2. Confiança Minimizada
- Não precisa confiar em seguradora
- Não precisa confiar em governo
- Precisa confiar apenas em: matemática + código + oráculos descentralizados

### 3. Velocidade
- Seguro tradicional: meses para receber
- Clim Protocol: horas após evento terminar

### 4. Acessibilidade
- Seguro tradicional: R$ 1.000+ de prêmio
- Clim Protocol: compre 1 token por ~R$ 10

### 5. Programabilidade
- Pode criar derivativos
- Pode fazer hedge complexo
- Pode integrar em DeFi (usar CET como collateral)

---

## Conclusão

O Clim Protocol não é apenas um "contrato inteligente". É um **sistema completo de proteção paramétrica contra seca** que:

1. **Tokeniza risco de seca** (ClimateEventToken) no Semiárido
2. **Gerencia capital** (LiquidityPool) para garantir pagamentos
3. **Cria mercado** (ClimateEventFactory) acessível para pequenos agricultores
4. **Automatiza liquidação** (SettlementEngine) sem intermediários
5. **Conecta realidade** (ClimateOracle + Chainlink) com dados meteorológicos reais
6. **Simplifica uso** (ClimProtocol Facade) para integrações

Tudo trabalhando junto para criar um **seguro paramétrico de seca descentralizado, transparente e acessível** focado no **Semiárido de Pernambuco**.

### 🎯 Impacto Esperado
- ✅ Agricultores do Semi árido com acesso a proteção financeira
- ✅ Sem burocracia: compra em minutos, payout automático
- ✅ Acessível: a partir de 1 token (~R$ 275)
- ✅ Transparente: código open-source, regras claras
- ✅ Rápido: liquidação em horas após fim do período de 90 dias

---

**Próximo passo**: Execute os testes para ver tudo isso funcionando! Ver `HOW_TO_TEST.md`.

Data: 15/02/2026