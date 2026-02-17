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

  // --- 이벤트 ---

  async getEvents(sinceId?: number): Promise<EventData[]> {
    try { return await this.get('/api/events', sinceId ? { since: sinceId } : undefined); } catch (e) { console.warn('[API] getEvents 실패:', e); return []; }
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
  | 'external_accounts';

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

        // 외부 계좌는 10회(30초)마다 갱신
        if (this.pollCount % 10 === 0) {
          try {
            const accounts = await apiClient.getExternalAccounts();
            this.emit({ type: 'external_accounts', data: accounts });
          } catch (e) {
            console.warn('[SSE] 외부 계좌 폴링 실패:', e);
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
