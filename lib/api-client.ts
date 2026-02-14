import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// =============================================================================
// Type Definitions (서버 응답 1:1 매칭)
// =============================================================================

// --- 기본 타입 ---

export interface PortfolioData {
  total_equity: number;
  cash_balance: number;
  invested_amount: number;
  total_pnl: number;
  total_pnl_pct: number;
  daily_pnl: number;
  daily_pnl_pct: number;
  initial_capital: number;
  position_count: number;
}

export interface StatusData {
  status: string; // running, stopped, etc.
  market_session: string;
  uptime_seconds: number;
  event_count: number;
  ws_connected: boolean;
  trading_enabled: boolean;
  start_time: string;
}

export interface PositionData {
  symbol: string;
  name: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
  market_value: number;
  weight: number;
  strategy: string;
  entry_date: string;
  exit_state?: string;
  trailing_high?: number;
  stop_loss_pct?: number;
  exit_stages_completed?: number[];
}

export interface TradeData {
  symbol: string;
  name: string;
  side: 'buy' | 'sell';
  strategy: string;
  quantity: number;
  price: number;
  amount: number;
  pnl?: number;
  pnl_pct?: number;
  reason?: string;
  entry_reason?: string;
  exit_reason?: string;
  hold_time?: string;
  timestamp: string;
  entry_price?: number;
  exit_price?: number;
}

export interface TradeStats {
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  total_pnl: number;
  avg_pnl: number;
  avg_pnl_pct: number;
  profit_factor: number;
  max_drawdown: number;
  avg_hold_time: string;
  by_strategy: Record<string, {
    total: number;
    wins: number;
    losses: number;
    win_rate: number;
    total_pnl: number;
    avg_pnl: number;
  }>;
}

export interface RiskData {
  daily_pnl: number;
  daily_pnl_pct: number;
  daily_loss_limit: number;
  daily_loss_limit_pct: number;
  position_count: number;
  max_positions: number;
  cash_ratio: number;
  trading_enabled: boolean;
  consecutive_losses: number;
}

export interface ThemeData {
  theme: string;
  score: number;
  keywords: string[];
  stocks: string[];
  detected_at: string;
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
  total_evolutions: number;
  successful: number;
  rolled_back: number;
  last_evolution_date: string;
  pending_changes: any[];
  active_changes: any[];
}

export interface EvolutionHistoryItem {
  date: string;
  strategy: string;
  parameter: string;
  old_value: any;
  new_value: any;
  reason: string;
  confidence: number;
  effect?: string; // positive, negative, neutral
  status: string; // applied, rolled_back, pending
}

export interface EquitySnapshot {
  date: string;
  total_equity: number;
  cash_balance: number;
  invested_amount: number;
  daily_pnl: number;
  daily_pnl_pct: number;
  trade_count: number;
  positions: number;
}

export interface EquityHistoryResponse {
  snapshots: EquitySnapshot[];
  summary: {
    period_return_pct: number;
    max_drawdown_pct: number;
    avg_daily_pnl: number;
    data_days: number;
    start_equity: number;
    end_equity: number;
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
  summary: {
    total_trades: number;
    win_rate: number;
    total_pnl: number;
    profit_loss_ratio: number;
    llm_grade: string; // A ~ F
  };
  trades: Array<{
    symbol: string;
    name: string;
    strategy: string;
    pnl: number;
    pnl_pct: number;
    entry_reason: string;
    exit_reason: string;
    llm_analysis: string;
  }>;
  llm_analysis: {
    insights: string[];
    avoid_patterns: string[];
    focus_opportunities: string[];
    overall_assessment: string;
  };
  parameter_recommendations: Array<{
    strategy: string;
    parameter: string;
    current_value: any;
    suggested_value: any;
    confidence: number;
    reason: string;
  }>;
}

export interface ScreeningItem {
  symbol: string;
  name: string;
  score: number;
  price: number;
  change_pct: number;
  volume_ratio: number;
  strategy: string;
}

export interface HealthCheck {
  name: string;
  status: string; // ok, warning, error
  message: string;
  last_check: string;
}

export interface PendingOrder {
  symbol: string;
  name: string;
  side: string;
  order_type: string;
  quantity: number;
  price: number;
  status: string;
  submitted_at: string;
  elapsed_seconds: number;
}

export interface ExternalAccount {
  account_name: string;
  total_equity: number;
  total_pnl: number;
  total_pnl_pct: number;
  positions: Array<{
    symbol: string;
    name: string;
    quantity: number;
    avg_price: number;
    current_price: number;
    pnl: number;
    pnl_pct: number;
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

const STORAGE_KEY_SERVER_URL = '@ai_trader_server_url';
const DEFAULT_SERVER_URL = 'https://qwq.ai.kr';
const API_TIMEOUT_MS = 10000;

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
    } catch {
      // AsyncStorage 접근 실패 시 기본값 유지
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
    try { return await this.get('/api/positions'); } catch { return []; }
  }

  async getRisk(): Promise<RiskData> {
    return this.get('/api/risk');
  }

  // --- 거래 ---

  async getTodayTrades(): Promise<TradeData[]> {
    try { return await this.get('/api/trades/today'); } catch { return []; }
  }

  async getTrades(date: string): Promise<TradeData[]> {
    try { return await this.get('/api/trades', { date }); } catch { return []; }
  }

  async getTradeStats(days: number = 30): Promise<TradeStats> {
    return this.get('/api/trades/stats', { days });
  }

  // --- 테마/스크리닝 ---

  async getThemes(): Promise<ThemeData[]> {
    try { return await this.get('/api/themes'); } catch { return []; }
  }

  async getScreening(): Promise<ScreeningItem[]> {
    try { return await this.get('/api/screening'); } catch { return []; }
  }

  // --- 설정/진화 ---

  async getConfig(): Promise<ConfigData> {
    return this.get('/api/config');
  }

  async getEvolution(): Promise<EvolutionData> {
    return this.get('/api/evolution');
  }

  async getEvolutionHistory(): Promise<EvolutionHistoryItem[]> {
    try { return await this.get('/api/evolution/history'); } catch { return []; }
  }

  async applyEvolution(body: { strategy: string; parameter: string; new_value: any }): Promise<{ success: boolean; message: string }> {
    return this.post('/api/evolution/apply', body);
  }

  // --- 자산 히스토리 ---

  async getEquityCurve(days: number = 30): Promise<EquityCurvePoint[]> {
    try { return await this.get('/api/equity-curve', { days }); } catch { return []; }
  }

  async getEquityHistory(days: number = 30): Promise<EquityHistoryResponse> {
    return this.get('/api/equity-history', { days });
  }

  async getEquityHistoryRange(from: string, to: string): Promise<EquityHistoryResponse> {
    return this.get('/api/equity-history', { from, to });
  }

  async getEquityPositions(date: string): Promise<PositionSnapshot[]> {
    try { return await this.get('/api/equity-history/positions', { date }); } catch { return []; }
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
    try { return await this.get('/api/health-checks'); } catch { return []; }
  }

  async getPendingOrders(): Promise<PendingOrder[]> {
    try { return await this.get('/api/orders/pending'); } catch { return []; }
  }

  async getOrderHistory(): Promise<OrderEvent[]> {
    try { return await this.get('/api/orders/history'); } catch { return []; }
  }

  // --- 외부 계좌 ---

  async getExternalAccounts(): Promise<ExternalAccount[]> {
    try { return await this.get('/api/accounts/positions'); } catch { return []; }
  }

  // --- 이벤트 ---

  async getEvents(sinceId?: number): Promise<EventData[]> {
    try { return await this.get('/api/events', sinceId ? { since: sinceId } : undefined); } catch { return []; }
  }

  // --- 연결 테스트 ---

  async testConnection(): Promise<{ connected: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      await this.getStatus();
      return { connected: true, latencyMs: Date.now() - start };
    } catch {
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
          } catch {
            // JSON 파싱 실패 무시
          }
        }) as EventListener);
      });

      this.eventSource.onerror = () => {
        if (this.isRunning) {
          this.eventSource?.close();
          setTimeout(() => {
            if (this.isRunning) this.startEventSource(baseUrl);
          }, 5000);
        }
      };
    } catch {
      if (this.isRunning) {
        setTimeout(() => this.startEventSource(baseUrl), 5000);
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
          } catch {}
        }
      } catch {
        // 폴링 실패 무시 — 다음 주기에 재시도
      }
    };

    poll();
    this.pollTimer = setInterval(poll, 3000);
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
