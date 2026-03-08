# Understanding CRE Workflows - Architecture & Deployment

## What is a CRE Workflow?

**Chainlink Runtime Environment (CRE)** is a WebAssembly (WASM) runtime that executes workflows on Chainlink's Decentralized Oracle Network (DON). This is fundamentally different from traditional smart contract automation.

### Traditional Approach vs CRE

#### Traditional (Chainlink Automation + Functions):
```
Smart Contract         Chainlink              Chainlink
    (On-Chain)      →  Automation    →       Functions
                       (Trigger)             (Execute)
                           ↓                      ↓
                     Check upkeep         Fetch external data
                                                  ↓
                                          Callback to contract
```
**Issues:**
- Multiple contracts required
- Higher gas costs (multiple transactions)
- Complex orchestration
- Limited composability

#### CRE Approach:
```
                Chainlink Runtime Environment
                        (Off-Chain DON)
    ┌──────────────────────────────────────────────┐
    │  Cron → Read → HTTP → Compute → Write        │
    │  (Single composable workflow)                │
    └──────────────────────────────────────────────┘
                           ↓
                    Single transaction
                    to smart contract
```
**Benefits:**
- ✅ Single workflow definition
- ✅ Lower gas costs
- ✅ Composable capabilities
- ✅ DON consensus built-in
- ✅ Easier to maintain

---

## Why Our Workflow Needs the CRE Runtime

### The WASM Environment

CRE workflows are compiled to WebAssembly and run in a sandboxed environment. The CRE SDK (`@chainlink/cre-sdk`) expects specific global functions to be provided by the host runtime:

```typescript
// These functions are provided by CRE WASM runtime:
globalThis.switchModes      // Switch between trigger/action modes
globalThis.log              // Logging capability
globalThis.sendResponse     // Send responses
globalThis.versionV2        // Runtime version
globalThis.callCapability   // Call DON capabilities
globalThis.awaitCapabilities// Await capability results
globalThis.getSecrets       // Access workflow secrets
globalThis.awaitSecrets     // Await secret resolution
globalThis.getWasiArgs      // Get WASI arguments
globalThis.now              // Current timestamp
```

### Why Direct Execution Fails

When you run `bun run main.ts` directly:

1. ❌ Bun/Node.js doesn't provide these global functions
2. ❌ The CRE SDK throws: "Missing required global host functions"
3. ❌ No DON consensus mechanism
4. ❌ No capability orchestration

This is **by design** - CRE workflows must run on the DON to ensure:
- Decentralization (multiple nodes execute)
- Consensus (median aggregation for HTTP calls)
- Security (sandboxed execution)
- Reliability (fault tolerance)

---

## Our Solution: Simulation Mode

For hackathon demo and development purposes, we created `simulate.ts`:

### What It Does

```typescript
// simulate.ts - Demo wrapper
// ✅ Validates workflow code structure
// ✅ Validates configuration (contracts, RPC)
// ✅ Shows what the workflow would do
// ✅ Lists all integrated capabilities
// ❌ Does NOT execute actual CRE logic
// ❌ Does NOT make real API calls
// ❌ Does NOT trigger on-chain transactions
```

### Why This Approach?

1. **Development:** Allows code validation without deploying
2. **Documentation:** Shows workflow capabilities clearly
3. **Demo:** Perfect for hackathon presentations
4. **Production:** Actual deployment to CRE remains straightforward

---

## Production Deployment Flow

### Step 1: Development (Local)

```bash
# Write workflow logic
# File: my-workflow/main.ts

import { cre, Runner } from "@chainlink/cre-sdk";

// Define handlers
const onCronTrigger = (runtime, payload) => {
  // Your settlement logic
};

// Initialize workflow
const initWorkflow = (config) => {
  return [
    cre.handler(cronTrigger.trigger({ schedule }), onCronTrigger)
  ];
};

// Export main
export async function main() {
  const runner = await Runner.newRunner({ configSchema });
  await runner.run(initWorkflow);
}
```

### Step 2: Validation (Simulate)

```bash
# Option A: Our demo script
bun run simulate.ts

# Option B: CRE CLI (if installed)
cre workflow simulate my-workflow
```

### Step 3: Compilation (WASM)

```bash
# Compile TypeScript → WASM
bunx cre-compile main.ts

# Output: main.wasm
```

This step:
- Transpiles TypeScript to JavaScript
- Bundles dependencies
- Compiles to WebAssembly
- Optimizes for CRE runtime

### Step 4: Deployment (DON)

```bash
# Deploy to Chainlink network
cre workflow deploy --network sepolia

# The DON will:
# 1. Register workflow with capability registry
# 2. Distribute to oracle nodes
# 3. Start executing based on triggers
```

Once deployed:
- **Cron trigger** fires every 5 minutes automatically
- **Log trigger** reacts to `SettlementCompleted` events
- **Multiple nodes** execute in parallel
- **Consensus** achieved via median aggregation
- **Single transaction** sent to contract when needed

---

## CRE Capabilities in Our Workflow

### 1. Cron Trigger
```typescript
const cronTrigger = new cre.capabilities.CronCapability();
cre.handler(
  cronTrigger.trigger({ schedule: "0 */5 * * * *" }),
  onCronTrigger
);
```
- Executes every 5 minutes
- No on-chain transaction needed
- Perfect for periodic settlement checks

### 2. EVM Read
```typescript
const evmClient = new cre.capabilities.EVMClient(chainSelector);
const result = evmClient.callContract(runtime, {
  call: encodeCallMsg({ to: contractAddress, data: callData }),
  blockNumber: LAST_FINALIZED_BLOCK_NUMBER
});
```
- Reads smart contract state
- No gas required
- Uses finalized blocks for safety

### 3. HTTP Fetch (with DON Consensus)
```typescript
const httpClient = new cre.capabilities.HTTPClient();
const result = httpClient.sendRequest(
  runtime,
  (sendReq, config) => fetchPrecipitation(...),
  ConsensusAggregationByFields({
    totalPrecipitationMm: median,  // Take median from all nodes
    days: median
  })
);
```
- Multiple nodes fetch independently
- Median aggregation prevents outliers
- Decentralized data source

### 4. Compute
```typescript
const willPayout = precipitationMm < thresholdMm;
runtime.log(`Payout: ${willPayout ? "YES" : "NO"}`);
```
- Business logic executed off-chain
- Same result across all nodes
- No gas costs for computation

### 5. EVM Write
```typescript
const report = runtime.report({
  encodedPayload: hexToBase64(callData),
  encoderName: "evm",
  signingAlgo: "ecdsa",
  hashingAlgo: "keccak256"
});

const resp = evmClient.writeReport(runtime, {
  receiver: contractAddress,
  report: report,
  gasConfig: { gasLimit }
});
```
- DON signs transaction collectively
- Submits single transaction
- Gas paid by workflow fund

### 6. Event Trigger
```typescript
cre.handler(
  evmClient.logTrigger({
    addresses: [contractAddress],
    topics: [eventSignature]
  }),
  onSettlementCompleted
);
```
- Reacts to blockchain events
- No polling required
- Immediate response

---

## Why This Matters for Clim Protocol

### Problem Solved

Traditional parametric insurance requires:
1. Manual oracle submission ❌
2. Multiple on-chain transactions ❌
3. Complex automation setup ❌
4. High gas costs ❌

### Our Solution

CRE workflow provides:
1. **Fully automated** settlement (cron trigger)
2. **Trustless** data fetching (DON consensus)
3. **Cost-efficient** execution (single transaction)
4. **Composable** logic (all capabilities in one workflow)

### Real-World Flow

```
Day 1: Farmer creates drought insurance event
       └─> On-chain: ClimateEventToken minted

Day 30: Event period ends
       └─> CRE cron trigger (every 5 min) detects expired event
       └─> Fetches precipitation from Open-Meteo
       └─> DON consensus validates data
       └─> Compares: 12mm actual < 20mm threshold
       └─> Triggers settlement automatically
       └─> Single transaction calls performUpkeep()
       └─> Oracle fetches data on-chain
       └─> Payout distributed to farmer

All automatic. No human intervention.
```

---

## Files in Our Implementation

```
cre-workflow/
├── my-workflow/
│   ├── main.ts              # 🔥 Core workflow logic (682 lines)
│   │                        #    - Cron handler (settlement orchestration)
│   │                        #    - Log handler (settlement logging)
│   │                        #    - 5 helper functions (EVM read, HTTP fetch)
│   │                        #    - Workflow initialization
│   │
│   ├── simulate.ts          # 🎯 Demo simulation wrapper
│   │                        #    - Validates config without CRE runtime
│   │                        #    - Shows capabilities integrated
│   │                        #    - Perfect for presentations
│   │
│   ├── config.json          # ⚙️ Configuration
│   │                        #    - Contract addresses
│   │                        #    - Cron schedule
│   │                        #    - RPC endpoints
│   │                        #    - Gas limits
│   │
│   ├── workflow.yaml        # 📋 CRE deployment config
│   │                        #    - Workflow metadata
│   │                        #    - Capability requirements
│   │
│   └── package.json         # 📦 Dependencies
│                            #    - @chainlink/cre-sdk ^1.0.9
│                            #    - viem 2.34.0
│                            #    - zod 3.25.76
│
├── project.yaml             # 🌐 Project settings
│                            #    - RPC URLs
│                            #    - Network config
│
└── contracts/abi/           # 📜 Smart contract ABIs
    └── index.ts             #    - SettlementEngine
                             #    - ClimProtocol
                             #    - ClimateEventToken
```

---

## Summary

### For Demos/Hackathons

✅ Use `simulate.ts` - validates workflow structure  
✅ Shows all capabilities integrated  
✅ No CRE CLI installation needed  
✅ Perfect for presentations  

### For Production

✅ Use `cre workflow deploy` - runs on actual DON  
✅ Full decentralization with consensus  
✅ Automatic execution 24/7  
✅ Production-grade reliability  

### The Value Proposition

**Traditional approach:** 3 contracts + 2 Chainlink services + manual coordination  
**CRE approach:** 1 workflow file with all logic composable  

This is the future of smart contract automation! 🚀
