import { CONTRACTS } from '@/constants/contracts';
import { MockClimateEvent, MockPortfolioItem } from '@/types';

// Mock data for the frontend when contracts are not yet deployed
// All values simulate a realistic Semiárido de Pernambuco scenario

// ============================================
// Protocol Stats (Mock)
// ============================================
export const mockProtocolStats = {
  totalLiquidity: BigInt('50000000000000000000'), // 50 ETH
  availableLiquidity: BigInt('35000000000000000000'), // 35 ETH
  lockedCollateral: BigInt('15000000000000000000'), // 15 ETH
  activeEvents: 3,
  totalTokensSold: 247,
  overcollateralizationRatio: 1500, // 150%
  version: '1.0.0',
};

// ============================================
// Climate Events (Mock)
// ============================================

const now = Math.floor(Date.now() / 1000);
const DAY = 86400;

export const mockEvents: MockClimateEvent[] = [
  {
    id: 'sertao-pe-2026',
    eventId: BigInt('1001'),
    name: 'Seca Sertão PE',
    region: 'Sertão do Pajeú',
    state: 'Pernambuco',
    latitude: -7.83,
    longitude: -38.08,
    startTime: now + 7 * DAY,
    endTime: now + 97 * DAY,
    thresholdMm: 150,
    payoutPerToken: BigInt('50000000000000000'), // 0.05 ETH
    totalSupply: 200,
    availableTokens: 142,
    premiumPerToken: BigInt('27500000000000000'), // ~0.0275 ETH
    status: 'ACTIVE',
  },
  {
    id: 'cariri-pb-2026',
    eventId: BigInt('1002'),
    name: 'Seca Cariri PB',
    region: 'Cariri Paraibano',
    state: 'Paraíba',
    latitude: -7.38,
    longitude: -36.83,
    startTime: now + 14 * DAY,
    endTime: now + 104 * DAY,
    thresholdMm: 130,
    payoutPerToken: BigInt('40000000000000000'), // 0.04 ETH
    totalSupply: 150,
    availableTokens: 98,
    premiumPerToken: BigInt('22000000000000000'), // ~0.022 ETH
    status: 'ACTIVE',
  },
  {
    id: 'agr-ce-2026',
    eventId: BigInt('1003'),
    name: 'Seca Agreste CE',
    region: 'Agreste Central',
    state: 'Ceará',
    latitude: -6.02,
    longitude: -39.27,
    startTime: now - 80 * DAY,
    endTime: now - 10 * DAY,
    thresholdMm: 160,
    payoutPerToken: BigInt('60000000000000000'), // 0.06 ETH
    totalSupply: 100,
    availableTokens: 0,
    premiumPerToken: BigInt('33000000000000000'), // ~0.033 ETH
    status: 'SETTLED',
    actualMm: 112,
    payoutTriggered: true,
  },
  {
    id: 'serrinha-ba-2025',
    eventId: BigInt('1004'),
    name: 'Seca Serrinha BA',
    region: 'Território do Sisal',
    state: 'Bahia',
    latitude: -11.66,
    longitude: -39.00,
    startTime: now - 120 * DAY,
    endTime: now - 30 * DAY,
    thresholdMm: 140,
    payoutPerToken: BigInt('45000000000000000'), // 0.045 ETH
    totalSupply: 80,
    availableTokens: 0,
    premiumPerToken: BigInt('25000000000000000'), // ~0.025 ETH
    status: 'SETTLED',
    actualMm: 185,
    payoutTriggered: false,
  },
];

// ============================================
// User Portfolio (Mock)
// ============================================
export const mockPortfolio: MockPortfolioItem[] = [
  {
    eventId: BigInt('1001'),
    eventName: 'Seca Sertão PE',
    tokenBalance: 5,
    potentialPayout: BigInt('250000000000000000'), // 0.25 ETH
    canRedeem: false,
    status: 'ACTIVE',
  },
  {
    eventId: BigInt('1003'),
    eventName: 'Seca Agreste CE',
    tokenBalance: 3,
    potentialPayout: BigInt('180000000000000000'), // 0.18 ETH
    canRedeem: true,
    status: 'SETTLED',
  },
];

// ============================================
// Precipitation Chart Data (Mock — 90 days)
// ============================================
export const mockPrecipitationData = Array.from({ length: 90 }, (_, i) => {
  const date = new Date(Date.now() - (90 - i) * DAY * 1000);
  const baseRain = Math.random() * 4;
  const seasonalBonus = Math.sin((i / 90) * Math.PI) * 2;
  const rain = Math.max(0, baseRain + seasonalBonus);
  return {
    day: i + 1,
    date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    daily: parseFloat(rain.toFixed(1)),
    accumulated: 0, // will be computed below
  };
});

// Compute accumulated
let acc = 0;
mockPrecipitationData.forEach((d) => {
  acc += d.daily;
  d.accumulated = parseFloat(acc.toFixed(1));
});

// ============================================
// LP History (Mock)
// ============================================
export const mockLPHistory = [
  { date: '01/01', totalLiquidity: 20, availableLiquidity: 18 },
  { date: '15/01', totalLiquidity: 28, availableLiquidity: 22 },
  { date: '01/02', totalLiquidity: 35, availableLiquidity: 28 },
  { date: '10/02', totalLiquidity: 42, availableLiquidity: 30 },
  { date: '19/02', totalLiquidity: 50, availableLiquidity: 35 },
];

// ============================================
// Helper to check if mock mode is active
// ============================================
export const isMockMode = () => {
  const addr = CONTRACTS.PROTOCOL;
  return !addr || addr === '0x0000000000000000000000000000000000000000';
};
