# 🚀 START HERE - Complete Testing Guide

## Option A: Test Smart Contracts (Required)

### Step 1: Install Foundry

**Open PowerShell AS ADMINISTRATOR** (Right-click PowerShell → Run as Administrator)

```powershell
cd c:\Users\davio\projects\Hackaton\climprotocol
.\install-foundry.ps1
```

If that fails, download manually:
1. Go to: https://github.com/foundry-rs/foundry/releases
2. Download: `foundry_nightly_windows_amd64.zip`
3. Extract to: `C:\foundry\`
4. Add `C:\foundry\` to your Windows PATH

### Step 2: Close and Reopen PowerShell

**IMPORTANT:** Close PowerShell completely and open a new window so the PATH updates.

### Step 3: Run Tests

```powershell
cd c:\Users\davio\projects\Hackaton\climprotocol
.\run-all-tests.ps1
```

**That's it!** You should see:
```
[SUCCESS] 66/66 tests passing
```

---

## Option B: Test CRE Workflow (Advanced Chainlink Feature)

### Step 1: Install Bun Runtime

```powershell
cd c:\Users\davio\projects\Hackaton\climprotocol
.\install-bun.ps1
```

### Step 2: Close and Reopen PowerShell

### Step 3: Run CRE Workflow Simulation

**For hackathon demonstration** (reads real blockchain data):
```powershell
cd c:\Users\davio\projects\Hackaton\climprotocol
.\run-cre-workflow.ps1 -Execute
```

**Quick overview** (validates configuration):
```powershell
.\run-cre-workflow.ps1
```

The execution simulation demonstrates:
- ✅ **Real data** from deployed contracts on Sepolia
- ✅ **Actual workflow logic** execution
- ✅ **All 7 CRE capabilities** in action
- ✅ **Settlement decisions** based on real precipitation data

**Note:** This simulates what the workflow does. For actual execution, deploy to Chainlink's DON.

See [HACKATHON_CRE_DEMO.md](docs/HACKATHON_CRE_DEMO.md) for full details.

---

## Alternative: Manual Commands

If the scripts don't work, run manually:

```powershell
# Navigate to contracts
cd c:\Users\davio\projects\Hackaton\climprotocol\contracts

# Install dependencies
forge install

# Build
forge build

# Run tests
forge test -vv
```

---

## Troubleshooting

**Error: "forge not found"**
- Make sure you ran install-foundry.ps1 as Administrator
- Close and reopen PowerShell
- Verify: `forge --version`

**Error: "failed to resolve imports"**
- Run: `forge install --force`
- Run: `forge clean && forge build`

**Want more details?**
- Run with verbose: `.\run-all-tests.ps1 -Verbose`
- Run with gas report: `.\run-all-tests.ps1 -GasReport`

---

## What Gets Tested?

✅ **66 tests** covering:
- Event creation and management
- Token minting and transfers (ERC-1155)
- Liquidity pool operations
- Settlement logic
- Access control and security
- Integration flows

All tests use **local mocks** for Chainlink (no testnet needed).

---

## After Tests Pass

Once you see all 66 tests passing:

1. ✅ Your contracts are working
2. ✅ Ready for demo video
3. ✅ Ready for hackathon submission

Check [CLI_DEMO_GUIDE.md](CLI_DEMO_GUIDE.md) for next steps.

---

**Having issues?** See troubleshooting section below for common solutions.
