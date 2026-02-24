// ==========================================================================
// Clim Protocol — CRE Settlement Workflow
// ==========================================================================
// This Chainlink Runtime Environment (CRE) workflow automates the full
// settlement lifecycle for parametric climate insurance events:
//
//   1. Cron trigger fires every 5 minutes
//   2. Reads active events from SettlementEngine on Sepolia
//   3. For each expired event, reads its ClimateEventData (lat/lon/dates)
//   4. Fetches actual precipitation from Open-Meteo Archive API
//   5. Compares precipitation vs payout threshold
//   6. Triggers on-chain settlement via SettlementEngine.performUpkeep()
//
// Additionally, an EVM Log Trigger reacts to SettlementCompleted events
// to log settlement outcomes for off-chain monitoring.
// ==========================================================================

import {
  bytesToHex,
  ConsensusAggregationByFields,
  type CronPayload,
  cre,
  type EVMLog,
  encodeCallMsg,
  getNetwork,
  type HTTPSendRequester,
  hexToBase64,
  LAST_FINALIZED_BLOCK_NUMBER,
  median,
  Runner,
  type Runtime,
  TxStatus,
} from "@chainlink/cre-sdk";
import {
  type Address,
  decodeFunctionResult,
  encodeFunctionData,
  zeroAddress,
} from "viem";
import { z } from "zod";
import { SettlementEngine, ClimProtocol } from "../contracts/abi";

// ==========================================================================
// Config Schema — validated with Zod
// ==========================================================================

const configSchema = z.object({
  schedule: z.string(),
  openMeteoBaseUrl: z.string(),
  evms: z.array(
    z.object({
      protocolAddress: z.string(),
      settlementAddress: z.string(),
      oracleAddress: z.string(),
      factoryAddress: z.string(),
      chainSelectorName: z.string(),
      gasLimit: z.string(),
    })
  ),
});

type Config = z.infer<typeof configSchema>;

// ==========================================================================
// Types
// ==========================================================================

// Matches IClimProtocol.EventStatus enum
const EventStatus = {
  ACTIVE: 0,
  SETTLED: 1,
  EXPIRED: 2,
} as const;

interface ClimateEventData {
  latitude: bigint;
  longitude: bigint;
  startTime: bigint;
  endTime: bigint;
  thresholdMm: bigint;
  payoutPerToken: bigint;
  totalSupply: bigint;
  actualMm: bigint;
  status: number;
}

interface OpenMeteoResponse {
  daily: {
    time: string[];
    precipitation_sum: number[];
  };
}

interface PrecipitationResult {
  totalPrecipitationMm: number;
  days: number;
}

// Utility function for safe BigInt serialization
const safeJsonStringify = (obj: unknown): string =>
  JSON.stringify(
    obj,
    (_, value) => (typeof value === "bigint" ? value.toString() : value),
    2
  );

// ==========================================================================
// Step 1: Read active events from SettlementEngine
// ==========================================================================

const getActiveEvents = (
  runtime: Runtime<Config>,
  evmConfig: Config["evms"][0]
): bigint[] => {
  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: evmConfig.chainSelectorName,
    isTestnet: true,
  });

  if (!network) {
    throw new Error(
      `Network not found for chain: ${evmConfig.chainSelectorName}`
    );
  }

  const evmClient = new cre.capabilities.EVMClient(
    network.chainSelector.selector
  );

  const callData = encodeFunctionData({
    abi: SettlementEngine,
    functionName: "getActiveEvents",
  });

  const contractCall = evmClient
    .callContract(runtime, {
      call: encodeCallMsg({
        from: zeroAddress,
        to: evmConfig.settlementAddress as Address,
        data: callData,
      }),
      blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
    })
    .result();

  const eventIds = decodeFunctionResult({
    abi: SettlementEngine,
    functionName: "getActiveEvents",
    data: bytesToHex(contractCall.data),
  });

  return eventIds as bigint[];
};

// ==========================================================================
// Step 2: Get event details from ClimProtocol facade
// ==========================================================================

const getEventDetails = (
  runtime: Runtime<Config>,
  evmConfig: Config["evms"][0],
  eventId: bigint
): { eventData: ClimateEventData; isSettled: boolean } => {
  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: evmConfig.chainSelectorName,
    isTestnet: true,
  });

  if (!network) {
    throw new Error(
      `Network not found for chain: ${evmConfig.chainSelectorName}`
    );
  }

  const evmClient = new cre.capabilities.EVMClient(
    network.chainSelector.selector
  );

  const callData = encodeFunctionData({
    abi: ClimProtocol,
    functionName: "getEventDetails",
    args: [eventId],
  });

  const contractCall = evmClient
    .callContract(runtime, {
      call: encodeCallMsg({
        from: zeroAddress,
        to: evmConfig.protocolAddress as Address,
        data: callData,
      }),
      blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
    })
    .result();

  const [eventData, , , isSettled] = decodeFunctionResult({
    abi: ClimProtocol,
    functionName: "getEventDetails",
    data: bytesToHex(contractCall.data),
  }) as [ClimateEventData, bigint, bigint, boolean];

  return { eventData, isSettled };
};

// ==========================================================================
// Step 3: Check if upkeep is needed (settlement ready)
// ==========================================================================

const checkUpkeep = (
  runtime: Runtime<Config>,
  evmConfig: Config["evms"][0]
): { upkeepNeeded: boolean; performData: `0x${string}` } => {
  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: evmConfig.chainSelectorName,
    isTestnet: true,
  });

  if (!network) {
    throw new Error(
      `Network not found for chain: ${evmConfig.chainSelectorName}`
    );
  }

  const evmClient = new cre.capabilities.EVMClient(
    network.chainSelector.selector
  );

  const callData = encodeFunctionData({
    abi: SettlementEngine,
    functionName: "checkUpkeep",
    args: ["0x"],
  });

  const contractCall = evmClient
    .callContract(runtime, {
      call: encodeCallMsg({
        from: zeroAddress,
        to: evmConfig.settlementAddress as Address,
        data: callData,
      }),
      blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
    })
    .result();

  const [upkeepNeeded, performData] = decodeFunctionResult({
    abi: SettlementEngine,
    functionName: "checkUpkeep",
    data: bytesToHex(contractCall.data),
  }) as [boolean, `0x${string}`];

  return { upkeepNeeded, performData };
};

// ==========================================================================
// Step 4: Fetch precipitation data from Open-Meteo Archive API
// ==========================================================================

const fetchPrecipitation = (
  sendRequester: HTTPSendRequester,
  config: Config,
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string
): PrecipitationResult => {
  const url =
    `${config.openMeteoBaseUrl}?latitude=${latitude}&longitude=${longitude}` +
    `&start_date=${startDate}&end_date=${endDate}` +
    `&daily=precipitation_sum&timezone=UTC`;

  const response = sendRequester.sendRequest({ method: "GET", url }).result();

  if (response.statusCode !== 200) {
    throw new Error(`Open-Meteo API request failed: HTTP ${response.statusCode}`);
  }

  const responseText = Buffer.from(response.body).toString("utf-8");
  const meteoData: OpenMeteoResponse = JSON.parse(responseText);

  if (
    !meteoData.daily ||
    !meteoData.daily.precipitation_sum ||
    meteoData.daily.precipitation_sum.length === 0
  ) {
    throw new Error("Open-Meteo returned no precipitation data");
  }

  // Sum all daily precipitation values
  const totalPrecipitationMm = meteoData.daily.precipitation_sum.reduce(
    (sum, val) => sum + (val || 0),
    0
  );

  return {
    totalPrecipitationMm,
    days: meteoData.daily.precipitation_sum.length,
  };
};

// ==========================================================================
// Step 5: Trigger settlement via performUpkeep
// ==========================================================================

const triggerSettlement = (
  runtime: Runtime<Config>,
  evmConfig: Config["evms"][0],
  performData: `0x${string}`
): string => {
  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: evmConfig.chainSelectorName,
    isTestnet: true,
  });

  if (!network) {
    throw new Error(
      `Network not found for chain: ${evmConfig.chainSelectorName}`
    );
  }

  const evmClient = new cre.capabilities.EVMClient(
    network.chainSelector.selector
  );

  // Encode performUpkeep call with the data from checkUpkeep
  const callData = encodeFunctionData({
    abi: SettlementEngine,
    functionName: "performUpkeep",
    args: [performData],
  });

  // Generate signed report for chain write using DON consensus
  const reportResponse = runtime
    .report({
      encodedPayload: hexToBase64(callData),
      encoderName: "evm",
      signingAlgo: "ecdsa",
      hashingAlgo: "keccak256",
    })
    .result();

  const resp = evmClient
    .writeReport(runtime, {
      receiver: evmConfig.settlementAddress,
      report: reportResponse,
      gasConfig: {
        gasLimit: evmConfig.gasLimit,
      },
    })
    .result();

  if (resp.txStatus !== TxStatus.SUCCESS) {
    throw new Error(
      `Settlement tx failed: ${resp.errorMessage || resp.txStatus}`
    );
  }

  const txHash = resp.txHash || new Uint8Array(32);
  runtime.log(`Settlement tx succeeded: ${bytesToHex(txHash)}`);
  return bytesToHex(txHash);
};

// ==========================================================================
// Utility: Convert Unix timestamp to YYYY-MM-DD
// ==========================================================================

const timestampToDate = (timestamp: bigint): string => {
  // Manual UTC date conversion — Date API not available in CRE WASM runtime
  const totalSeconds = Number(timestamp);
  const totalDays = Math.floor(totalSeconds / 86400);

  // Days since Unix epoch (1970-01-01) to year/month/day
  let y = 1970;
  let remaining = totalDays;

  const isLeap = (yr: number) =>
    yr % 4 === 0 && (yr % 100 !== 0 || yr % 400 === 0);
  const daysInYear = (yr: number) => (isLeap(yr) ? 366 : 365);

  while (remaining >= daysInYear(y)) {
    remaining -= daysInYear(y);
    y++;
  }

  const monthDays = [
    31,
    isLeap(y) ? 29 : 28,
    31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
  ];
  let m = 0;
  while (remaining >= monthDays[m]) {
    remaining -= monthDays[m];
    m++;
  }

  const day = remaining + 1;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${y}-${pad(m + 1)}-${pad(day)}`;
};

// ==========================================================================
// Cron Trigger Handler — Main settlement orchestration
// ==========================================================================
//
// Runs every 5 minutes:
//   1. Reads all active events from SettlementEngine
//   2. For each event, reads on-chain details (lat, lon, dates, threshold)
//   3. Identifies events whose endTime has passed (expired)
//   4. Fetches actual precipitation from Open-Meteo for each expired event
//   5. Logs comparison: actual precipitation vs threshold
//   6. If checkUpkeep returns true, calls performUpkeep to trigger settlement
// ==========================================================================

const onCronTrigger = (
  runtime: Runtime<Config>,
  payload: CronPayload
): string => {
  runtime.log("=== Clim Protocol Settlement Workflow — Cron Tick ===");

  // scheduledExecutionTime may be undefined in local simulation
  const nowSec = payload.scheduledExecutionTime
    ? Number(payload.scheduledExecutionTime)
    : 0;

  runtime.log(`Execution time (unix): ${nowSec}`);

  const evmConfig = runtime.config.evms[0];

  // ── Step 1: Read active events from SettlementEngine ──────────────
  const activeEventIds = getActiveEvents(runtime, evmConfig);
  runtime.log(`Active events on-chain: ${activeEventIds.length}`);

  if (activeEventIds.length === 0) {
    runtime.log("No active events. Nothing to do.");
    return "no_active_events";
  }

  // ── Step 2: Analyze each event ────────────────────────────────────
  const currentTimestamp = BigInt(nowSec);
  const expiredEvents: Array<{
    eventId: bigint;
    eventData: ClimateEventData;
  }> = [];

  for (const eventId of activeEventIds) {
    try {
      const { eventData, isSettled } = getEventDetails(
        runtime,
        evmConfig,
        eventId
      );

      // Convert coordinates from 1e6 format
      const lat = Number(eventData.latitude) / 1e6;
      const lon = Number(eventData.longitude) / 1e6;
      const thresholdMm = Number(eventData.thresholdMm) / 1000; // stored as mm*1000

      runtime.log(
        `Event ${eventId}: lat=${lat}, lon=${lon}, ` +
        `end=${timestampToDate(eventData.endTime)}, ` +
        `threshold=${thresholdMm}mm, ` +
        `status=${eventData.status}, settled=${isSettled}`
      );

      // Check if event period has ended and it's still active
      if (
        eventData.status === EventStatus.ACTIVE &&
        !isSettled &&
        currentTimestamp > eventData.endTime
      ) {
        expiredEvents.push({ eventId, eventData });
      }
    } catch (error) {
      runtime.log(`Error reading event ${eventId}: ${String(error)}`);
    }
  }

  runtime.log(`Events ready for settlement: ${expiredEvents.length}`);

  if (expiredEvents.length === 0) {
    runtime.log("No expired events need settlement.");
    return "no_expired_events";
  }

  // ── Step 3: Fetch precipitation data for each expired event ───────
  const httpClient = new cre.capabilities.HTTPClient();

  for (const { eventId, eventData } of expiredEvents) {
    const lat = Number(eventData.latitude) / 1e6;
    const lon = Number(eventData.longitude) / 1e6;
    const startDate = timestampToDate(eventData.startTime);
    const endDate = timestampToDate(eventData.endTime);
    const thresholdMm = Number(eventData.thresholdMm) / 1000;

    try {
      // Fetch with DON consensus (median aggregation)
      const precipResult = httpClient
        .sendRequest(
          runtime,
          (sendReq: HTTPSendRequester, config: Config) =>
            fetchPrecipitation(sendReq, config, lat, lon, startDate, endDate),
          ConsensusAggregationByFields<PrecipitationResult>({
            totalPrecipitationMm: median,
            days: median,
          })
        )(runtime.config)
        .result();

      const willPayout = precipResult.totalPrecipitationMm < thresholdMm;

      runtime.log(
        `Event ${eventId} precipitation data:` +
        `\n  Period: ${startDate} → ${endDate} (${precipResult.days} days)` +
        `\n  Actual precipitation: ${precipResult.totalPrecipitationMm.toFixed(2)} mm` +
        `\n  Threshold: ${thresholdMm.toFixed(2)} mm` +
        `\n  Payout triggered: ${willPayout ? "YES — drought detected!" : "NO — sufficient rain"}`
      );
    } catch (error) {
      runtime.log(
        `Failed to fetch precipitation for event ${eventId}: ${String(error)}`
      );
    }
  }

  // ── Step 4: Check if on-chain upkeep is needed ────────────────────
  try {
    const { upkeepNeeded, performData } = checkUpkeep(runtime, evmConfig);

    if (upkeepNeeded) {
      runtime.log("checkUpkeep returned TRUE — triggering settlement...");
      const txHash = triggerSettlement(runtime, evmConfig, performData);
      runtime.log(`Settlement triggered successfully. TxHash: ${txHash}`);
      return `settlement_triggered:${txHash}`;
    } else {
      runtime.log(
        "checkUpkeep returned FALSE — settlement already in progress or oracle pending."
      );
    }
  } catch (error) {
    runtime.log(`Settlement trigger error: ${String(error)}`);
  }

  return `analyzed:${expiredEvents.length}_events`;
};

// ==========================================================================
// EVM Log Trigger Handler — React to SettlementCompleted events
// ==========================================================================
//
// Listens for SettlementCompleted(uint256 eventId, uint256 precipitationMm, bool payoutTriggered)
// to log settlement outcomes for off-chain observability.
// ==========================================================================

const onSettlementCompleted = (
  runtime: Runtime<Config>,
  payload: EVMLog
): string => {
  runtime.log("=== SettlementCompleted Event Detected ===");

  const topics = payload.topics;

  if (topics.length < 2) {
    runtime.log("Unexpected log format: not enough topics");
    throw new Error(`Expected at least 2 topics, got ${topics.length}`);
  }

  // topics[0] = event signature hash
  // topics[1] = indexed eventId (32 bytes, uint256)
  const eventIdHex = bytesToHex(topics[1]);
  const eventId = BigInt(eventIdHex);

  runtime.log(`Settlement completed for event ${eventId}`);

  // Read the event details to log the outcome
  const evmConfig = runtime.config.evms[0];
  try {
    const { eventData, isSettled } = getEventDetails(
      runtime,
      evmConfig,
      eventId
    );

    const actualMm = Number(eventData.actualMm) / 1000;
    const thresholdMm = Number(eventData.thresholdMm) / 1000;
    const lat = Number(eventData.latitude) / 1e6;
    const lon = Number(eventData.longitude) / 1e6;

    runtime.log(
      `Settlement outcome:` +
      `\n  Event ID: ${eventId}` +
      `\n  Location: (${lat}, ${lon})` +
      `\n  Actual precipitation: ${actualMm} mm` +
      `\n  Threshold: ${thresholdMm} mm` +
      `\n  Payout: ${actualMm < thresholdMm ? "TRIGGERED (drought)" : "NOT triggered"}` +
      `\n  Status: ${isSettled ? "SETTLED" : "PENDING"}`
    );
  } catch (error) {
    runtime.log(`Error reading event details: ${String(error)}`);
  }

  return `settlement_completed:${eventId}`;
};

// ==========================================================================
// Workflow Initialization — Register triggers and handlers
// ==========================================================================

const initWorkflow = (config: Config) => {
  // ── Cron Trigger: poll every 5 minutes ────────────────────────────
  const cronTrigger = new cre.capabilities.CronCapability();

  // ── EVM Log Trigger: react to SettlementCompleted events ──────────
  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: config.evms[0].chainSelectorName,
    isTestnet: true,
  });

  if (!network) {
    throw new Error(
      `Network not found for chain: ${config.evms[0].chainSelectorName}`
    );
  }

  const evmClient = new cre.capabilities.EVMClient(
    network.chainSelector.selector
  );

  return [
    // Handler 1: Cron-based settlement orchestration
    cre.handler(
      cronTrigger.trigger({
        schedule: config.schedule,
      }),
      onCronTrigger
    ),

    // Handler 2: React to SettlementCompleted on-chain events
    cre.handler(
      evmClient.logTrigger({
        addresses: [hexToBase64(config.evms[0].settlementAddress)],
      }),
      onSettlementCompleted
    ),
  ];
};

// ==========================================================================
// Entry point
// ==========================================================================

export async function main() {
  const runner = await Runner.newRunner<Config>({
    configSchema,
  });
  await runner.run(initWorkflow);
}

main();
