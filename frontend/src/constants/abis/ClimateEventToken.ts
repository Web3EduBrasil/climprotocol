export const CLIMATE_EVENT_TOKEN_ABI = [
  {
    type: 'function',
    name: 'getEventData',
    inputs: [{ name: 'eventId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'latitude', type: 'int256' },
          { name: 'longitude', type: 'int256' },
          { name: 'startTime', type: 'uint256' },
          { name: 'endTime', type: 'uint256' },
          { name: 'thresholdMm', type: 'uint256' },
          { name: 'payoutPerToken', type: 'uint256' },
          { name: 'totalSupply', type: 'uint256' },
          { name: 'actualMm', type: 'uint256' },
          { name: 'status', type: 'uint8' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isEventTriggered',
    inputs: [{ name: 'eventId', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'redeemTokens',
    inputs: [{ name: 'eventId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;
