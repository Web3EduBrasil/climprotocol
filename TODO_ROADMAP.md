# TODO & Roadmap Detalhado — Clim Protocol

Este documento fornece um roadmap detalhado e um TODO list técnico para desenvolvedores que irão contribuir no repositório.
Cada item contém descrição, responsável sugerido, estimativa de esforço e critérios de aceitação.

## Visão Geral (nível alto)
- Fase 1 (COMPLETED): Scaffold Foundry, contratos core, oracle Functions JS, testes e deploy script.
- Fase 2 (PRÓXIMO): Frontend mínimo Next.js + integração Web3; completar integração Chainlink Functions/Automation e testes E2E em Sepolia.
- Fase 3 (opcional pós-hackathon): Multi-região, mais métricas, pools dinâmicos, CCIP, DAO.

## TODOs Prioritários (curto prazo)

1) Scaffold Next.js frontend (Responsável: frontend dev) — 2–4 dias
- Tarefas:
  - `frontend/` inicialização com Next.js (app router), TypeScript opcional
  - Instalar `wagmi`, `viem`, `ethers` e `@web3modal/react` (ou WalletConnect)
  - Configurar providers para Sepolia
  - Páginas: `/` (landing), `/events`, `/event/[id]`, `/provide`, `/portfolio`, `/admin`
  - Componentes: `EventCard`, `BuyCET`, `ProvideLiquidity`, `EventDetail`, `ConnectWallet`
  - Hooks: `useClimProtocol`, `useBuyCET`, `useProvideLiquidity`, `useFetchEvents`
- Critério de aceitação:
  - Usuário consegue conectar wallet, listar eventos, comprar CET e ver carteira localmente (simulado com Sepolia)

2) Configurar Chainlink Functions subscription (Responsável: backend/oracle dev) — 1 dia
- Tarefas:
  - Criar subscription em https://functions.chain.link/
  - Financiar com LINK testnet (~5 LINK recomendado)
  - Adicionar `ClimateOracle` como consumer
  - Testar `functions/climate-data.js` no Playground e validar retorno
- Critério de aceitação:
  - `ClimateOracle.requestClimateData()` executa e grava resultado via `fulfillRequest` no contrato de teste

3) Registrar Chainlink Automation upkeep (Responsável: devops) — 0.5–1 dia
- Tarefas:
  - Registrar `SettlementEngine` como upkeep
  - Configurar cron (ex.: 1h) ou check logic
  - Financiar upkeep com LINK testnet
- Critério de aceitação:
  - `performUpkeep` é chamado automaticamente e dispara `_requestSettlement` quando eventos expiram

4) Finalizar e robustecer contratos (Responsável: solidity dev) — 2–3 dias
- Tarefas:
  - Corrigir `availableLiquidity()` para somar lockedCollateral
  - Implementar conversão de timestamps para `YYYY-MM-DD` corretamente
  - Tratar edge-cases (partial payouts, cancellations, refunds)
  - Auditar uso de `transfer` vs `call` para transferências de ETH
- Critério de aceitação:
  - Todos os testes unitários e de integração passam; código revisado por 1 outro dev

5) Testes E2E em Sepolia (Responsável: QA/dev) — 1–2 dias
- Tarefas:
  - Deploy em Sepolia via `Deploy.s.sol`
  - Configurar subscription e upkeep nas dashboards Chainlink
  - Executar fluxo completo: criar evento → comprar CET → aguardar settlement → verificar payout
- Critério de aceitação:
  - Fluxo E2E demonstrável em Sepolia com dados reais do Open‑Meteo

## Itens de Médio Prazo (pós-hackathon)

6) Pools dinâmicos e pricing on‑chain — 3–7 dias
- Implementar mecanismos avançados de pricing, oráculos de volatilidade e rebalancing de pools.

7) Suporte a múltiplas métricas e eventos compostos — 3–6 dias
- Adicionar temperatura, vento, índice de seca; permitir eventos compostos (e.g., precip < X && temp > Y)

8) Integração CCIP (cross-chain) — 1–2 semanas
- Habilitar compra/settlement cross-chain para ampliar acessibilidade

9) Segurança e auditoria
- Planejar auditoria formal para a versão 1.0 (contratos principais, oracle logic, gerenciamento de colateral)

## Padrões de Contribuição
- Branching: `main` protegido; todas features via `feature/<nome>` + PR
- Commit messages: `type(scope): short description` (ex.: `feat(factory): add premium calc`)
- PR checklist básico:
  - Código compilado e testes unitários passam
  - Documentação atualizada (README / ARCHITECTURE / CHANGELOG)
  - Alterações de segurança revisadas
  - Gas impact analisado para funções públicas

## Estrutura de Issues sugerida
- `enhancement/frontend` — melhorias de UI/UX
- `bug/solidity` — bugs em contratos
- `infra/chainlink` — configuração de subscription e upkeeps
- `feature/oracle` — melhorias no pipeline de dados

## Estimativas de custo (testnet) — lembra de ajustar para mainnet
- Functions requests: ~0.25 LINK/request
- Automation upkeep: variável; provisionar 1–5 LINK para testes
- Gas: Sepolia varia; provisionar ETH teste via faucet

## How to pick tasks (para novos contribuidores)
1. Verifique `PHASE1_IMPLEMENTATION.md` para entender o estado atual.
2. Rode `forge test` localmente para garantir ambiente saudável.
3. Escolha uma issue do backlog sob sua área (frontend / solidity / infra).
4. Abra um PR com descrição clara e link para issue.

---

Arquivo criado por: equipe Clim Protocol
Data: 14/02/2026
