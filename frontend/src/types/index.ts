export type EventStatus = 'ACTIVE' | 'SETTLED' | 'EXPIRED';

export interface MockClimateEvent {
  id: string;
  eventId: bigint;
  name: string;
  region: string;
  state: string;
  latitude: number;
  longitude: number;
  startTime: number;
  endTime: number;
  thresholdMm: number;
  payoutPerToken: bigint;
  totalSupply: number;
  availableTokens: number;
  premiumPerToken: bigint;
  status: EventStatus;
  actualMm?: number;
  payoutTriggered?: boolean;
}

export interface MockPortfolioItem {
  eventId: bigint;
  eventName: string;
  tokenBalance: number;
  potentialPayout: bigint;
  canRedeem: boolean;
  status: EventStatus;
}

export interface PrecipitationDataPoint {
  day: number;
  date: string;
  daily: number;
  accumulated: number;
}
