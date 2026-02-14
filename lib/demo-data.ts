import type {
  PortfolioData, StatusData, PositionData, RiskData,
  TradeData, EventData, ThemeData, PendingOrder,
  ScreeningItem, EvolutionData, EvolutionHistoryItem,
} from '@/lib/api-client';

const INITIAL_CAPITAL = 10_000_000;

export const DEMO_PORTFOLIO: PortfolioData = {
  total_equity: 10_234_500,
  cash_balance: 5_120_000,
  invested_amount: 5_114_500,
  total_pnl: 234_500,
  total_pnl_pct: 2.35,
  daily_pnl: 87_200,
  daily_pnl_pct: 0.86,
  initial_capital: INITIAL_CAPITAL,
  position_count: 3,
};

export const DEMO_STATUS: StatusData = {
  status: 'running',
  market_session: 'REGULAR',
  uptime_seconds: 28800,
  event_count: 156,
  ws_connected: false,
  trading_enabled: true,
  start_time: new Date(Date.now() - 28800000).toISOString(),
};

export const DEMO_POSITIONS: PositionData[] = [
  {
    symbol: '005930',
    name: '삼성전자',
    quantity: 30,
    avg_price: 72500,
    current_price: 74200,
    unrealized_pnl: 51000,
    unrealized_pnl_pct: 2.34,
    market_value: 2226000,
    weight: 21.7,
    strategy: 'MOMENTUM_BREAKOUT',
    entry_date: new Date().toISOString(),
    exit_state: 'TRAILING',
    trailing_high: 74800,
    stop_loss_pct: 2.5,
    exit_stages_completed: [1],
  },
  {
    symbol: '000660',
    name: 'SK하이닉스',
    quantity: 15,
    avg_price: 178000,
    current_price: 182500,
    unrealized_pnl: 67500,
    unrealized_pnl_pct: 2.53,
    market_value: 2737500,
    weight: 26.7,
    strategy: 'SEPA_TREND',
    entry_date: new Date(Date.now() - 86400000).toISOString(),
    exit_state: 'BREAKEVEN',
    stop_loss_pct: 2.5,
    exit_stages_completed: [],
  },
  {
    symbol: '035720',
    name: '카카오',
    quantity: 40,
    avg_price: 38200,
    current_price: 37650,
    unrealized_pnl: -22000,
    unrealized_pnl_pct: -1.44,
    market_value: 1506000,
    weight: 14.7,
    strategy: 'THEME_CHASING',
    entry_date: new Date().toISOString(),
    exit_state: 'MONITORING',
    stop_loss_pct: 2.5,
    exit_stages_completed: [],
  },
];

export const DEMO_RISK: RiskData = {
  daily_pnl: 87200,
  daily_pnl_pct: 0.86,
  daily_loss_limit: -200000,
  daily_loss_limit_pct: -2.0,
  position_count: 3,
  max_positions: 0,
  cash_ratio: 50.0,
  trading_enabled: true,
  consecutive_losses: 0,
};

export const DEMO_TRADES: TradeData[] = [
  {
    symbol: '005930',
    name: '삼성전자',
    side: 'buy',
    strategy: 'MOMENTUM_BREAKOUT',
    quantity: 30,
    price: 72500,
    amount: 2175000,
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    entry_reason: '20일 고가 돌파 + 거래량 3.2배',
  },
  {
    symbol: '035720',
    name: '카카오',
    side: 'buy',
    strategy: 'THEME_CHASING',
    quantity: 40,
    price: 38200,
    amount: 1528000,
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    entry_reason: 'AI 테마 상위 + 거래량 급증',
  },
  {
    symbol: '068270',
    name: '셀트리온',
    side: 'sell',
    strategy: 'MOMENTUM_BREAKOUT',
    quantity: 20,
    price: 195000,
    amount: 3900000,
    pnl: 42000,
    pnl_pct: 1.08,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    exit_reason: '1차 익절 (2.5%)',
    hold_time: '2시간 15분',
    entry_price: 193000,
    exit_price: 195000,
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
  { theme: 'AI/반도체', score: 92, keywords: ['AI', 'HBM', '반도체'], stocks: ['SK하이닉스', '삼성전자', 'DB하이텍'], detected_at: new Date().toISOString() },
  { theme: '2차전지', score: 78, keywords: ['배터리', '리튬', '전고체'], stocks: ['LG에너지솔루션', '삼성SDI', '에코프로'], detected_at: new Date().toISOString() },
  { theme: '바이오', score: 71, keywords: ['신약', '임상', 'FDA'], stocks: ['셀트리온', '삼성바이오', '유한양행'], detected_at: new Date().toISOString() },
  { theme: '로봇/자동화', score: 65, keywords: ['로봇', '자동화', '스마트팩토리'], stocks: ['두산로보틱스', '레인보우로보틱스'], detected_at: new Date().toISOString() },
];

export const DEMO_SCREENING: ScreeningItem[] = [
  { symbol: '005930', name: '삼성전자', score: 88, price: 74200, change_pct: 2.34, volume_ratio: 3.2, strategy: 'MOMENTUM_BREAKOUT' },
  { symbol: '000660', name: 'SK하이닉스', score: 85, price: 182500, change_pct: 1.89, volume_ratio: 2.8, strategy: 'SEPA_TREND' },
  { symbol: '035420', name: 'NAVER', score: 79, price: 215000, change_pct: 1.45, volume_ratio: 2.1, strategy: 'MOMENTUM_BREAKOUT' },
  { symbol: '068270', name: '셀트리온', score: 76, price: 195000, change_pct: 1.12, volume_ratio: 1.9, strategy: 'THEME_CHASING' },
  { symbol: '006400', name: '삼성SDI', score: 72, price: 412000, change_pct: 0.98, volume_ratio: 1.7, strategy: 'SEPA_TREND' },
];

export const DEMO_STRATEGIES = [
  { name: 'MOMENTUM_BREAKOUT', total: 45, wins: 22, losses: 23, win_rate: 48.9, total_pnl: 156000, avg_pnl: 3467 },
  { name: 'SEPA_TREND', total: 28, wins: 15, losses: 13, win_rate: 53.6, total_pnl: 234000, avg_pnl: 8357 },
  { name: 'THEME_CHASING', total: 32, wins: 14, losses: 18, win_rate: 43.8, total_pnl: -45000, avg_pnl: -1406 },
  { name: 'GAP_AND_GO', total: 15, wins: 8, losses: 7, win_rate: 53.3, total_pnl: 89000, avg_pnl: 5933 },
];

export const DEMO_EVOLUTION: EvolutionData = {
  total_evolutions: 12,
  successful: 8,
  rolled_back: 3,
  last_evolution_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
  pending_changes: [],
  active_changes: [
    { strategy: 'MOMENTUM_BREAKOUT', parameter: 'min_volume_ratio', old_value: 2.2, new_value: 2.5, reason: '거짓 신호 감소', confidence: 0.75 },
  ],
};

export const DEMO_EVOLUTION_HISTORY: EvolutionHistoryItem[] = [
  { date: '2026-02-14', strategy: 'MOMENTUM_BREAKOUT', parameter: 'min_volume_ratio', old_value: 2.2, new_value: 2.5, reason: '낮은 거래량 종목의 거짓 신호 감소 필요', confidence: 0.75, effect: 'positive', status: 'applied' },
  { date: '2026-02-13', strategy: 'SEPA_TREND', parameter: 'min_score', old_value: 70, new_value: 60, reason: 'KRX 시장에서 SEPA 필터가 너무 엄격', confidence: 0.8, effect: 'positive', status: 'applied' },
  { date: '2026-02-12', strategy: 'THEME_CHASING', parameter: 'stop_loss_pct', old_value: 3.0, new_value: 2.5, reason: '손실 제한 강화', confidence: 0.7, effect: 'neutral', status: 'applied' },
  { date: '2026-02-11', strategy: 'GAP_AND_GO', parameter: 'min_gap_pct', old_value: 2.0, new_value: 3.0, reason: '작은 갭에서 수익률 낮음', confidence: 0.65, effect: 'negative', status: 'rolled_back' },
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
