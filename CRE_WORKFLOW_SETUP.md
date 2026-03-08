# 🔄 CRE Workflow Setup & Simulação

**Guia completo para testar o Chainlink Runtime Environment workflow**

---

## 📋 O que é o CRE Workflow?

O **Chainlink Runtime Environment (CRE)** permite criar workflows composable que rodam na rede descentralizada de oráculos (DON). Nosso workflow automatiza o settlement de eventos climáticos.

### Nossa Implementação

```
┌─────────────────────────────────────────────────────────┐
│         Clim Protocol CRE Settlement Workflow           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ⏰ Cron Trigger (*/5 min)                              │
│       │                                                 │
│       ▼                                                 │
│  📖 EVM Read: SettlementEngine.getActiveEvents()        │
│       │                                                 │
│       ▼                                                 │
│  📖 EVM Read: ClimProtocol.getEventDetails(eventId)     │
│       │  → lat, lon, startTime, endTime, threshold      │
│       │                                                 │
│       ▼                                                 │
│  🌐 HTTP Fetch: Open-Meteo Archive API                  │
│       │  → actual precipitation + DON consensus         │
│       │                                                 │
│       ▼                                                 │
│  🧮 Compute: actual < threshold → isDrought             │
│       │                                                 │
│       ▼                                                 │
│  ✍️  EVM Write: SettlementEngine.performUpkeep()        │
│       │  → triggers payout on-chain                     │
│       │                                                 │
│       ▼                                                 │
│  📡 Event Trigger: SettlementCompleted                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Capabilities usadas:**
- ✅ Cron Trigger (time-based)
- ✅ EVM Read (smart contracts)
- ✅ HTTP Fetch (external API)
- ✅ Compute (business logic)
- ✅ DON Consensus (median aggregation)
- ✅ EVM Write (on-chain transactions)
- ✅ Event Trigger (react to logs)

---

## 🛠️ Pré-requisitos

### 1. Bun Runtime

```powershell
# Windows (via PowerShell)
powershell -c "irm bun.sh/install.ps1|iex"

# Verificar instalação
bun --version
# Esperado: bun 1.x.x
```

**Alternativa:** Node.js v18+ também funciona (mas Bun é mais rápido)

### 2. CRE CLI (opcional, para deploy real)

```bash
# Instalar CRE CLI (Linux/Mac/WSL)
curl -sSL https://cre.chain.link/install.sh | bash

# Verificar
cre --version
```

**Nota:** Para simulação local, CRE CLI não é necessário.

---

## 📂 Estrutura do Projeto CRE

```
cre-workflow/
│
├── project.yaml              # Configuração do projeto CRE
├── secrets.yaml              # Credenciais (não commitar!)
├── README.md                 # Documentação do workflow
│
├── contracts/
│   └── abi/                  # ABIs dos contratos (para EVM read/write)
│       ├── SettlementEngine.json
│       └── ClimProtocol.json
│
└── my-workflow/
    ├── main.ts               # 🔥 Código do workflow
    ├── config.json           # Configuração (RPC, contratos)
    ├── workflow.yaml         # Settings de deployment
    ├── package.json          # Dependências
    └── tsconfig.json         # TypeScript config
```

---

## ⚙️ Configuração

### 1. Instalar Dependências

```powershell
cd cre-workflow/my-workflow
bun install
```

**Pacotes instalados:**
- `@chainlink/cre-sdk` - SDK para CRE capabilities
- `ethers` - Interação com Ethereum
- `dotenv` - Variáveis de ambiente

### 2. Configurar Variáveis de Ambiente

Criar `.env` na raiz do projeto:

```bash
# cre-workflow/.env

# Ethereum RPC (Sepolia)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

# Private key (só necessário para EVM Write)
CRE_ETH_PRIVATE_KEY=0x...

# Endereços dos contratos (após deploy)
SETTLEMENT_ENGINE_ADDRESS=0x...
CLIM_PROTOCOL_ADDRESS=0x...
```

**Obter RPC grátis:**
- Alchemy: https://alchemy.com
- Infura: https://infura.io
- QuickNode: https://quicknode.com

### 3. Configurar config.json

Editar `my-workflow/config.json`:

```json
{
  "network": {
    "chainId": 11155111,
    "rpcUrl": "${SEPOLIA_RPC_URL}",
    "name": "sepolia"
  },
  "contracts": {
    "settlementEngine": "${SETTLEMENT_ENGINE_ADDRESS}",
    "climProtocol": "${CLIM_PROTOCOL_ADDRESS}"
  },
  "openMeteo": {
    "apiUrl": "https://archive-api.open-meteo.com/v1/archive"
  },
  "workflow": {
    "cronSchedule": "*/5 * * * *",
    "donConsensus": "median"
  }
}
```

---

## 🧪 Simulação Local (sem deploy)

### Opção A: Executar main.ts diretamente

```powershell
cd cre-workflow/my-workflow
bun run main.ts
```

**Esperado:**
```
🔄 Clim Protocol CRE Workflow - Starting...

[Cron] Trigger activated (*/5 min simulation)
[EVM Read] Fetching active events from SettlementEngine...
  ✅ Found 1 active event: Event #1

[EVM Read] Reading event details from ClimProtocol...
  • Event ID: 1
  • Location: -8.05, -38.95
  • Period: 2026-01-01 to 2026-03-31 (90 days)
  • Threshold: 150mm

[HTTP Fetch] Querying Open-Meteo API...
  → DON Consensus: median of 5 nodes
  ✅ Precipitation: 87.3mm (consensus)

[Compute] Comparing values...
  • Actual: 87.3mm
  • Threshold: 150mm
  • Result: 87.3 < 150 → DROUGHT DETECTED! 🚨

[EVM Write] Triggering settlement...
  ✅ performUpkeep(eventId=1, actualPrecipitation=87.3)
  ✅ Transaction: 0xabc123...
  ✅ Gas used: ~256,000

[Event] SettlementCompleted emitted
  • Event ID: 1
  • Payout: 0.1 ETH
  • Timestamp: 2026-03-07 15:30:45

✅ Workflow completed successfully!
```

### Opção B: Modo de Teste (mock data)

```powershell
# Usar dados mockados (não precisa RPC)
$env:USE_MOCK_DATA="true"
bun run main.ts
```

---

## 📊 Capabilities Demonstradas

### 1. Cron Trigger ⏰

```typescript
// main.ts
export const cronTrigger = {
  schedule: '*/5 * * * *', // A cada 5 minutos
  timezone: 'UTC'
}

export default async function workflow(ctx: WorkflowContext) {
  console.log('Cron triggered at:', new Date().toISOString())
  // ...
}
```

**Simulação:** Script executa uma vez, mas em produção rodaria a cada 5 min.

### 2. EVM Read 📖

```typescript
// Ler eventos ativos
const activeEvents = await ctx.evm.read({
  address: contracts.settlementEngine,
  abi: settlementEngineABI,
  functionName: 'getActiveEvents'
})

// Ler detalhes do evento
const eventDetails = await ctx.evm.read({
  address: contracts.climProtocol,
  abi: climProtocolABI,
  functionName: 'getEventDetails',
  args: [eventId]
})
```

**Simulação:** Usa RPC configurado para ler estado on-chain.

### 3. HTTP Fetch 🌐

```typescript
// Consultar Open-Meteo API com consensus
const weatherData = await ctx.http.fetch({
  url: 'https://archive-api.open-meteo.com/v1/archive',
  method: 'GET',
  params: {
    latitude: eventDetails.latitude,
    longitude: eventDetails.longitude,
    start_date: startDate,
    end_date: endDate,
    daily: 'precipitation_sum'
  },
  consensus: {
    type: 'median', // DON calcula mediana das respostas
    minResponses: 3  // Mínimo de nós que devem responder
  }
})
```

**Simulação:** DON consensus é simulado localmente (5 requests, mediana calculada).

### 4. Compute 🧮

```typescript
// Calcular precipitação total
const totalPrecipitation = weatherData.daily.precipitation_sum
  .reduce((acc, val) => acc + val, 0)

// Comparar com threshold
const isDrought = totalPrecipitation < eventDetails.threshold

console.log(`${totalPrecipitation} < ${eventDetails.threshold} → ${isDrought ? 'DROUGHT' : 'OK'}`)
```

**Simulação:** Lógica roda localmente.

### 5. EVM Write ✍️

```typescript
// Disparar settlement se necessário
if (isDrought) {
  const tx = await ctx.evm.write({
    address: contracts.settlementEngine,
    abi: settlementEngineABI,
    functionName: 'performUpkeep',
    args: [eventId, Math.floor(totalPrecipitation * 100)] // Convert to mm * 100
  })
  
  console.log('Settlement triggered:', tx.hash)
}
```

**Simulação:** Requer private key configurada, envia transação real.

### 6. Event Trigger 📡

```typescript
// Reagir a eventos on-chain
ctx.on('SettlementCompleted', async (event) => {
  console.log('Settlement completed for event:', event.args.eventId)
  console.log('Payout amount:', event.args.payoutAmount)
  
  // Pode disparar notificações, webhooks, etc
})
```

**Simulação:** Escuta logs do contrato.

---

## 🎯 Testar Workflow Completo

### Passo 1: Deploy Contratos (se ainda não fez)

```powershell
cd contracts
forge script script/Deploy.s.sol --rpc-url $env:SEPOLIA_RPC_URL --broadcast
```

Copiar endereços deployados e adicionar ao `.env`.

### Passo 2: Criar Evento de Teste

```powershell
# Usar cast para criar evento on-chain
cast send $FACTORY_ADDRESS "createEvent(...)" --rpc-url $env:SEPOLIA_RPC_URL --private-key $env:PRIVATE_KEY
```

### Passo 3: Executar Workflow

```powershell
cd cre-workflow/my-workflow
bun run main.ts
```

### Passo 4: Verificar Resultado

```powershell
# Verificar eventos emitidos
cast logs --address $SETTLEMENT_ENGINE_ADDRESS --rpc-url $env:SEPOLIA_RPC_URL

# Verificar payout executado
cast call $TOKEN_ADDRESS "balanceOf(address)" $FARMER_ADDRESS --rpc-url $env:SEPOLIA_RPC_URL
```

---

## 🚀 Deploy no CRE DON (Produção)

### Passo 1: Registrar Workflow

```bash
cd cre-workflow
cre workflow register
```

**Output esperado:**
```
✅ Workflow registered successfully
Workflow ID: clim-protocol-settlement-123
Network: CRE Sepolia Testnet
```

### Passo 2: Publicar

```bash
cre workflow publish
```

**Output esperado:**
```
📦 Building workflow artifacts...
✅ TypeScript compiled
✅ Dependencies bundled
📤 Publishing to CRE DON...
✅ Workflow published!

Workflow URL: https://cre.chain.link/workflows/clim-protocol-settlement-123
```

### Passo 3: Monitorar Execução

```bash
cre workflow logs --follow
```

**Output esperado:**
```
[2026-03-07 15:00:00] Cron trigger activated
[2026-03-07 15:00:02] EVM Read: 1 active events
[2026-03-07 15:00:05] HTTP Fetch: Open-Meteo API (consensus: median)
[2026-03-07 15:00:08] Compute: DROUGHT detected
[2026-03-07 15:00:10] EVM Write: performUpkeep() → tx: 0xabc...
[2026-03-07 15:00:15] Settlement completed ✅
```

---

## 📸 Capturar Evidências para Hackathon

### 1. Screenshot da Simulação

```powershell
# Executar e capturar output
bun run main.ts > workflow-simulation.log 2>&1

# Revisar log
cat workflow-simulation.log
```

### 2. Criar Video/GIF (opcional)

```powershell
# Gravar terminal com Windows Terminal + OBS
# OU usar asciinema (se tiver WSL)
asciinema rec workflow-demo.cast
bun run main.ts
```

### 3. Export Metrics

```typescript
// Adicionar ao final de main.ts
console.log('\n📊 Workflow Metrics:')
console.log(`  • Execution time: ${executionTime}ms`)
console.log(`  • EVM reads: ${evmReads}`)
console.log(`  • HTTP requests: ${httpRequests}`)
console.log(`  • Gas used: ${gasUsed}`)
console.log(`  • DON nodes: ${donNodes}`)
```

---

## ✅ Verificação Final

**Antes de submeter ao hackathon, confirme:**

- [ ] Workflow executa sem erros: `bun run main.ts`
- [ ] Integra blockchain (Ethereum Sepolia)
- [ ] Integra API externa (Open-Meteo)
- [ ] Usa DON consensus (median)
- [ ] Demonstra EVM Read + Write
- [ ] Logs salvos (screenshot ou arquivo)
- [ ] Código comentado e documentado
- [ ] README do CRE atualizado

---

## 🐛 Troubleshooting

### Erro: "Cannot find module '@chainlink/cre-sdk'"

```powershell
cd cre-workflow/my-workflow
bun install @chainlink/cre-sdk
```

### Erro: "RPC URL not configured"

```powershell
# Verificar .env
cat ../.env | Select-String SEPOLIA_RPC_URL

# Se vazio, adicionar
echo "SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY" >> ../.env
```

### Erro: "Insufficient funds for gas"

```powershell
# Verificar balance
cast balance $YOUR_ADDRESS --rpc-url $env:SEPOLIA_RPC_URL

# Obter ETH testnet
# https://faucets.chain.link/sepolia
```

### Erro: "Contract not deployed"

```powershell
# Verificar se endereços estão corretos
cast code $SETTLEMENT_ENGINE_ADDRESS --rpc-url $env:SEPOLIA_RPC_URL

# Se retornar "0x", contrato não existe
# Fazer deploy primeiro: forge script script/Deploy.s.sol
```

---

## 📚 Recursos

### Documentação
- CRE Docs: https://docs.chain.link/cre
- CRE SDK: https://github.com/smartcontractkit/cre-sdk-typescript
- Bun Docs: https://bun.sh/docs

### Exemplos
- CRE Examples: https://github.com/smartcontractkit/cre-examples
- Workflow Templates: https://docs.chain.link/cre/templates

### Suporte
- Chainlink Discord: https://discord.gg/chainlink
- CRE Community: https://discord.gg/chainlink (canal #cre)

---

## 🎓 Próximos Passos

1. ✅ Simular workflow localmente
2. ✅ Capturar logs/evidências
3. ⬜ Deploy no CRE DON (opcional)
4. ⬜ Adicionar ao README principal
5. ⬜ Incluir na demo do vídeo

---

**Workflow pronto para produção! 🚀**

*Last updated: March 7, 2026*
