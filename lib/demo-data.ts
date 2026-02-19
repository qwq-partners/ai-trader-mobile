import type {
  PortfolioData, StatusData, PositionData, RiskData,
  TradeData, TradeEventData, EventData, ThemeData, PendingOrder,
  ScreeningItem, EvolutionData, EvolutionHistoryItem,
} from '@/lib/api-client';
import { INITIAL_CAPITAL } from '@/shared/const';

export const DEMO_PORTFOLIO: PortfolioData = {
  cash: 5_120_000,
  total_position_value: 5_114_500,
  total_equity: 10_234_500,
  initial_capital: INITIAL_CAPITAL,
  total_pnl: 234_500,
  total_pnl_pct: 2.35,
  daily_pnl: 87_200,
  realized_daily_pnl: 42_000,
  unrealized_pnl: 96_500,
  daily_pnl_pct: 0.86,
  daily_trades: 3,
  cash_ratio: 0.50,
  position_count: 3,
  timestamp: new Date().toISOString(),
};

export const DEMO_STATUS: StatusData = {
  running: true,
  session: 'REGULAR',
  uptime_seconds: 28800,
  engine: {
    events_processed: 156,
    signals_generated: 5,
    orders_submitted: 3,
    orders_filled: 3,
    errors_count: 0,
    paused: false,
  },
  websocket: {
    connected: false,
    subscribed_count: 0,
    message_count: 0,
    last_message_time: null,
  },
  watch_symbols_count: 113,
  timestamp: new Date().toISOString(),
};

export const DEMO_POSITIONS: PositionData[] = [
  {
    symbol: '005930',
    name: '삼성전자',
    quantity: 30,
    avg_price: 72500,
    current_price: 74200,
    market_value: 2226000,
    cost_basis: 2175000,
    unrealized_pnl: 51000,
    unrealized_pnl_pct: 2.34,
    strategy: 'momentum_breakout',
    entry_time: new Date().toISOString(),
    stop_loss: null,
    take_profit: null,
    highest_price: 74800,
    exit_state: {
      stage: 'trailing',
      original_quantity: 30,
      remaining_quantity: 30,
      highest_price: 74800,
      realized_pnl: 0,
    },
  },
  {
    symbol: '000660',
    name: 'SK하이닉스',
    quantity: 15,
    avg_price: 178000,
    current_price: 182500,
    market_value: 2737500,
    cost_basis: 2670000,
    unrealized_pnl: 67500,
    unrealized_pnl_pct: 2.53,
    strategy: 'sepa_trend',
    entry_time: new Date(Date.now() - 86400000).toISOString(),
    stop_loss: null,
    take_profit: null,
    highest_price: 182500,
    exit_state: {
      stage: 'breakeven',
      original_quantity: 15,
      remaining_quantity: 15,
      highest_price: 182500,
      realized_pnl: 0,
    },
  },
  {
    symbol: '035720',
    name: '카카오',
    quantity: 40,
    avg_price: 38200,
    current_price: 37650,
    market_value: 1506000,
    cost_basis: 1528000,
    unrealized_pnl: -22000,
    unrealized_pnl_pct: -1.44,
    strategy: 'theme_chasing',
    entry_time: new Date().toISOString(),
    stop_loss: null,
    take_profit: null,
    highest_price: 38500,
    exit_state: {
      stage: 'monitoring',
      original_quantity: 40,
      remaining_quantity: 40,
      highest_price: 38500,
      realized_pnl: 0,
    },
  },
];

export const DEMO_RISK: RiskData = {
  can_trade: true,
  daily_loss_pct: 0.86,
  daily_loss_limit_pct: 2.0,
  daily_trades: 3,
  daily_max_trades: 30,
  position_count: 3,
  max_positions: 7,
  config_max_positions: 7,
  consecutive_losses: 0,
  timestamp: new Date().toISOString(),
};

export const DEMO_TRADES: TradeData[] = [
  {
    id: '005930_20260215100000000000',
    symbol: '005930',
    name: '삼성전자',
    entry_time: new Date(Date.now() - 14400000).toISOString(),
    entry_price: 72500,
    entry_quantity: 30,
    entry_reason: '20일 고가 돌파 + 거래량 3.2배',
    entry_strategy: 'momentum_breakout',
    entry_signal_score: 85,
    pnl: 51000,
    pnl_pct: 2.34,
    holding_minutes: 240,
    current_price: 74200,
  },
  {
    id: '035720_20260215110000000000',
    symbol: '035720',
    name: '카카오',
    entry_time: new Date(Date.now() - 10800000).toISOString(),
    entry_price: 38200,
    entry_quantity: 40,
    entry_reason: 'AI 테마 상위 + 거래량 급증',
    entry_strategy: 'theme_chasing',
    entry_signal_score: 82,
    pnl: -22000,
    pnl_pct: -1.44,
    holding_minutes: 180,
    current_price: 37650,
  },
  {
    id: '068270_20260215120000000000',
    symbol: '068270',
    name: '셀트리온',
    entry_time: new Date(Date.now() - 14400000).toISOString(),
    entry_price: 193000,
    entry_quantity: 20,
    entry_reason: '20일 고가 돌파 + 거래량 2.8배',
    entry_strategy: 'momentum_breakout',
    entry_signal_score: 78,
    exit_time: new Date(Date.now() - 7200000).toISOString(),
    exit_price: 195000,
    exit_quantity: 20,
    exit_reason: '1차 익절 (2.5%)',
    exit_type: 'first_exit',
    pnl: 42000,
    pnl_pct: 1.08,
    holding_minutes: 135,
  },
];

export const DEMO_TRADE_EVENTS: TradeEventData[] = [
  {
    id: 1,
    trade_id: '005930_20260215100000000000',
    symbol: '005930',
    name: '삼성전자',
    event_type: 'BUY',
    event_time: new Date(Date.now() - 14400000).toISOString(),
    price: 72500,
    quantity: 30,
    exit_type: null,
    exit_reason: null,
    pnl: 51000,
    pnl_pct: 2.34,
    strategy: 'momentum_breakout',
    signal_score: 85,
    kis_order_no: null,
    status: 'holding',
    created_at: new Date().toISOString(),
    entry_price: 72500,
    entry_quantity: 30,
    current_price: 74200,
  },
  {
    id: 2,
    trade_id: '035720_20260215110000000000',
    symbol: '035720',
    name: '카카오',
    event_type: 'BUY',
    event_time: new Date(Date.now() - 10800000).toISOString(),
    price: 38200,
    quantity: 40,
    exit_type: null,
    exit_reason: null,
    pnl: -22000,
    pnl_pct: -1.44,
    strategy: 'theme_chasing',
    signal_score: 82,
    kis_order_no: null,
    status: 'holding',
    created_at: new Date().toISOString(),
    entry_price: 38200,
    entry_quantity: 40,
    current_price: 37650,
  },
  {
    id: 3,
    trade_id: '068270_20260215120000000000',
    symbol: '068270',
    name: '셀트리온',
    event_type: 'BUY',
    event_time: new Date(Date.now() - 14400000).toISOString(),
    price: 193000,
    quantity: 20,
    exit_type: null,
    exit_reason: null,
    pnl: null,
    pnl_pct: null,
    strategy: 'momentum_breakout',
    signal_score: 78,
    kis_order_no: null,
    status: 'holding',
    created_at: new Date().toISOString(),
    entry_price: 193000,
    entry_quantity: 20,
  },
  {
    id: 4,
    trade_id: '068270_20260215120000000000',
    symbol: '068270',
    name: '셀트리온',
    event_type: 'SELL',
    event_time: new Date(Date.now() - 7200000).toISOString(),
    price: 195000,
    quantity: 20,
    exit_type: 'first_take_profit',
    exit_reason: '1차 익절 (2.5%)',
    pnl: 42000,
    pnl_pct: 1.08,
    strategy: 'momentum_breakout',
    signal_score: 78,
    kis_order_no: null,
    status: 'first_take_profit',
    created_at: new Date().toISOString(),
    entry_price: 193000,
    entry_quantity: 20,
  },
];

export const DEMO_EVENTS: EventData[] = [
  { id: 1, type: 'fill', message: '삼성전자 30주 매수 체결 @72,500원', timestamp: new Date(Date.now() - 14400000).toISOString() },
  { id: 2, type: 'signal', message: '카카오 매수 시그널 (테마추종, 점수 82)', timestamp: new Date(Date.now() - 11000000).toISOString() },
  { id: 3, type: 'fill', message: '카카오 40주 매수 체결 @38,200원', timestamp: new Date(Date.now() - 10800000).toISOString() },
  { id: 4, type: 'info', message: '셀트리온 1차 익절 실행 (30%)', timestamp: new Date(Date.now() - 7200000).toISOString() },
  { id: 5, type: 'fill', message: '셀트리온 20주 매도 체결 @195,000원', timestamp: new Date(Date.now() - 7100000).toISOString() },
  { id: 6, type: 'info', message: 'SK하이닉스 본전 이동 활성화', timestamp: new Date(Date.now() - 3600000).toISOString() },
];

export const DEMO_PENDING_ORDERS: PendingOrder[] = [];

export const DEMO_THEMES: ThemeData[] = [
  { name: 'AI/반도체', score: 92, keywords: ['AI', 'HBM', '반도체'], related_stocks: ['SK하이닉스', '삼성전자', 'DB하이텍'], news_count: 4, detected_at: new Date().toISOString(), last_updated: new Date().toISOString() },
  { name: '2차전지', score: 78, keywords: ['배터리', '리튬', '전고체'], related_stocks: ['LG에너지솔루션', '삼성SDI', '에코프로'], news_count: 3, detected_at: new Date().toISOString(), last_updated: new Date().toISOString() },
  { name: '바이오', score: 71, keywords: ['신약', '임상', 'FDA'], related_stocks: ['셀트리온', '삼성바이오', '유한양행'], news_count: 2, detected_at: new Date().toISOString(), last_updated: new Date().toISOString() },
  { name: '로봇/자동화', score: 65, keywords: ['로봇', '자동화', '스마트팩토리'], related_stocks: ['두산로보틱스', '레인보우로보틱스'], news_count: 1, detected_at: new Date().toISOString(), last_updated: new Date().toISOString() },
];

export const DEMO_SCREENING: ScreeningItem[] = [
  { symbol: '005930', name: '삼성전자', score: 88, price: 74200, change_pct: 2.34, volume: 15000000, volume_ratio: 3.2, reasons: ['20일 고가 돌파', '거래량 급증 3.2배'], screened_at: new Date().toISOString() },
  { symbol: '000660', name: 'SK하이닉스', score: 85, price: 182500, change_pct: 1.89, volume: 8000000, volume_ratio: 2.8, reasons: ['SEPA 트렌드 부합', '외국인 순매수'], screened_at: new Date().toISOString() },
  { symbol: '035420', name: 'NAVER', score: 79, price: 215000, change_pct: 1.45, volume: 5000000, volume_ratio: 2.1, reasons: ['20일 고가 돌파'], screened_at: new Date().toISOString() },
  { symbol: '068270', name: '셀트리온', score: 76, price: 195000, change_pct: 1.12, volume: 4000000, volume_ratio: 1.9, reasons: ['테마 상위'], screened_at: new Date().toISOString() },
  { symbol: '006400', name: '삼성SDI', score: 72, price: 412000, change_pct: 0.98, volume: 3000000, volume_ratio: 1.7, reasons: ['SEPA 트렌드 부합'], screened_at: new Date().toISOString() },
];

export const DEMO_STRATEGIES = [
  { name: 'momentum_breakout', trades: 45, wins: 22, losses: 23, win_rate: 48.9, total_pnl: 156000 },
  { name: 'sepa_trend', trades: 28, wins: 15, losses: 13, win_rate: 53.6, total_pnl: 234000 },
  { name: 'theme_chasing', trades: 32, wins: 14, losses: 18, win_rate: 43.8, total_pnl: -45000 },
  { name: 'gap_and_go', trades: 15, wins: 8, losses: 7, win_rate: 53.3, total_pnl: 89000 },
];

export const DEMO_EVOLUTION: EvolutionData = {
  summary: {
    version: 3,
    total_evolutions: 12,
    successful_changes: 8,
    rolled_back_changes: 3,
    last_evolution: new Date(Date.now() - 86400000).toISOString(),
    assessment: 'positive',
    confidence: 0.72,
  },
  insights: [],
  parameter_adjustments: [],
  parameter_changes: [],
  avoid_situations: [],
  focus_opportunities: [],
  next_week_outlook: '',
};

export const DEMO_EVOLUTION_HISTORY: EvolutionHistoryItem[] = [
  { strategy: 'momentum_breakout', parameter: 'min_volume_ratio', as_is: 2.2, to_be: 2.5, reason: '낮은 거래량 종목의 거짓 신호 감소 필요', source: 'llm', is_effective: true, win_rate_before: 42, win_rate_after: 49, trades_before: 20, trades_after: 15, timestamp: '2026-02-14T20:30:00' },
  { strategy: 'sepa_trend', parameter: 'min_score', as_is: 70, to_be: 60, reason: 'KRX 시장에서 SEPA 필터가 너무 엄격', source: 'llm', is_effective: true, win_rate_before: 48, win_rate_after: 54, trades_before: 10, trades_after: 15, timestamp: '2026-02-13T20:30:00' },
  { strategy: 'theme_chasing', parameter: 'stop_loss_pct', as_is: 3.0, to_be: 2.5, reason: '손실 제한 강화', source: 'llm', is_effective: null, win_rate_before: 40, win_rate_after: null, trades_before: 15, trades_after: null, timestamp: '2026-02-12T20:30:00' },
  { strategy: 'gap_and_go', parameter: 'min_gap_pct', as_is: 2.0, to_be: 3.0, reason: '작은 갭에서 수익률 낮음', source: 'llm', is_effective: false, win_rate_before: 50, win_rate_after: 35, trades_before: 8, trades_after: 5, timestamp: '2026-02-11T20:30:00' },
];

export const DEMO_RISK_SETTINGS = {
  daily_loss_limit_pct: -2.0,
  max_position_pct: 25,
  max_total_position_pct: 35,
  min_cash_pct: 5,
  default_stop_loss_pct: 2.5,
  default_take_profit_pct: 2.5,
};

// --- 포맷 함수 ---
export function formatKRW(amount: number): string {
  if (Math.abs(amount) >= 100_000_000) {
    return `${(amount / 100_000_000).toFixed(2)}억원`;
  }
  if (Math.abs(amount) >= 10_000) {
    return `${Math.round(amount / 10_000).toLocaleString()}만원`;
  }
  return `${amount.toLocaleString()}원`;
}

export function formatPrice(price: number): string {
  return price.toLocaleString();
}

export function formatPct(pct: number, showSign = true): string {
  const sign = showSign && pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);

  if (diffMin < 1) return '방금';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
}

export function formatHoldingTime(minutes: number): string {
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
  const days = Math.floor(hours / 24);
  const remainHours = hours % 24;
  return remainHours > 0 ? `${days}일 ${remainHours}시간` : `${days}일`;
}
