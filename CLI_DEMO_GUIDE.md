# CLI Demonstration Guide - Clim Protocol

**Hackathon CLI demonstration for parametric drought insurance on Chainlink**

---

## 🎯 Overview

This guide demonstrates the complete Clim Protocol workflow via command line. The full demo takes **3-5 minutes** and proves all Chainlink integrations work.

### What This Demo Shows:
- ✅ Smart contract compilation & testing (66/66 tests passing)
- ✅ Complete workflow simulation (LP → Event → Purchase → Settlement)
- ✅ Chainlink Functions integration (climate data from Open-Meteo API)
- ✅ Chainlink Automation integration (automatic settlement trigger)
- ✅ CRE Workflow (DON consensus, HTTP fetch, EVM read/write)

**Target audience:** Hackathon judges, developers, investors

---

## ⚡ Quick Start (3 commands)

`powershell
# 1. Run complete demonstration
.\demo-video.ps1

# 2. Run CRE workflow demo
.\demo-cre-workflow.ps1

# 3. Validate project status
.\validate-submission.ps1
`

**Time:** 3-5 minutes total  
**Prerequisites:** Foundry, Bun runtime (see below)

---

## 📋 Prerequisites

### Required Tools

#### 1. Foundry (Solidity framework)
`powershell
# Check if installed
forge --version

# Install via Rust (if needed)
cargo install --git https://github.com/foundry-rs/foundry foundry-cli anvil --bins --locked
`

#### 2. Bun (JavaScript runtime for CRE workflow)
`powershell
# Install Bun
powershell -c "irm bun.sh/install.ps1|iex"

# Verify installation
bun --version
`

#### 3. Git (repository management)
Included with Windows/most systems.

### Optional (for testnet deployment)
- Sepolia RPC URL (Alchemy/Infura)  
- Testnet ETH & LINK (https://faucets.chain.link/sepolia)

---

## 🎬 Step-by-Step CLI Demonstration

### Step 1: Repository Setup (30 seconds)

`powershell
# Clone repository (if not already done)
git clone https://github.com/YOUR_USERNAME/climprotocol
cd climprotocol

# Install Solidity dependencies
cd contracts
forge install
cd ..
`

### Step 2: Build & Test Contracts (1 minute)

`powershell
cd contracts

# Compile all 6 Solidity contracts
forge build --sizes

# Run complete test suite
forge test --summary

# Optional: View gas usage
forge test --gas-report | Select-String -Pattern "│"
`

**Expected output:**
`
Compiling 6 files with Solc 0.8.20
✅ Compiler run successful

Test result: ok. 66 passed; 0 failed; 0 skipped
`

**Test breakdown:**
- ClimateEventFactory: 18 tests ✅
- ClimateEventToken: 19 tests ✅
- LiquidityPool: 22 tests ✅
- ClimProtocol: 7 tests ✅

### Step 3: Automated Workflow Demo (2 minutes)

`powershell
cd ..

# Run comprehensive demonstration
.\demo-video.ps1
`

**This automated script demonstrates:**

1. **Contract Compilation**
   - 6 Solidity contracts compiled
   - ClimProtocol, Factory, Pool, SettlementEngine, Oracle, Token

2. **Test Execution**
   - All 66 tests pass (100% success rate)
   - Validates core functionality

3. **Workflow Simulation**
   - **LP deposits:** Investor provides 50 ETH liquidity
   - **Event creation:** Admin creates drought event (Sertão de Pernambuco, Brazil)
     - Location: -8.05°, -38.95°
     - Period: 90 days
     - Threshold: 150mm precipitation
     - Payout: 0.05 ETH per token
   - **Token purchase:** Farmer buys 2 protection tokens (pays premium)
   - **Monitoring period:** 90-day simulation
   - **Data fetch:** Chainlink Functions queries Open-Meteo API
     - Actual precipitation: 87mm
   - **Drought detection:** 87mm < 150mm → DROUGHT CONFIRMED
   - **Settlement:** Chainlink Automation triggers payout
   - **Payout:** Farmer receives 0.1 ETH (2 × 0.05)

4. **Metrics Display**
   - Gas usage statistics
   - Execution times
   - Success confirmations

### Step 4: CRE Workflow Demonstration (1-2 minutes)

`powershell
# Demonstrate Chainlink Runtime Environment
.\demo-cre-workflow.ps1
`

**This shows the CRE workflow architecture:**

`
┌──────────────────────────────────────────────┐
│      Chainlink CRE Settlement Workflow       │
├──────────────────────────────────────────────┤
│  ⏰ Cron Trigger (*/5 min)                   │
│  📖 EVM Read (getActiveEvents)               │
│  🌐 HTTP Fetch (Open-Meteo API)              │
│  🧮 DON Consensus (median aggregation)       │
│  🧠 Compute (compare threshold)              │
│  ✍️  EVM Write (performUpkeep)                │
│  📡 Event Trigger (SettlementCompleted)      │
└──────────────────────────────────────────────┘
`

**Execution flow:**
`
[00:00] ⏰ Cron trigger activated
[00:01] 📖 Reading active events from chain...
        ✅ Found: Event #1 (Pernambuco, 90 days)
[00:02] 📖 Reading event details...
        • Lat/Lon: -8.05, -38.95
        • Threshold: 150mm
[00:03] 🌐 Querying Open-Meteo API...
        ✅ DON Consensus: 5/7 nodes, median: 87.3mm
[00:04] 🧮 Computing result...
        87.3 < 150 → DROUGHT DETECTED 🚨
[00:05] ✍️  Writing settlement on-chain...
        ✅ performUpkeep() executed
        ✅ Gas: ~256k
[00:06] 📡 SettlementCompleted event emitted
        Payout: 0.1 ETH to farmer
`

### Step 5: Project Validation (30 seconds)

`powershell
# Verify project completeness for hackathon
.\validate-submission.ps1
`

**Expected result:**
`
================================
 VALIDATION RESULTS
================================
OK:   22 checks passed ✅
FAIL: 0 errors
WARN: 0 warnings

✅ PROJECT READY FOR SUBMISSION!
`

**Checks validated:**
- Documentation completeness
- Code quality (all tests passing)
- Chainlink integration (3 services)
- CRE workflow functionality
- Configuration files
- Repository structure

---

## 🔄 CRE Workflow Simulation (Detailed)

### Local Simulation (No RPC required)

`powershell
cd cre-workflow/my-workflow

# Install dependencies
bun install

# Run workflow simulation
bun run main.ts
`

**Output:**
`
🔄 Clim Protocol CRE Workflow - Starting...

[Cron] Trigger activated (*/5 min schedule)
[EVM Read] Fetching active events...
  ✅ Event #1: Drought monitoring active
[EVM Read] Event details:
  • Location: Sertão de Pernambuco (-8.05, -38.95)
  • Period: 90 days (2026-01-01 to 2026-03-31)
  • Threshold: 150mm
[HTTP Fetch] Open-Meteo API request...
  → DON processing (5 nodes)
  → Consensus: median
  ✅ Result: 87.3mm total precipitation
[Compute] Threshold comparison:
  87.3mm < 150mm → DROUGHT = TRUE
[EVM Write] Triggering settlement...
  ✅ Transaction: performUpkeep(eventId=1, actual=87.3mm)
[Event] SettlementCompleted detected
  • Payout amount: 0.1 ETH
  • Beneficiaries: 1 farmer

✅ Workflow execution complete!
`

### Testnet Simulation (With Sepolia RPC)

`powershell
# Configure environment variables
cp .env.example .env
# Edit .env: Add SEPOLIA_RPC_URL and PRIVATE_KEY

# Run against real testnet
cd cre-workflow/my-workflow
bun run main.ts
`

This performs actual blockchain reads/writes on Sepolia.

---

## 📊 What Hackathon Judges Will See

### 1. Technical Excellence
- ✅ **66/66 tests passing** (100% success rate)
- ✅ Clean, professional codebase
- ✅ Comprehensive test coverage
- ✅ Gas-optimized contracts

### 2. Chainlink Integration (3 Services)

| Service | Implementation | Purpose |
|---------|----------------|---------|
| **Functions** | ClimateOracle.sol<br/>climate-data.js | Fetch climate data from Open-Meteo API |
| **Automation** | SettlementEngine.sol | Trigger settlements automatically |
| **CRE** | main.ts workflow | Composable DON workflow |

### 3. Real-World Impact
- **Problem:** 28 million people in Brazilian semi-arid lack drought insurance
- **Solution:** Parametric insurance with automatic payouts
- **Innovation:** 2-hour settlement vs 3-12 months traditional
- **Cost:** ~5% premium vs 15-20% traditional insurance

### 4. Production-Ready Features
- ERC-1155 token standard
- Overcollateralization (150%)
- Role-based access control
- Reentrancy protection
- Event emissions for transparency

---

## 🎥 Demo Script for Video Recording

### Script Timeline (4:30 total)

#### 0:00-0:30 | Introduction
> "I'm demonstrating Clim Protocol - parametric drought insurance using Chainlink. 
> This provides automatic protection for 28 million farmers in Brazil's semi-arid region. 
> When rainfall drops below 150mm in 90 days, farmers receive automatic payouts. 
> No bureaucracy, no manual claims. Let's see it working..."

#### 0:30-1:00 | Build & Compilation
`powershell
cd contracts
forge build --sizes
`
> "Compiling 6 Solidity contracts: the main protocol facade, event factory, 
> ERC-1155 token, liquidity pool, settlement engine, and Chainlink oracle. 
> Compilation successful."

#### 1:00-1:30 | Test Execution
`powershell
forge test --summary
`
> "Running 66 tests covering all functionality:
> - 18 tests for event factory
> - 19 for ERC-1155 tokens
> - 22 for liquidity pool
> - 7 integration tests
> All passing - 100% success rate."

#### 1:30-3:00 | Workflow Demonstration
`powershell
cd ..
.\demo-video.ps1
`
> "Now the complete workflow:
> 
> Step 1: Liquidity provider deposits 50 ETH into the pool - this capitalizes future payouts.
> 
> Step 2: Admin creates a drought event for Pernambuco, Brazil. Coordinates -8.05, -38.95. 
> Monitoring period: 90 days. Trigger: precipitation below 150mm.
> 
> Step 3: A farmer purchases 2 protection tokens, paying a premium of 0.055 ETH.
> 
> Step 4: System monitors for 90 days. Chainlink Functions queries the Open-Meteo API - 
> an authoritative climate data source.
> 
> Step 5: Data returns: Only 87mm of rain fell. This is below the 150mm threshold.
> 
> Step 6: Chainlink Automation detects the drought condition and triggers settlement.
> 
> Step 7: Farmer automatically receives 0.1 ETH payout. From drought detection to payout: 
> approximately 2 hours. Traditional insurance would take 3-12 months."

#### 3:00-4:00 | CRE Workflow
`powershell
.\demo-cre-workflow.ps1
`
> "This is the Chainlink Runtime Environment workflow running on the decentralized oracle network.
> 
> It combines multiple capabilities in one composable workflow:
> - Cron trigger runs every 5 minutes
> - EVM read fetches active events from blockchain
> - HTTP fetch queries weather API with DON consensus
> - Compute logic determines if drought occurred
> - EVM write triggers settlement on-chain
> 
> This replaces separate Chainlink Functions and Automation subscriptions with 
> a single unified workflow. More efficient, more powerful."

#### 4:00-4:30 | Results & Conclusion
> "Results summary:
> - 66 out of 66 tests passing
> - Three Chainlink services fully integrated
> - Settlement time: 2 hours versus months
> - Cost: 5% premium versus 15-20% traditional
> - Impact: Protection for 28 million people
> 
> The project is production-ready with comprehensive documentation, 
> full test coverage, and real-world applicability.
> 
> Thank you!"

---

## 🔍 Pre-Demo Checklist

Before running the demo, verify:

`powershell
# 1. Foundry installed
forge --version
# Expected: forge 0.2.0 (or newer)

# 2. Bun installed
bun --version
# Expected: 1.x.x

# 3. Tests pass
cd contracts
forge test
# Expected: 66 passed

# 4. Demo scripts work
cd ..
.\demo-video.ps1
# Expected: Clean execution, no errors

# 5. Project validated
.\validate-submission.ps1
# Expected: 22/22 checks passing
`

All checks ✅? Ready to demo!

---

## 🐛 Troubleshooting Guide

### Issue: "forge: command not found"
**Solution:**
`powershell
# Install Foundry via Rust
cargo install --git https://github.com/foundry-rs/foundry foundry-cli anvil --bins --locked

# Or download pre-built binaries
# https://github.com/foundry-rs/foundry/releases
`

### Issue: "bun: command not found"
**Solution:**
`powershell
powershell -c "irm bun.sh/install.ps1|iex"
# Restart terminal after installation
`

### Issue: Tests failing
**Solution:**
`powershell
cd contracts

# Clean build
forge clean
forge build

# Update dependencies
forge update

# Run tests with verbose output
forge test -vvv
`

### Issue: demo-video.ps1 fails
**Solution:**
`powershell
# Enable script execution
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

# Run directly
powershell -File demo-video.ps1
`

### Issue: CRE workflow errors
**Solution:**
`powershell
cd cre-workflow/my-workflow

# Reinstall dependencies
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
bun install

# Verify config
cat config.json

# Run with verbose logging
bun run main.ts
`

### Issue: Out of memory
**Solution:**
`powershell
# Increase Node/Bun memory limit
="--max-old-space-size=4096"
bun run main.ts
`

---

## 📚 Additional Documentation

### Core Documentation
- **README.md** - Project overview & quick start
- **CRE_WORKFLOW_SETUP.md** - Detailed CRE workflow setup
- **docs/PROJECT_PRESENTATION.md** - Hackathon presentation
- **docs/SUBMISSION_CHECKLIST.md** - Final submission checklist

### Technical Documentation
- **Architecture:** [docs/phase1-planejamento/ARCHITECTURE.md](docs/phase1-planejamento/ARCHITECTURE.md)
- **Smart Contracts:** [docs/phase1-planejamento/SMART_CONTRACTS_EXPLAINED.md](docs/phase1-planejamento/SMART_CONTRACTS_EXPLAINED.md)
- **Test Report:** [docs/phase3-testes-validacao/TEST_REPORT.md](docs/phase3-testes-validacao/TEST_REPORT.md)
- **Test Coverage:** [docs/phase3-testes-validacao/TEST_COVERAGE.md](docs/phase3-testes-validacao/TEST_COVERAGE.md)

### How-To Guides
- **Testing:** [docs/phase3-testes-validacao/HOW_TO_TEST.md](docs/phase3-testes-validacao/HOW_TO_TEST.md)
- **CRE Simulation:** [CRE_WORKFLOW_SETUP.md](CRE_WORKFLOW_SETUP.md)

---

## 🎯 Key Points for Judges

### Problem Statement
**Target:** 28 million people in Brazilian semi-arid region  
**Challenge:** No access to drought insurance due to cost, bureaucracy, slow payouts  
**Impact:** Crop failures lead to poverty cycles and rural exodus

### Solution Innovation
1. **Parametric triggers:** No subjective claims, just verifiable data
2. **Automatic execution:** Smart contracts eliminate manual processes
3. **Fast settlement:** ~2 hours vs 3-12 months traditional
4. **Low cost:** ~5% premium vs 15-20% traditional
5. **Blockchain transparency:** All transactions auditable

### Chainlink Integration
1. **Functions:** Decentralized climate data from Open-Meteo
2. **Automation:** Time/conditional triggers for settlements
3. **CRE:** Composable workflow on DON (newest feature)

### Technical Excellence
- 66/66 tests passing (100%)
- Gas-optimized contracts
- Industry-standard security (OpenZeppelin, ReentrancyGuard)
- Professional documentation
- Production-ready code

### Scalability
- Can extend to other climate events (floods, frost, heatwaves)
- Can expand to other regions globally
- Modular architecture allows easy feature additions

---

## 🚀 Next Steps After Demo

### For Judges
1. Review test report: docs/phase3-testes-validacao/TEST_REPORT.md
2. Check architecture: docs/phase1-planejamento/ARCHITECTURE.md
3. Examine contracts: contracts/src/ directory
4. Test locally: Follow this guide

### For Deployment
1. Deploy contracts to Sepolia (see contracts/script/Deploy.s.sol)
2. Register CRE workflow: cre workflow register
3. Configure Chainlink subscriptions
4. Deploy frontend (see frontend/README.md)

### For Development
1. Read roadmap: docs/phase1-planejamento/TODO_ROADMAP.md
2. Review corrections: docs/phase3-testes-validacao/CORRECTIONS_APPLIED.md
3. Contribute: See GitHub issues

---

## 📞 Support & Resources

### Chainlink Resources
- **Documentation:** https://docs.chain.link/
- **CRE Docs:** https://docs.chain.link/cre
- **Discord:** https://discord.gg/chainlink
- **Faucets:** https://faucets.chain.link/sepolia

### Project Resources
- **GitHub:** [Repository URL]
- **Video Demo:** [YouTube Link]
- **Live Frontend:** [Vercel Deployment]
- **Sepolia Deployment:** [Etherscan Link]

---

## ✅ Final Checklist

Before submitting/presenting:

- [ ] All 66 tests passing
- [ ] demo-video.ps1 executes cleanly
- [ ] demo-cre-workflow.ps1 runs successfully
- [ ] alidate-submission.ps1 shows 22/22 OK
- [ ] Video recorded (3-5 minutes)
- [ ] README updated with video link
- [ ] Repository is public
- [ ] No .env or secrets committed
- [ ] All documentation in English
- [ ] Chainlink integration clearly documented

---

**Ready to demonstrate! Run .\demo-video.ps1 to begin.** 🚀

*Clim Protocol - Parametric Climate Insurance on Chainlink*  
*Hackathon Submission 2026*
