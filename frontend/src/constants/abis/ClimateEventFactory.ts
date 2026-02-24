export const CLIMATE_EVENT_FACTORY_ABI = [
  {
    type: 'function',
    name: 'createClimateEvent',
    inputs: [
      { name: 'latitude', type: 'int256' },
      { name: 'longitude', type: 'int256' },
      { name: 'startTime', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
      { name: 'thresholdMm', type: 'uint256' },
      { name: 'payoutPerToken', type: 'uint256' },
      { name: 'tokensToCreate', type: 'uint256' },
    ],
    outputs: [{ name: 'eventId', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getAvailableTokens',
    inputs: [{ name: 'eventId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getEventPremium',
    inputs: [{ name: 'eventId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'calculatePremium',
    inputs: [
      { name: 'payoutPerToken', type: 'uint256' },
      { name: 'duration', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'eventCounter',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;
