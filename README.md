# Clim Protocol

**Parametric Drought Protection for Small Farmers** — Tokenização de Risco Climático usando Oráculos Descentralizados (MVP para Hackathon Chainlink Convergence 2026).

---

## 📚 Documentação Completa

**✨ NOVA ESTRUTURA ORGANIZADA:** Toda documentação foi movida para a pasta [`docs/`](./docs/)

👉 **[ACESSE A DOCUMENTAÇÃO COMPLETA AQUI](./docs/README.md)**

**Destaques:**
- 🎤 **[PITCH_DECK.md](./docs/PITCH_DECK.md)** - **Apresentação para hackathon** 🏆
- 📊 **[STATUS.md](./docs/STATUS.md)** - **Visão executiva do projeto**
- ⭐ **[TEST_REPORT.md](./docs/phase3-testes-validacao/TEST_REPORT.md)** - **66/66 testes passando (100%)**
- 📋 **[Phase 1: Planejamento](./docs/phase1-planejamento/)** - Arquitetura e design
- 🔨 **[Phase 2: Implementação](./docs/phase2-implementacao/)** - Desenvolvimento dos contratos
- ✅ **[Phase 3: Testes](./docs/phase3-testes-validacao/)** - Relatórios e cobertura

---

## Resumo

O Clim Protocol oferece **proteção paramétrica contra seca** para pequenos agricultores do **Semiárido de Pernambuco**. Tokenizamos eventos de seca como instrumentos on‑chain (Climate Event Tokens — CET) que pagam automaticamente quando a precipitação acumulada fica abaixo de 150mm em 90 dias. O MVP usa **Chainlink Functions** para consultar dados climáticos reais (Open-Meteo) e **Chainlink Automation** para executar liquidações automáticas.

## 🎯 Foco do MVP
- **Fenômeno**: Seca (Drought)
- **Região**: Semiárido de Pernambuco (Nordeste do Brasil)
- **Métrica**: Precipitação acumulada (mm)
- **Período**: 90 dias
- **Trigger**: Precipitação < 150mm
- **Token**: ERC-1155 (Climate Event Tokens)
- **Liquidação**: Automática via Chainlink Functions + Automation

## Arquitetura

- `Climate Event Factory` — cria definições de eventos (lat, lon, período, limiar)
- `Climate Event Token (ERC-1155)` — representa a proteção
- `Liquidity Pool` — capital para financiar payouts
- `Settlement Engine` — coordena verificação e pagamentos
- `Oracle Layer (Chainlink Functions)` — consulta Open‑Meteo e retorna métricas on‑chain
- `Automation (Chainlink)` — dispara verificações/settlement em schedule

Diagrama (resumo):

Frontend → ClimProtocol (Facade) → Factory / Pool / Settlement
                                  ↑
                                  Chainlink Functions + Automation

## Tecnologias

- Solidity (Foundry)
- ERC-1155 (OpenZeppelin)
- Chainlink Functions (Sepolia)
- Chainlink Automation (Sepolia)
- Next.js + wagmi + viem (frontend)
- Open-Meteo (API climática)

## 🌾 Exemplo de Uso (Semiárido de Pernambuco)

1. **LP fornece liquidez**: Investidor deposita 50 ETH no pool
2. **Admin cria evento**: "Seca no Sertão PE, jan-mar/2026 (90 dias), precipitação < 150mm, payout 0.05 ETH/token"
3. **Agricultor compra tokens**: Paga premium de ~0.0275 ETH por token (proteção contra seca)
4. **Período de 90 dias termina**: Chainlink Functions busca dados da Open-Meteo API
5. **Liquidação automática**: Se precipitação acumulada < 150mm → payout disparado
6. **Agricultor resgata**: Recebe 0.05 ETH por token diretamente na wallet

## Estrutura proposta do repositório

- [contracts/](contracts/) — contratos Solidity (core, oracle, settlement)
- [frontend/](frontend/) — Next.js app
- [functions/](functions/) — código JavaScript para Chainlink Functions
- `foundry.toml`, deploy scripts, testes

## Quickstart (desenvolvimento)

Pré-requisitos:

- Node.js v18+
- Foundry (forge) instalado
- Conta Sepolia com ETH e LINK de teste (https://faucets.chain.link/sepolia)
- RPC Sepolia (Alchemy / Infura) — configurar `SEPOLIA_RPC`

### Instalando Foundry no Windows

Opção 1 - Via Rust (recomendado):
```bash
# Instale Rust primeiro
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs/ | sh

# Instale Foundry
cargo install --git https://github.com/foundry-rs/foundry foundry-cli anvil --bins --locked
```

Opção 2 - Binários pré-compilados:
- Baixe os binários em https://github.com/foundry-rs/foundry/releases
- Adicione ao PATH do Windows

Passos mínimos:

1. Clone o repositório

2. Instalar dependências frontend:

```bash
cd frontend
npm install
```

3. Configurar variáveis de ambiente (exemplo `.env`):

```
SEPOLIA_RPC=https://...
PRIVATE_KEY=0x...
NEXT_PUBLIC_RPC=https://...
```

4. Rodar testes Foundry (local):

```bash
forge test -vvv --fork-url $SEPOLIA_RPC
```

5. Deploy local de contratos (script Foundry):

```bash
forge script script/Deploy.s.sol:Deploy --rpc-url $SEPOLIA_RPC --private-key $PRIVATE_KEY --broadcast
```

6. Configurar Chainlink Functions:

- Ir para https://functions.chain.link/ e criar subscription
- Adicionar consumer (endereço do contrato `ClimateOracle` após deploy)
- Financiar subscription com LINK testnet (mínimo ~2 LINK)
- Testar o `source` no Functions Playground: https://functions.chain.link/playground

7. Registrar Automation upkeep (https://automation.chain.link/) apontando para o contrato `SettlementEngine` e financiar com LINK testnet.

## Chainlink Functions — notas rápidas

- Use Open‑Meteo para consultas históricas de precipitação (gratuito, sem API key)
- Limites de execução: timeout ~10s, callback gas ≤ 300k
- Teste o JS source no Playground antes de chamar on‑chain

Exemplo de fluxo:

1. `SettlementEngine.performUpkeep()` chama `_sendRequest()` do `ClimateOracle`.
2. Chainlink DON roda o JS (Functions) que consulta Open‑Meteo e retorna precipitação acumulada.
3. `fulfillRequest()` grava resultado e `SettlementEngine` processa payouts se limiar atingido.

## Testes e validação

- Escrever testes unitários com mocks de resposta Functions.
- Testes de integração usando fork Sepolia para simular respostas reais.

## Roadmap pós-hackathon

- Suporte para múltiplas métricas (temperatura, vento)
- Pools dinâmicos e pricing on‑chain
- Integração CCIP para cross‑chain
- DAO de governança

## Como contribuir

1. Abra uma issue descrevendo o feature/bug
2. Fork → branch com PR
3. Adicione testes para qualquer mudança de lógica

## 📚 Links Úteis

### 🚀 Para Começar Rapidamente
- **[Documentação Completa](./docs/README.md)** - Hub central de toda documentação
- **[Como Testar](./docs/phase3-testes-validacao/HOW_TO_TEST.md)** - Guia prático de testes
- **[Relatório de Testes](./docs/phase3-testes-validacao/TEST_REPORT.md)** - 66/66 testes ✅
- **[Correções Aplicadas](./docs/phase3-testes-validacao/CORRECTIONS_APPLIED.md)** - Últimas atualizações

### 📋 Documentação por Fase
- **[Phase 1: Planejamento](./docs/phase1-planejamento/)** - Arquitetura e design do sistema
- **[Phase 2: Implementação](./docs/phase2-implementacao/)** - Desenvolvimento dos contratos
- **[Phase 3: Testes](./docs/phase3-testes-validacao/)** - Validação completa do protocolo

### 🔗 Recursos Externos
- **Chainlink Functions:** https://docs.chain.link/chainlink-functions/getting-started
- **Chainlink Automation:** https://docs.chain.link/chainlink-automation/overview/getting-started
- **Open-Meteo API:** https://open-meteo.com/
- **Foundry Book:** https://book.getfoundry.sh/
- **OpenZeppelin Docs:** https://docs.openzeppelin.com/

---

**Licença:** MIT  
**Hackathon:** Chainlink Convergence 2026  
**Status:** ✅ MVP Completo - Pronto para Testnet
