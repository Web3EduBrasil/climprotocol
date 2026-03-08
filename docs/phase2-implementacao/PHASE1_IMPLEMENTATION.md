# Fase 1 — Implementação (Resumo)

Este documento descreve o que foi implementado na Fase 1 do Clim Protocol e como validar/rodar localmente.

## Objetivo da Fase 1
Implementar um MVP funcional que permita criar um evento climático (precipitação), emitir Climate Event Tokens (CET) como ERC-1155, prover uma pool de liquidez, solicitar dados climáticos via Chainlink Functions e executar liquidações automaticamente com Chainlink Automation (configuração e integração básica preparada).

## O que já foi implementado
- Scaffold Foundry completo e `foundry.toml` com remappings.
- Contratos Solidity principais (localização: `contracts/src/`):
  - `ClimProtocol.sol` — Facade principal.
  - `core/ClimateEventToken.sol` — ERC-1155 para CETs.
  - `core/ClimateEventFactory.sol` — Criação de eventos e venda de tokens.
  - `core/LiquidityPool.sol` — Gestão de liquidez e lock/release de collateral.
  - `core/SettlementEngine.sol` — Orquestração de settlement e integração com Automation.
  - `oracle/ClimateOracle.sol` — Cliente Chainlink Functions (pedido e callback).
- Código JavaScript para Chainlink Functions:
  - `functions/climate-data.js` — consulta Open‑Meteo (archive API) e retorna precipitação acumulada (mm escalado).
- Script de deploy Foundry:
  - `contracts/script/Deploy.s.sol` — deploy sequencial, grant de roles e gravação de endereços em `deployed-addresses.env`.
- Testes base usando Forge:
  - `contracts/test/ClimProtocol.t.sol` — cobre setup, provisão de liquidez, criação de evento, compra de tokens e chamadas principais.
- Arquivos utilitários e docs:
  - `README.md` atualizado com quickstart e instruções de Windows.
  - `ARCHITECTURE.md` com visão técnica e fluxo.
  - `.env.example` e scripts de instalação (install-foundry.ps1, install-bun.ps1).
  - `package.json` com scripts convenientes.
  - `functions/climate-data.js` para deploy no Functions playground.

## Como verificar localmente (passos principais)
1. Instalar dependências (Foundry + Node.js). Para Windows use o `install-foundry.ps1` ou siga instruções no `START_HERE.md`.

2. Compilar contratos (dentro de `contracts`):

```bash
# entrar na pasta contracts
cd contracts
forge install OpenZeppelin/openzeppelin-contracts --no-commit
forge install smartcontractkit/chainlink --no-commit
forge build
```

3. Executar testes:

```bash
cd contracts
forge test -vvv
```

4. Deploy para Sepolia (após configurar `.env`/variáveis):

```bash
# Exemplo
forge script script/Deploy.s.sol:Deploy --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --broadcast
```

5. Chainlink Functions (playground):
- Copie o conteúdo de `functions/climate-data.js` e teste no Functions Playground (https://functions.chain.link/playground) com parâmetros de exemplo.
- Crie uma subscription em https://functions.chain.link/ e adicione o contrato `ClimateOracle` (endereço obtido após deploy) como consumer.

6. Chainlink Automation:
- Registre `SettlementEngine` como upkeep em https://automation.chain.link/ e configure a chamada `checkUpkeep`/`performUpkeep` (time-based ou custom logic) conforme necessidade.

## Observações e limitações atuais
- O `ClimateOracle._timestampToDateString` usa uma implementação simplificada: na produção, converter timestamps para `YYYY-MM-DD` corretamente.
- A função `LiquidityPool.availableLiquidity()` atualmente não agrega todos os locked collateral em storage global (placeholder simples). Em produção, mantenha estrutura que some lockedCollateral mapping.
- Chainlink Functions subscription e Automation registro precisam ser feitos manualmente na dashboard Chainlink (não podem ser criados totalmente on‑chain pelo script).

## Testes manuais sugeridos
- Deploy local via Foundry e executar teste end‑to‑end: criar evento, comprar tokens, simular callback do oracle com valor <= ou > threshold, verificar que `redeemTokens` funciona e pagamentos são enviados.
- Testar `functions/climate-data.js` no Playground com datas e coordenadas do Recife.

---

Arquivo criado por: equipe Clim Protocol
Data: 14/02/2026
