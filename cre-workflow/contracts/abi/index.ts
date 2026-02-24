// SettlementEngine ABI — Read active events, check upkeep, trigger settlement
export const SettlementEngine = [
  {
    type: "function",
    name: "getActiveEvents",
    inputs: [],
    outputs: [{ name: "", type: "uint256[]", internalType: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getActiveEventCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isEventSettled",
    inputs: [{ name: "eventId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "checkUpkeep",
    inputs: [{ name: "", type: "bytes", internalType: "bytes" }],
    outputs: [
      { name: "upkeepNeeded", type: "bool", internalType: "bool" },
      { name: "performData", type: "bytes", internalType: "bytes" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "performUpkeep",
    inputs: [{ name: "performData", type: "bytes", internalType: "bytes" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "processSettlement",
    inputs: [{ name: "eventId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "manualSettlement",
    inputs: [{ name: "eventId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "SettlementRequested",
    inputs: [
      { name: "eventId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "requestId", type: "bytes32", indexed: false, internalType: "bytes32" },
    ],
  },
  {
    type: "event",
    name: "SettlementCompleted",
    inputs: [
      { name: "eventId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "precipitationMm", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "payoutTriggered", type: "bool", indexed: false, internalType: "bool" },
    ],
  },
] as const;

// ClimProtocol (Facade) ABI — Get event details and protocol stats
export const ClimProtocol = [
  {
    type: "function",
    name: "getEventDetails",
    inputs: [{ name: "eventId", type: "uint256", internalType: "uint256" }],
    outputs: [
      {
        name: "eventData",
        type: "tuple",
        internalType: "struct IClimProtocol.ClimateEventData",
        components: [
          { name: "latitude", type: "int256", internalType: "int256" },
          { name: "longitude", type: "int256", internalType: "int256" },
          { name: "startTime", type: "uint256", internalType: "uint256" },
          { name: "endTime", type: "uint256", internalType: "uint256" },
          { name: "thresholdMm", type: "uint256", internalType: "uint256" },
          { name: "payoutPerToken", type: "uint256", internalType: "uint256" },
          { name: "totalSupply", type: "uint256", internalType: "uint256" },
          { name: "actualMm", type: "uint256", internalType: "uint256" },
          { name: "status", type: "uint8", internalType: "enum IClimProtocol.EventStatus" },
        ],
      },
      { name: "availableTokens", type: "uint256", internalType: "uint256" },
      { name: "currentPremium", type: "uint256", internalType: "uint256" },
      { name: "isSettled", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getProtocolStats",
    inputs: [],
    outputs: [
      { name: "totalLiquidity", type: "uint256", internalType: "uint256" },
      { name: "availableLiquidity", type: "uint256", internalType: "uint256" },
      { name: "activeEvents", type: "uint256", internalType: "uint256" },
      { name: "version", type: "string", internalType: "string" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getContractAddresses",
    inputs: [],
    outputs: [
      { name: "token", type: "address", internalType: "address" },
      { name: "factory", type: "address", internalType: "address" },
      { name: "pool", type: "address", internalType: "address" },
      { name: "settlement", type: "address", internalType: "address" },
      { name: "oracle", type: "address", internalType: "address" },
    ],
    stateMutability: "view",
  },
] as const;

// ClimateOracle ABI — Read precipitation data
export const ClimateOracle = [
  {
    type: "function",
    name: "getPrecipitationData",
    inputs: [{ name: "eventId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "requestClimateData",
    inputs: [
      { name: "eventId", type: "uint256", internalType: "uint256" },
      { name: "latitude", type: "int256", internalType: "int256" },
      { name: "longitude", type: "int256", internalType: "int256" },
      { name: "startTime", type: "uint256", internalType: "uint256" },
      { name: "endTime", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "requestId", type: "bytes32", internalType: "bytes32" }],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "ClimateDataReceived",
    inputs: [
      { name: "requestId", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "eventId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "precipitationMm", type: "uint256", indexed: false, internalType: "uint256" },
    ],
  },
] as const;
