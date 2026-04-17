import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  DEFAULT_SERVER_URL, API_TIMEOUT_MS, SSE_RECONNECT_DELAY_MS,
  POLLING_INTERVAL_MS, STORAGE_KEYS,
} from '@/shared/const';

// =============================================================================
// Type Definitions (서버 응답 1:1 매칭)
// =============================================================================

// --- 기본 타입 ---

export interface PortfolioData {
  cash: number;
  total_position_value: number;
  total_equity: number;
  initial_capital: number;
  total_pnl: number;
  total_pnl_pct: number;
  daily_pnl: number;
  realized_daily_pnl: number;
  unrealized_pnl: number;
  unrealized_pnl_net: number;  // 수수료 포함 미실현 순손익
  daily_pnl_pct: number;
  daily_trades: number;
  cash_ratio: number;
  position_count: number;
  timestamp: string;
}

export interface StatusData {
  running: boolean;
  session: string;
  uptime_seconds: number;
  engine: {
    events_processed: number;
    signals_generated: number;
    orders_submitted: number;
    orders_filled: number;
    errors_count: number;
    paused: boolean;
  };
  websocket: {
    connected: boolean;
    subscribed_count: number;
    message_count: number;
    last_message_time: string | null;
  };
  watch_symbols_count: number;
  timestamp: string;
}

export interface PositionData {
  symbol: string;
  name: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  market_value: number;
  cost_basis: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
  unrealized_pnl_net: number;      // 수수료 포함 순손익
  unrealized_pnl_net_pct: number;  // 수수료 포함 순손익률
  strategy: string | null;
  entry_time: string | null;
  stop_loss: number | null;
  take_profit: number | null;
  highest_price: number | null;
  exit_state: {
    stage: string;
    original_quantity: number;
    remaining_quantity: number;
    highest_price: number;
    realized_pnl: number;
  } | null;
}

export interface TradeData {
  id: string;
  symbol: string;
  name: string;
  entry_time: string;
  entry_price: number;
  entry_quantity: number;
  entry_reason: string;
  entry_strategy: string;
  entry_signal_score: number;
  exit_time?: string | null;
  exit_price?: number | null;
  exit_quantity?: number | null;
  exit_reason?: string;
  exit_type?: string;
  pnl: number;
  pnl_pct: number;
  holding_minutes: number;
  current_price?: number;
  market_context?: Record<string, any>;
  indicators_at_entry?: Record<string, any>;
  indicators_at_exit?: Record<string, any>;
  theme_info?: Record<string, any>;
}

export interface TradeStats {
  total_trades: number;
  wins: number;
  losses: number;
  win_rate: number;
  total_pnl: number;
  avg_pnl_pct: number;
  avg_holding_minutes: number;
  best_trade: TradeData | null;
  worst_trade: TradeData | null;
  by_strategy: Record<string, {
    trades: number;
    wins: number;
    total_pnl: number;
    win_rate: number;
  }>;
  open_trades: number;
  open_pnl: number;
  open_avg_pnl_pct: number;
  all_trades: number;
}

export interface RiskData {
  can_trade: boolean;
  daily_loss_pct: number;
  daily_loss_limit_pct: number;
  daily_trades: number;
  daily_max_trades: number;
  position_count: number;
  max_positions: number;
  config_max_positions: number;
  consecutive_losses: number;
  timestamp: string;
}

export interface ThemeData {
  name: string;
  keywords: string[];
  related_stocks: string[];
  score: number;
  news_count: number;
  detected_at: string;
  last_updated: string;
}

export interface EventData {
  id: number;
  type: string; // fill, signal, error, info, warning
  message: string;
  timestamp: string;
  data?: Record<string, any>;
}

export interface ConfigData {
  trading: Record<string, any>;
  risk: Record<string, any>;
  exit_manager: Record<string, any>;
  strategies: Record<string, any>;
}

export interface EvolutionData {
  summary: {
    version: number;
    total_evolutions: number;
    successful_changes: number;
    rolled_back_changes: number;
    last_evolution: string | null;
    assessment: string;
    confidence: number;
  };
  insights: any[];
  parameter_adjustments: any[];
  parameter_changes: any[];
  avoid_situations: any[];
  focus_opportunities: any[];
  next_week_outlook: string;
}

export interface EvolutionHistoryItem {
  strategy: string;
  parameter: string;
  as_is: any;
  to_be: any;
  reason: string;
  source: string;
  is_effective: boolean | null;
  win_rate_before: number | null;
  win_rate_after: number | null;
  trades_before: number | null;
  trades_after: number | null;
  timestamp: string;
}

export interface EquitySnapshot {
  date: string;
  total_equity: number;
  cash: number;
  positions_value: number;
  daily_pnl: number;
  daily_pnl_pct: number;
  trades_count: number;
  position_count: number;
  win_rate: number;
  positions: any[];
  timestamp: string;
}

export interface EquityHistoryResponse {
  snapshots: EquitySnapshot[];
  summary: {
    period_return: number;
    period_return_pct: number;
    max_drawdown_pct: number;
    avg_daily_pnl: number;
    first_equity: number;
    last_equity: number;
    data_days: number;
    oldest_date: string;
  };
}

export interface EquityCurvePoint {
  date: string;
  equity: number;
  daily_pnl: number;
  cumulative_pnl: number;
  trade_count: number;
}

export interface DailyReviewData {
  date: string;
  trade_report: any;
  llm_review: any;
}

export interface ScreeningItem {
  symbol: string;
  name: string;
  price: number;
  change_pct: number;
  volume: number;
  volume_ratio: number;
  score: number;
  reasons: string[];
  screened_at: string;
}

export interface HealthCheck {
  name: string;
  level: string;
  ok: boolean;
  message: string;
  value: any;
  timestamp: string;
}

export interface PendingOrder {
  symbol: string;
  name: string;
  side: string; // UPPERCASE: "BUY" | "SELL"
  quantity: number;
  elapsed_seconds: number;
  timeout_seconds: number;
  remaining_seconds: number;
  progress_pct: number;
}

export interface ExternalAccount {
  name: string;
  cano: string;
  summary: {
    total_equity: number;
    stock_value: number;
    deposit: number;
    unrealized_pnl: number;
    purchase_amount: number;
  };
  positions: Array<{
    symbol: string;
    name: string;
    qty: number;
    avg_price: number;
    current_price: number;
    eval_amt: number;
    pnl: number;
    pnl_pct: number;
    change_pct: number;
  }>;
}

export interface USPortfolioData {
  cash: number;
  total_value: number;
  positions_value: number;
  daily_pnl: number;
  daily_pnl_pct: number;
  positions_count: number;
}

export interface USPositionData {
  symbol: string; name: string; quantity: number; avg_price: number;
  current_price: number; pnl: number; pnl_pct: number;
  strategy: string; stage: string; market_value: number; entry_time: string | null;
}

export interface USTradeData {
  timestamp: string; symbol: string; name: string;
  side: 'buy' | 'sell'; entry_price: number; exit_price: number;
  quantity: number; pnl: number; pnl_pct: number; strategy: string;
  reason: string; exit_type: string; trade_id: string;
  market: string; status: string; current_price?: number;
}

export interface OverseasData {
  positions: Array<{
    symbol: string;
    name: string;
    qty: number;
    avg_price: number;
    current_price: number;
    eval_amt: number;
    pnl: number;
    pnl_pct: number;
  }>;
  summary: {
    total_equity: number;
    stock_value: number;
    deposit: number;
    unrealized_pnl: number;
    purchase_amount: number;
  };
  cached: boolean;
}

export interface CoreHoldingPosition {
  symbol: string;
  name: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  market_value: number;
  cost_basis: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
  holding_days: number;
  weight_pct: number;
}

export interface CoreHoldingsData {
  positions: CoreHoldingPosition[];
  summary: {
    total_value: number;
    total_cost: number;
    total_pnl_pct: number;
    max_positions: number;
    budget: number;
    alloc_pct: number;
    slot_count: number;
  };
  days_to_rebalance: number;
  next_rebalance: string | null;
}

export interface MarketIndexItem {
  symbol: string;
  label: string;
  kind: string;  // "index_kr" | "index_us" | "stock_kr"
  price: number;
  change: number;
  change_pct: number;
  prev_close: number | null;
  sparkline?: number[];
}

export interface TradeEventData {
  id: number;
  trade_id: string;
  symbol: string;
  name: string;
  event_type: 'BUY' | 'SELL';
  event_time: string;
  price: number;
  quantity: number;
  exit_type: string | null;
  exit_reason: string | null;
  pnl: number | null;
  pnl_pct: number | null;
  strategy: string;
  signal_score: number;
  kis_order_no: string | null;
  status: string;
  created_at: string;
  entry_price?: number;
  entry_quantity?: number;
  current_price?: number;
}

export interface OrderEvent {
  symbol: string;
  name: string;
  side: string;
  quantity: number;
  price: number;
  status: string;
  timestamp: string;
  message?: string;
}

export interface PositionSnapshot {
  symbol: string;
  name: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  pnl: number;
  pnl_pct: number;
  weight: number;
}

// ── 정산 ──────────────────────────────────────────────────────────────────

export interface SettlementBuyItem {
  time: string;
  symbol: string;
  name: string;
  quantity: number;
  price: number;
  amount: number;
  fee: number;
  total: number;
  odno: string;
}

export interface SettlementSellItem {
  time: string;
  symbol: string;
  name: string;
  quantity: number;
  price: number;
  entry_price: number;
  amount: number;
  fee: number;
  tax: number;
  net_amount: number;
  pnl: number;
  pnl_pct: number;
  exit_type: string;
  odno: string;
}

export interface SettlementHoldingItem {
  symbol: string;
  name: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  unrealized_pnl: number;
  unrealized_pct: number;
}

export interface SettlementSummary {
  total_buy_amount: number;
  total_sell_amount: number;
  realized_pnl: number;
  unrealized_pnl: number;
  total_pnl: number;
  buy_count: number;
  sell_count: number;
  win_count: number;
  loss_count: number;
  holdings_count: number;
}

export interface DailySettlementData {
  date: string;
  buys: SettlementBuyItem[];
  sells: SettlementSellItem[];
  holdings: SettlementHoldingItem[];
  summary: SettlementSummary;
  error?: string;
}

// ── 테마 (상세) ────────────────────────────────────────────────────────────

export interface ThemeNewsItem {
  title: string;
  url: string;
}

export interface ThemeDetailData {
  name: string;
  keywords: string[];
  related_stocks: string[];
  score: number;
  news_count: number;
  news_items?: ThemeNewsItem[];
  news_titles?: string[];
  detected_at: string;
  last_updated: string;
}

export interface USThemeData {
  name: string;
  score: number;
  keywords: string[];
  stocks: string[];       // API 필드명: stocks (tickers 아님)
  news_count: number;
  detected_at: string;
  last_updated: string;
  news_titles?: string[];
  news_items?: { title: string; url: string }[];
}

export interface USScreeningItem {
  symbol: string;
  name: string;
  price: number;
  change_pct: number;
  volume_ratio?: number;
  score: number;
  reasons: string[];
  screened_at: string;
}

// =============================================================================
// API Client
// =============================================================================

const STORAGE_KEY_SERVER_URL = STORAGE_KEYS.SERVER_URL;

class ApiClient {
  private client: AxiosInstance;
  private baseUrl: string = DEFAULT_SERVER_URL;

  constructor() {
    this.client = axios.create({
      timeout: API_TIMEOUT_MS,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async loadServerUrl(): Promise<string> {
    try {
      const url = await AsyncStorage.getItem(STORAGE_KEY_SERVER_URL);
      if (url) {
        this.baseUrl = url;
      }
    } catch (e) {
      console.warn('[ApiClient] AsyncStorage 접근 실패:', e);
    }
    return this.baseUrl;
  }

  async setServerUrl(url: string): Promise<void> {
    this.baseUrl = url.replace(/\/+$/, '');
    await AsyncStorage.setItem(STORAGE_KEY_SERVER_URL, this.baseUrl);
  }

  getServerUrl(): string {
    return this.baseUrl;
  }

  private async get<T>(path: string, params?: Record<string, any>): Promise<T> {
    const response = await this.client.get<T>(`${this.baseUrl}${path}`, { params });
    return response.data;
  }

  private async post<T>(path: string, body?: any): Promise<T> {
    const response = await this.client.post<T>(`${this.baseUrl}${path}`, body);
    return response.data;
  }

  // --- 상태/포트폴리오 ---

  async getStatus(): Promise<StatusData> {
    return this.get('/api/status');
  }

  async getPortfolio(): Promise<PortfolioData> {
    return this.get('/api/portfolio');
  }

  async getPositions(): Promise<PositionData[]> {
    try { return await this.get('/api/positions'); } catch (e) { console.warn('[API] getPositions 실패:', e); return []; }
  }

  async getRisk(): Promise<RiskData> {
    return this.get('/api/risk');
  }

  // --- 거래 ---

  async getTodayTrades(): Promise<TradeData[]> {
    try { return await this.get('/api/trades/today'); } catch (e) { console.warn('[API] getTodayTrades 실패:', e); return []; }
  }

  async getTrades(date: string): Promise<TradeData[]> {
    try { return await this.get('/api/trades', { date }); } catch (e) { console.warn('[API] getTrades 실패:', e); return []; }
  }

  async getTradeStats(days: number = 30): Promise<TradeStats> {
    return this.get('/api/trades/stats', { days });
  }

  async getTradeEvents(date: string, type: 'all' | 'buy' | 'sell' = 'all'): Promise<TradeEventData[]> {
    try { return await this.get('/api/trade-events', { date, type }); } catch (e) { console.warn('[API] getTradeEvents 실패:', e); return []; }
  }

  // --- 테마/스크리닝 ---

  async getThemes(): Promise<ThemeData[]> {
    try { return await this.get('/api/themes'); } catch (e) { console.warn('[API] getThemes 실패:', e); return []; }
  }

  async getScreening(): Promise<ScreeningItem[]> {
    try { return await this.get('/api/screening'); } catch (e) { console.warn('[API] getScreening 실패:', e); return []; }
  }

  // --- 설정/진화 ---

  async getConfig(): Promise<ConfigData> {
    return this.get('/api/config');
  }

  async getEvolution(): Promise<EvolutionData> {
    return this.get('/api/evolution');
  }

  async getEvolutionHistory(): Promise<EvolutionHistoryItem[]> {
    try { return await this.get('/api/evolution/history'); } catch (e) { console.warn('[API] getEvolutionHistory 실패:', e); return []; }
  }

  async applyEvolution(body: { strategy: string; parameter: string; new_value: any; reason?: string }): Promise<{ success: boolean; message: string }> {
    return this.post('/api/evolution/apply', body);
  }

  // --- 자산 히스토리 ---

  async getEquityCurve(days: number = 30): Promise<EquityCurvePoint[]> {
    try { return await this.get('/api/equity-curve', { days }); } catch (e) { console.warn('[API] getEquityCurve 실패:', e); return []; }
  }

  async getEquityHistory(days: number = 30): Promise<EquityHistoryResponse> {
    return this.get('/api/equity-history', { days });
  }

  async getEquityHistoryRange(from: string, to: string): Promise<EquityHistoryResponse> {
    return this.get('/api/equity-history', { from, to });
  }

  async getEquityPositions(date: string): Promise<PositionSnapshot[]> {
    try { return await this.get('/api/equity-history/positions', { date }); } catch (e) { console.warn('[API] getEquityPositions 실패:', e); return []; }
  }

  // --- 일일 리뷰 ---

  async getDailyReview(date?: string): Promise<DailyReviewData> {
    return this.get('/api/daily-review', date ? { date } : undefined);
  }

  async getDailyReviewDates(): Promise<{ dates: string[] }> {
    return this.get('/api/daily-review/dates');
  }

  // --- 모니터링/주문 ---

  async getHealthChecks(): Promise<HealthCheck[]> {
    try { return await this.get('/api/health-checks'); } catch (e) { console.warn('[API] getHealthChecks 실패:', e); return []; }
  }

  async getPendingOrders(): Promise<PendingOrder[]> {
    try { return await this.get('/api/orders/pending'); } catch (e) { console.warn('[API] getPendingOrders 실패:', e); return []; }
  }

  async getOrderHistory(): Promise<OrderEvent[]> {
    try { return await this.get('/api/orders/history'); } catch (e) { console.warn('[API] getOrderHistory 실패:', e); return []; }
  }

  // --- 외부 계좌 ---

  async getExternalAccounts(): Promise<ExternalAccount[]> {
    try { return await this.get('/api/accounts/positions'); } catch (e) { console.warn('[API] getExternalAccounts 실패:', e); return []; }
  }

  // --- 해외주식 ---

  async getOverseasPositions(): Promise<OverseasData> {
    try { return await this.get('/api/accounts/overseas'); }
    catch (e) {
      console.warn('[API] getOverseasPositions 실패:', e);
      return { positions: [], summary: { total_equity: 0, stock_value: 0, deposit: 0, unrealized_pnl: 0, purchase_amount: 0 }, cached: false };
    }
  }

  // --- 코어홀딩 / 지수 ---

  async getCoreHoldings(): Promise<CoreHoldingsData> {
    try { return await this.get("/api/core-holdings"); }
    catch (e) { console.warn("[API] getCoreHoldings 실패:", e); return { positions: [], summary: { total_value: 0, total_cost: 0, total_pnl_pct: 0, max_positions: 3, budget: 0, alloc_pct: 30, slot_count: 0 }, days_to_rebalance: 0, next_rebalance: null }; }
  }

  async getMarketIndices(): Promise<MarketIndexItem[]> {
    try { return await this.get("/api/market/indices"); }
    catch (e) { console.warn("[API] getMarketIndices 실패:", e); return []; }
  }

  // --- US 봇 ---

  async getUSPortfolio(): Promise<USPortfolioData> {
    try {
      return await this.get('/api/us/portfolio');
    } catch (e) {
      console.warn('[API] getUSPortfolio 실패:', e);
      return { cash: 0, total_value: 0, positions_value: 0, daily_pnl: 0, daily_pnl_pct: 0, positions_count: 0 };
    }
  }

  async getUSPositions(): Promise<USPositionData[]> {
    try { return await this.get('/api/us/positions'); } catch (e) { console.warn('[API] getUSPositions 실패:', e); return []; }
  }

  async getUSTrades(date: string): Promise<USTradeData[]> {
    try { return await this.get('/api/us/trades', { date }); } catch (e) { console.warn('[API] getUSTrades 실패:', e); return []; }
  }

  // --- 정산 ---

  async getDailySettlement(date?: string): Promise<DailySettlementData> {
    const params = date ? { date } : undefined;
    try { return await this.get("/api/daily-settlement", params); }
    catch (e) {
      console.warn("[API] getDailySettlement 실패:", e);
      return { date: date || "", buys: [], sells: [], holdings: [], summary: { total_buy_amount: 0, total_sell_amount: 0, realized_pnl: 0, unrealized_pnl: 0, total_pnl: 0, buy_count: 0, sell_count: 0, win_count: 0, loss_count: 0, holdings_count: 0 } };
    }
  }

  // --- US 테마/스크리닝 ---

  async getUSThemes(): Promise<USThemeData[]> {
    try { return await this.get("/api/us/themes"); }
    catch (e) { console.warn("[API] getUSThemes 실패:", e); return []; }
  }

  async getUSScreening(): Promise<USScreeningItem[]> {
    try { return await this.get("/api/us/screening"); }
    catch (e) { console.warn("[API] getUSScreening 실패:", e); return []; }
  }

  // --- 이벤트 ---

  async getEvents(sinceId?: number): Promise<EventData[]> {
    try { return await this.get('/api/events', sinceId ? { since: sinceId } : undefined); } catch (e) { console.warn('[API] getEvents 실패:', e); return []; }
  }

  async getSignalEvents(limit: number = 50): Promise<any[]> {
    try { return await this.get('/api/signal-events', { limit }); }
    catch (e) { console.warn('[API] getSignalEvents 실패:', e); return []; }
  }

  // --- 벤치마크 ---

  async getBenchmark(days: number = 30): Promise<any> {
    try { return await this.get('/api/benchmark', { days }); }
    catch (e) { console.warn('[API] getBenchmark 실패:', e); return null; }
  }

  // --- 엔진 상세 ---

  async getLLMRegime(): Promise<any> {
    try { return await this.get('/api/engine/llm-regime'); }
    catch (e) { console.warn('[API] getLLMRegime 실패:', e); return null; }
  }

  async executeSignals(): Promise<any> {
    return this.post('/api/signals/execute');
  }

  async runScan(): Promise<any> {
    return this.post('/api/scan/run');
  }

  // --- 연결 테스트 ---

  async testConnection(): Promise<{ connected: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      await this.getStatus();
      return { connected: true, latencyMs: Date.now() - start };
    } catch (e) {
      console.warn('[API] testConnection 실패:', e);
      return { connected: false, latencyMs: Date.now() - start };
    }
  }
}

export const apiClient = new ApiClient();

// =============================================================================
// SSE Client (실시간 데이터 스트림)
// =============================================================================

export type SSEEventType =
  | 'portfolio'
  | 'status'
  | 'positions'
  | 'risk'
  | 'events'
  | 'pending_orders'
  | 'external_accounts'
  | 'us_portfolio'
  | 'us_positions'
  | 'core_holdings'
  | 'market_indices'
  | 'us_status'
  | 'us_risk';

export interface SSEMessage {
  type: SSEEventType;
  data: any;
}

type SSEListener = (message: SSEMessage) => void;

class SSEClient {
  private listeners: SSEListener[] = [];
  private eventSource: EventSource | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;

  addListener(listener: SSEListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private emit(message: SSEMessage) {
    this.listeners.forEach(l => l(message));
  }

  start(baseUrl: string) {
    this.stop();
    this.isRunning = true;

    if (Platform.OS === 'web') {
      this.startEventSource(baseUrl);
    } else {
      this.startPolling(baseUrl);
    }
  }

  private startEventSource(baseUrl: string) {
    try {
      this.eventSource = new EventSource(`${baseUrl}/api/stream`);

      const eventTypes: SSEEventType[] = [
        'portfolio',
        'status',
        'positions',
        'risk',
        'events',
        'pending_orders',
        'external_accounts',
        'core_holdings',
        'market_indices',
        'us_status',
        'us_risk',
      ];

      eventTypes.forEach(type => {
        this.eventSource!.addEventListener(type, ((event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            this.emit({ type, data });
          } catch (e) {
            console.warn('[SSE] JSON 파싱 실패:', e);
          }
        }) as EventListener);
      });

      this.eventSource.onerror = () => {
        if (this.isRunning) {
          console.warn('[SSE] EventSource 연결 끊김, 재연결 시도...');
          this.eventSource?.close();
          setTimeout(() => {
            if (this.isRunning) this.startEventSource(baseUrl);
          }, SSE_RECONNECT_DELAY_MS);
        }
      };
    } catch (e) {
      console.warn('[SSE] EventSource 시작 실패:', e);
      if (this.isRunning) {
        setTimeout(() => this.startEventSource(baseUrl), SSE_RECONNECT_DELAY_MS);
      }
    }
  }

  private pollCount = 0;

  private startPolling(_baseUrl: string) {
    const poll = async () => {
      if (!this.isRunning) return;
      this.pollCount++;
      try {
        const [portfolio, status, positions, risk, events, pendingOrders] = await Promise.allSettled([
          apiClient.getPortfolio(),
          apiClient.getStatus(),
          apiClient.getPositions(),
          apiClient.getRisk(),
          apiClient.getEvents(),
          apiClient.getPendingOrders(),
        ]);

        if (portfolio.status === 'fulfilled') this.emit({ type: 'portfolio', data: portfolio.value });
        if (status.status === 'fulfilled') this.emit({ type: 'status', data: status.value });
        if (positions.status === 'fulfilled') this.emit({ type: 'positions', data: positions.value });
        if (risk.status === 'fulfilled') this.emit({ type: 'risk', data: risk.value });
        if (events.status === 'fulfilled') this.emit({ type: 'events', data: events.value });
        if (pendingOrders.status === 'fulfilled') this.emit({ type: 'pending_orders', data: pendingOrders.value });

        // 지수는 5회(15초)마다 갱신
        if (this.pollCount % 5 === 0) {
          try {
            const indices = await apiClient.getMarketIndices();
            this.emit({ type: 'market_indices', data: indices });
          } catch (e) {
            console.warn('[SSE] 지수 폴링 실패:', e);
          }
        }

        // 외부 계좌 + US 봇 + 코어홀딩은 10회(30초)마다 갱신
        if (this.pollCount % 10 === 0) {
          try {
            const [accounts, usPortfolio, usPositions, coreHoldings] = await Promise.all([
              apiClient.getExternalAccounts(),
              apiClient.getUSPortfolio(),
              apiClient.getUSPositions(),
              apiClient.getCoreHoldings(),
            ]);
            this.emit({ type: 'external_accounts', data: accounts });
            this.emit({ type: 'us_portfolio', data: usPortfolio });
            this.emit({ type: 'us_positions', data: usPositions });
            this.emit({ type: 'core_holdings', data: coreHoldings });
          } catch (e) {
            console.warn('[SSE] 외부 계좌/US/코어홀딩 폴링 실패:', e);
          }
        }
      } catch (e) {
        console.warn('[SSE] 폴링 실패:', e);
      }
    };

    poll();
    this.pollTimer = setInterval(poll, POLLING_INTERVAL_MS);
  }

  stop() {
    this.isRunning = false;
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
}

export const sseClient = new SSEClient();

export default apiClient;
