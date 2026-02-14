// Re-export API types from api-client
// This file provides convenient imports for components

export type {
  PortfolioData,
  StatusData,
  PositionData,
  TradeData,
  TradeStats,
  RiskData,
  ThemeData,
  EventData,
  ConfigData,
  EvolutionData,
  EvolutionHistoryItem,
  EquitySnapshot,
  EquityHistoryResponse,
  EquityCurvePoint,
  DailyReviewData,
  ScreeningItem,
  HealthCheck,
  PendingOrder,
  ExternalAccount,
  OrderEvent,
  PositionSnapshot,
} from '@/lib/api-client';

// Additional UI-specific types
export interface StrategyPerformance {
  name: string;
  total: number;
  wins: number;
  losses: number;
  win_rate: number;
  total_pnl: number;
  avg_pnl: number;
}

export interface DemoBadgeProps {
  visible: boolean;
}
