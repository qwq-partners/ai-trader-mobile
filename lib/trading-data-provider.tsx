import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import { apiClient, sseClient, type SSEMessage } from '@/lib/api-client';
import type {
  PortfolioData, StatusData, PositionData, RiskData,
  TradeData, EventData, PendingOrder, ExternalAccount,
} from '@/lib/api-client';
import {
  DEMO_PORTFOLIO, DEMO_STATUS, DEMO_POSITIONS, DEMO_EVENTS,
  DEMO_RISK, DEMO_TRADES, DEMO_PENDING_ORDERS,
} from '@/lib/demo-data';

// --- State ---
export interface TradingState {
  // 연결
  connected: boolean;
  connecting: boolean;
  isDemo: boolean;
  serverUrl: string;
  lastError: string | null;
  lastUpdated: Date | null;

  // 실시간 데이터 (SSE)
  portfolio: PortfolioData | null;
  status: StatusData | null;
  positions: PositionData[];
  risk: RiskData | null;
  events: EventData[];
  pendingOrders: PendingOrder[];
  externalAccounts: ExternalAccount[];

  // REST 데이터
  todayTrades: TradeData[];
}

const initialState: TradingState = {
  connected: false,
  connecting: false,
  isDemo: true,
  serverUrl: 'https://qwq.ai.kr',
  lastError: null,
  lastUpdated: null,
  portfolio: null,
  status: null,
  positions: [],
  risk: null,
  events: [],
  pendingOrders: [],
  externalAccounts: [],
  todayTrades: [],
};

// --- Actions ---
type TradingAction =
  | { type: 'SET_SERVER_URL'; url: string }
  | { type: 'SET_CONNECTING' }
  | { type: 'SET_CONNECTED'; portfolio: PortfolioData; status: StatusData; positions: PositionData[]; risk: RiskData; todayTrades: TradeData[] }
  | { type: 'SET_DISCONNECTED'; error?: string }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'UPDATE_PORTFOLIO'; data: PortfolioData }
  | { type: 'UPDATE_STATUS'; data: StatusData }
  | { type: 'UPDATE_POSITIONS'; data: PositionData[] }
  | { type: 'UPDATE_RISK'; data: RiskData }
  | { type: 'UPDATE_EVENTS'; data: EventData[] }
  | { type: 'UPDATE_PENDING_ORDERS'; data: PendingOrder[] }
  | { type: 'UPDATE_EXTERNAL_ACCOUNTS'; data: ExternalAccount[] }
  | { type: 'UPDATE_TODAY_TRADES'; data: TradeData[] }
  | { type: 'SET_DEMO_MODE'; isDemo: boolean }
  | { type: 'RESET' };

function tradingReducer(state: TradingState, action: TradingAction): TradingState {
  switch (action.type) {
    case 'SET_SERVER_URL':
      return { ...state, serverUrl: action.url };
    case 'SET_CONNECTING':
      return { ...state, connecting: true, lastError: null };
    case 'SET_CONNECTED':
      return {
        ...state,
        connected: true,
        connecting: false,
        isDemo: false,
        lastError: null,
        lastUpdated: new Date(),
        portfolio: action.portfolio,
        status: action.status,
        positions: action.positions,
        risk: action.risk,
        todayTrades: action.todayTrades,
      };
    case 'SET_DISCONNECTED':
      return {
        ...state,
        connected: false,
        connecting: false,
        isDemo: true,
        lastError: action.error || null,
      };
    case 'SET_ERROR':
      return { ...state, lastError: action.error, connecting: false };
    case 'UPDATE_PORTFOLIO':
      return { ...state, portfolio: action.data, lastUpdated: new Date() };
    case 'UPDATE_STATUS':
      return { ...state, status: action.data, lastUpdated: new Date() };
    case 'UPDATE_POSITIONS':
      return { ...state, positions: action.data, lastUpdated: new Date() };
    case 'UPDATE_RISK':
      return { ...state, risk: action.data, lastUpdated: new Date() };
    case 'UPDATE_EVENTS':
      return { ...state, events: action.data.slice(0, 50), lastUpdated: new Date() };
    case 'UPDATE_PENDING_ORDERS':
      return { ...state, pendingOrders: action.data, lastUpdated: new Date() };
    case 'UPDATE_EXTERNAL_ACCOUNTS':
      return { ...state, externalAccounts: action.data, lastUpdated: new Date() };
    case 'UPDATE_TODAY_TRADES':
      return { ...state, todayTrades: action.data };
    case 'SET_DEMO_MODE':
      return { ...state, isDemo: action.isDemo, connected: !action.isDemo };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// --- Context ---
interface TradingContextType {
  state: TradingState;
  connect: (url?: string) => Promise<void>;
  disconnect: () => void;
  refresh: () => Promise<void>;
  setDemoMode: (isDemo: boolean) => void;
}

const TradingContext = createContext<TradingContextType | null>(null);

// --- Provider ---
export function TradingDataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(tradingReducer, initialState);
  const sseUnsubRef = useRef<(() => void) | null>(null);

  const handleSSEMessage = useCallback((msg: SSEMessage) => {
    switch (msg.type) {
      case 'portfolio':
        dispatch({ type: 'UPDATE_PORTFOLIO', data: msg.data });
        break;
      case 'status':
        dispatch({ type: 'UPDATE_STATUS', data: msg.data });
        break;
      case 'positions':
        dispatch({ type: 'UPDATE_POSITIONS', data: Array.isArray(msg.data) ? msg.data : [] });
        break;
      case 'risk':
        dispatch({ type: 'UPDATE_RISK', data: msg.data });
        break;
      case 'events':
        dispatch({ type: 'UPDATE_EVENTS', data: Array.isArray(msg.data) ? msg.data : [] });
        break;
      case 'pending_orders':
        dispatch({ type: 'UPDATE_PENDING_ORDERS', data: Array.isArray(msg.data) ? msg.data : [] });
        break;
      case 'external_accounts':
        dispatch({ type: 'UPDATE_EXTERNAL_ACCOUNTS', data: Array.isArray(msg.data) ? msg.data : [] });
        break;
    }
  }, []);

  const connect = useCallback(async (url?: string) => {
    dispatch({ type: 'SET_CONNECTING' });

    try {
      if (url) {
        await apiClient.setServerUrl(url);
        dispatch({ type: 'SET_SERVER_URL', url });
      }

      const [portfolio, status, positions, risk, todayTrades] = await Promise.all([
        apiClient.getPortfolio(),
        apiClient.getStatus(),
        apiClient.getPositions(),
        apiClient.getRisk(),
        apiClient.getTodayTrades(),
      ]);

      dispatch({
        type: 'SET_CONNECTED',
        portfolio, status, positions, risk, todayTrades,
      });

      // Start SSE
      sseUnsubRef.current?.();
      sseUnsubRef.current = sseClient.addListener(handleSSEMessage);
      sseClient.start(apiClient.getServerUrl());
    } catch (err: any) {
      dispatch({
        type: 'SET_DISCONNECTED',
        error: err?.message || '서버 연결 실패',
      });
    }
  }, [handleSSEMessage]);

  const disconnect = useCallback(() => {
    sseClient.stop();
    sseUnsubRef.current?.();
    sseUnsubRef.current = null;
    dispatch({ type: 'SET_DISCONNECTED' });
  }, []);

  const refresh = useCallback(async () => {
    if (!state.connected) return;
    try {
      const [portfolio, status, positions, risk, todayTrades] = await Promise.all([
        apiClient.getPortfolio(),
        apiClient.getStatus(),
        apiClient.getPositions(),
        apiClient.getRisk(),
        apiClient.getTodayTrades(),
      ]);
      dispatch({ type: 'UPDATE_PORTFOLIO', data: portfolio });
      dispatch({ type: 'UPDATE_STATUS', data: status });
      dispatch({ type: 'UPDATE_POSITIONS', data: positions });
      dispatch({ type: 'UPDATE_RISK', data: risk });
      dispatch({ type: 'UPDATE_TODAY_TRADES', data: todayTrades });
    } catch {}
  }, [state.connected]);

  const setDemoMode = useCallback((isDemo: boolean) => {
    if (isDemo) {
      sseClient.stop();
      sseUnsubRef.current?.();
      sseUnsubRef.current = null;
    }
    dispatch({ type: 'SET_DEMO_MODE', isDemo });
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    (async () => {
      const url = await apiClient.loadServerUrl();
      dispatch({ type: 'SET_SERVER_URL', url });
      // Try to connect on startup
      try {
        const result = await apiClient.testConnection();
        if (result.connected) {
          await connect();
        }
      } catch {}
    })();
    return () => {
      sseClient.stop();
      sseUnsubRef.current?.();
    };
  }, []);

  const value: TradingContextType = {
    state,
    connect,
    disconnect,
    refresh,
    setDemoMode,
  };

  return (
    <TradingContext.Provider value={value}>
      {children}
    </TradingContext.Provider>
  );
}

// --- Hook ---
export function useTradingData(): TradingContextType {
  const ctx = useContext(TradingContext);
  if (!ctx) throw new Error('useTradingData must be used within TradingDataProvider');
  return ctx;
}

// --- Demo data helpers ---
export function getDemoPortfolio(): PortfolioData { return DEMO_PORTFOLIO; }
export function getDemoStatus(): StatusData { return DEMO_STATUS; }
export function getDemoPositions(): PositionData[] { return DEMO_POSITIONS; }
export function getDemoEvents(): EventData[] { return DEMO_EVENTS; }
export function getDemoRisk(): RiskData { return DEMO_RISK; }
export function getDemoTrades(): TradeData[] { return DEMO_TRADES; }
export function getDemoPendingOrders(): PendingOrder[] { return DEMO_PENDING_ORDERS; }
