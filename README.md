# Clim Protocol

**Parametric Drought Protection for Small Farmers** — Climate Risk Tokenization using Decentralized Oracles (MVP for Chainlink Convergence 2026 Hackathon).

---

## 📚 Complete Documentation

**✨ NEW ORGANIZED STRUCTURE:** All documentation has been moved to the [`docs/`](./docs/) folder

👉 **[ACCESS COMPLETE DOCUMENTATION HERE](./docs/README.md)**

**Highlights:**
- 🎤 **[PROJECT_PRESENTATION.md](./docs/PROJECT_PRESENTATION.md)** - **Hackathon presentation** 🏆
- 📊 **[STATUS.md](./docs/STATUS.md)** - **Executive project overview**
- ⭐ **[TEST_REPORT.md](./docs/phase3-testes-validacao/TEST_REPORT.md)** - **66/66 tests passing (100%)**
- 📋 **[Phase 1: Planning](./docs/phase1-planejamento/)** - Architecture and design
- 🔨 **[Phase 2: Implementation](./docs/phase2-implementacao/)** - Contract development
- ✅ **[Phase 3: Testing](./docs/phase3-testes-validacao/)** - Reports and coverage

---

## 🎬 CLI Demonstration (Hackathon)

**Requirement:** 3-5 minute video demonstrating the workflow via CLI

📡 **[CLI_DEMO_GUIDE.md](./CLI_DEMO_GUIDE.md)** - Complete guide for CLI demonstration

### Ready-to-Use Scripts

```powershell
# Complete demo (build + tests + workflow)
.\demo-video.ps1

# CRE Workflow focused demo
.\demo-cre-workflow.ps1

# Validate submission
.\validate-submission.ps1
```

### What will be demonstrated:
- ✅ Compilation and tests (66/66 passing)
- ✅ Complete settlement workflow
- ✅ Chainlink Functions + Automation integration
- ✅ CRE workflow (DON consensus, HTTP fetch, EVM read/write)
- ✅ Automatic payout to farmers

---

## Summary

Clim Protocol offers **parametric drought protection** for small farmers in the **Semi-arid region of Pernambuco**. We tokenize drought events as on-chain instruments (Climate Event Tokens — CET) that automatically pay when accumulated precipitation falls below 150mm in 90 days. The MVP uses **Chainlink Functions** to query real climate data (Open-Meteo) and **Chainlink Automation** to execute automatic settlements.

## 🎯 MVP Focus
- **Phenomenon**: Drought
- **Region**: Semi-arid Pernambuco (Northeast Brazil)
- **Metric**: Accumulated precipitation (mm)
- **Period**: 90 days
- **Trigger**: Precipitation < 150mm
- **Token**: ERC-1155 (Climate Event Tokens)
- **Settlement**: Automatic via Chainlink Functions + Automation

## Architecture

- `Climate Event Factory` — creates event definitions (lat, lon, period, threshold)
- `Climate Event Token (ERC-1155)` — represents the protection
- `Liquidity Pool` — capital to fund payouts
- `Settlement Engine` — coordinates verification and payments
- `Oracle Layer (Chainlink Functions)` — queries Open-Meteo and returns on-chain metrics
- `Automation (Chainlink)` — triggers verifications/settlement on schedule

Diagram (summary):

```
Frontend → ClimProtocol (Facade) → Factory / Pool / Settlement
                                  ↑
                    Chainlink Functions + Automation
```

## Technologies

- Solidity (Foundry)
- ERC-1155 (OpenZeppelin)
- Chainlink Functions (Sepolia)
- Chainlink Automation (Sepolia)
- Chainlink CRE (Composable workflow)
- Next.js + wagmi + viem (frontend)
- Open-Meteo (Climate API)

---

## 🔗 Integração Chainlink - Arquivos

**Este projeto usa Chainlink Functions, Automation e CRE (Chainlink Runtime Environment)**

### Smart Contracts using Chainlink

| File | Description | Chainlink Service |
|------|-------------|-------------------|
| [contracts/src/oracle/ClimateOracle.sol](./contracts/src/oracle/ClimateOracle.sol) | Chainlink Functions client | **Functions** |
| [contracts/src/core/SettlementEngine.sol](./contracts/src/core/SettlementEngine.sol) | AutomationCompatible interface | **Automation** |

**Main features:**
- `ClimateOracle.sol`: Sends requests to Chainlink Functions, processes responses
- `SettlementEngine.sol`: Implements `checkUpkeep()` and `performUpkeep()` for Automation

### Chainlink Functions Source Code

| File | Description |
|------|-------------|
| [functions/climate-data.js](./functions/climate-data.js) | JavaScript executed by DON - queries Open-Meteo API |

**Flow:**
1. `ClimateOracle.sendRequest()` → sends source code to DON
2. DON executes `climate-data.js` → queries Open-Meteo API
3. DON returns accumulated precipitation → `fulfillRequest()` callback
4. Data saved on-chain → used in settlement

| File | Description |
|------|-------------|
| [cre-workflow/my-workflow/main.ts](./cre-workflow/my-workflow/main.ts) | **TypeScript Workflow** - orchestrates the entire process |
| [cre-workflow/my-workflow/config.json](./cre-workflow/my-workflow/config.json) | Configuration (RPC, contracts, API) |
| [cre-workflow/my-workflow/workflow.yaml](./cre-workflow/my-workflow/workflow.yaml) | Deployment settings |
| [cre-workflow/project.yaml](./cre-workflow/project.yaml) | CRE project configuration |
| [cre-workflow/README.md](./cre-workflow/README.md) | Complete workflow documentation |

**CRE Capabilities used:**
- ⏰ **Cron Trigger** - Runs every 5 minutes
- 📖 **EVM Read** - Reads active events from contracts
- 🌐 **HTTP Fetch** - Queries Open-Meteo API with DON consensus
- 🧮 **Compute** - Calculates if drought occurred (precipitation < threshold)
- ✍️ **EVM Write** - Triggers on-chain settlement
- 📡 **Event Trigger** - Reacts to `SettlementCompleted` events

**Simulation/Deploy:**
```bash
cd cre-workflow/my-workflow
bun install
bun run main.ts  # Local simulation
```

**Complete guide:** [CRE_WORKFLOW_SETUP.md](./CRE_WORKFLOW_SETUP.md)

| Arquivo | Descrição |
|---------|-----------|
| [contracts/script/Deploy.s.sol](./contracts/script/Deploy.s.sol) | Deploy completo + setup Chainlink subscription |

### Configuration Files

| Arquivo | Descrição |
|---------|-----------|
| [.env.example](./.env.example) | Template com variáveis Chainlink (subscription ID, etc) |
| [contracts/foundry.toml](./contracts/foundry.toml) | Configuração Foundry (inclui Chainlink remappings) |

---

## 🌾 Usage Example (Semi-arid Pernambuco)

1. **LP provides liquidity**: Investor deposits 50 ETH in pool
2. **Admin creates event**: "Drought in Sertão PE, Jan-Mar/2026 (90 days), precipitation < 150mm, payout 0.05 ETH/token"
3. **Farmer buys tokens**: Pays premium of ~0.0275 ETH per token (drought protection)
4. **90 day period ends**: Chainlink Functions fetches data from Open-Meteo API
5. **Automatic settlement**: If accumulated precipitation < 150mm → payout triggered
6. **Farmer redeems**: Receives 0.05 ETH per token directly in wallet

## Proposed Repository Structure

- [contracts/](contracts/) — Solidity contracts (core, oracle, settlement)
- [frontend/](frontend/) — Next.js app
- [functions/](functions/) — JavaScript code for Chainlink Functions
- `foundry.toml`, deploy scripts, tests

## Quickstart (development)

Prerequisites:

- Node.js v18+
- Foundry (forge) installed
- Sepolia account with test ETH and LINK (https://faucets.chain.link/sepolia)
- Sepolia RPC (Alchemy / Infura) — configure `SEPOLIA_RPC`

### Installing Foundry on Windows

Option 1 - Via Rust (recommended):
```bash
# Install Rust first
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs/ | sh

# Install Foundry
cargo install --git https://github.com/foundry-rs/foundry foundry-cli anvil --bins --locked
```

Option 2 - Pre-compiled binaries:
- Download binaries at https://github.com/foundry-rs/foundry/releases
- Add to Windows PATH

Minimum steps:

1. Clone the repository

2. Install frontend dependencies:

```bash
cd frontend
npm install
```

3. Configure environment variables (`.env` example):

```
SEPOLIA_RPC=https://...
PRIVATE_KEY=0x...
NEXT_PUBLIC_RPC=https://...
```

4. Run Foundry tests (local):

```bash
forge test -vvv --fork-url $SEPOLIA_RPC
```

5. Local contract deploy (Foundry script):

```bash
forge script script/Deploy.s.sol:Deploy --rpc-url $SEPOLIA_RPC --private-key $PRIVATE_KEY --broadcast
```

6. Configure Chainlink Functions:

- Go to https://functions.chain.link/ and create subscription
- Add consumer (contract address of `ClimateOracle` after deploy)
- Fund subscription with testnet LINK (minimum ~2 LINK)
- Test the `source` in Functions Playground: https://functions.chain.link/playground

7. Register Automation upkeep (https://automation.chain.link/) pointing to the `SettlementEngine` contract and fund with testnet LINK.

## Chainlink Functions — Quick Notes

- Use Open-Meteo for historical precipitation queries (free, no API key)
- Execution limits: timeout ~10s, callback gas ≤ 300k
- Test the JS source in Playground before calling on-chain

Example flow:

1. `SettlementEngine.performUpkeep()` calls `_sendRequest()` from `ClimateOracle`.
2. Chainlink DON runs the JS (Functions) which queries Open-Meteo and returns accumulated precipitation.
3. `fulfillRequest()` records result and `SettlementEngine` processes payouts if threshold is met.

## Tests and Validation

- Write unit tests with Functions response mocks.
- Integration tests using Sepolia fork to simulate real responses.

## Post-hackathon Roadmap

- Support for multiple metrics (temperature, wind)
- Dynamic pools and on-chain pricing
- CCIP integration for cross-chain
- Governance DAO

## How to Contribute

1. Open an issue describing the feature/bug
2. Fork → branch with PR
3. Add tests for any logic changes

## 📚 Useful Links

### 🚀 To Get Started Quickly
- **[Complete Documentation](./docs/README.md)** - Central hub for all documentation
- **[How to Test](./docs/phase3-testes-validacao/HOW_TO_TEST.md)** - Practical testing guide
- **[Test Report](./docs/phase3-testes-validacao/TEST_REPORT.md)** - 66/66 tests ✅
- **[Applied Corrections](./docs/phase3-testes-validacao/CORRECTIONS_APPLIED.md)** - Latest updates

### 📋 Documentation by Phase
- **[Phase 1: Planning](./docs/phase1-planejamento/)** - System architecture and design
- **[Phase 2: Implementation](./docs/phase2-implementacao/)** - Contract development
- **[Phase 3: Testing](./docs/phase3-testes-validacao/)** - Complete protocol validation

### 🔗 External Resources
- **Chainlink Functions:** https://docs.chain.link/chainlink-functions/getting-started
- **Chainlink Automation:** https://docs.chain.link/chainlink-automation/overview/getting-started
- **Open-Meteo API:** https://open-meteo.com/
- **Foundry Book:** https://book.getfoundry.sh/
- **OpenZeppelin Docs:** https://docs.openzeppelin.com/

---

**License:** MIT  
**Hackathon:** Chainlink Convergence 2026  
**Status:** ✅ Complete MVP - Ready for Testnet
