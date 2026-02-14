export const DEFAULT_SERVER_URL = 'https://qwq.ai.kr';
export const API_TIMEOUT_MS = 10000;
export const SSE_RECONNECT_DELAY_MS = 5000;
export const POLLING_INTERVAL_MS = 3000;
export const EXTERNAL_ACCOUNTS_INTERVAL_MS = 30000;

export const STORAGE_KEYS = {
  SERVER_URL: '@ai_trader_server_url',
  NOTIFICATION_SETTINGS: '@ai_trader_notifications',
  DEMO_MODE: '@ai_trader_demo_mode',
} as const;

export const TAB_NAMES = {
  REALTIME: '실시간',
  TRADES: '거래',
  PERFORMANCE: '성과',
  REVIEW: '리뷰',
  SETTINGS: '설정',
} as const;

export const INITIAL_CAPITAL = 10_000_000;
