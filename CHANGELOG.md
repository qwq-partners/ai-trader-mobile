# Changelog

## 2026-04-18 — v1.5.0 (UI/UX 전면 개선)

### feat: 포지션 카드 Projection + 전략 특수 배지
- **PositionCard**: 청산단계 projection 미니바 신설
  - SL ~ 다음 TP 구간 내 현재 위치 시각화 (pnl 컬러)
  - "SL +X%p / TP1 -X%p" 라벨 — 근접 시 자동 경고색
  - 웹 대시보드 `renderStageProjection()`과 동일 로직
- **STRATEGY_BADGE** 신설 (4종):
  - 코어 (SL -15%, 트레일링 8%, 분할익절 미사용)
  - 테마 (최대 3일 보유, 14:00 이후 신규 차단)
  - 갭 (09:20~10:30 한정, VWAP 이탈 시 청산)
  - RSI2 (bear 체제 차단, ATR×2 손절)
- **STRATEGY_LABELS** 보완: rsi2_reversal/strategic_swing/core_holding 추가
- **EXIT_STATE_COLORS**에 first/second/third 단계 추가 (웹 동등)

### feat: 일일손실 게이지 임계값 웹과 통일
- **RiskGauge**:
  - 임계값 50/80 → **60/90%** (웹 대시보드와 동일 — initial_capital 분모 기준)
  - 일일 손실 텍스트 색상 단계 (-3%/-4.5%)
  - `accessibilityRole="progressbar"` + `accessibilityValue` 추가

### fix: NaN 가드
- `unrealized_pnl_net` 에 `isFinite` 체크 추가 — 백엔드 스키마 변경 시 UI 깨짐 방지

### 엔진 측 동반 개선 (qwq-ai-trader 커밋 925cdb0 + ddb0a41)
- 일일 손실 % 분모 `initial_capital`로 통일 — 앱 표시값과 엔진 차단 기준 일치
- RSI2 bear 체제 진입 차단 (Connors 원전 규칙)
- `strategy_allocation` rsi2 40→25, sepa 10→25 과적합 롤백

### 빌드
- Expo SDK 54.0.33 / React Native 0.81.5 / versionCode 6→7

---

## 2026-03-26
### feat: 정산 탭 + 테마 탭 신규 추가
- **settlement.tsx**: 일일 정산 탭 신규 — 날짜 선택, 요약 카드(실현/미실현/총손익/승패), 매도/매수 체결 목록, 보유종목 현황
- **themes.tsx**: 테마 탭 신규 — KR/US 마켓 필터, KR 테마 카드(키워드/관련종목/뉴스), KR 스크리닝 목록, US 테마 카드, pull-to-refresh
- **api-client.ts**: DailySettlementData, ThemeDetailData, USThemeData, USScreeningItem 타입 추가 + getDailySettlement/getUSThemes/getUSScreening 메서드 추가
- **_layout.tsx**: 정산/테마 탭 추가 (거래↔성과 사이)

### feat: 대시보드 신기능 동기화 (Core Holdings + 지수 전광판)
- **api-client.ts**: CoreHoldingPosition/CoreHoldingsData/MarketIndexItem 타입 추가, getCoreHoldings/getMarketIndices 메서드 추가, SSE 이벤트 core_holdings/market_indices/us_status/us_risk 추가
- **index.tsx**: MarketIndicesBar 컴포넌트 추가 (KOSPI/KOSDAQ/S&P500/NASDAQ 실시간 전광판), CoreHoldingsSection 컴포넌트 추가 (코어홀딩 포지션 표시, 황금색 CORE 배지)
- **SSE 폴링 업데이트**: core_holdings 30초마다, market_indices 15초마다 폴링

## 2026-03-06
### feat: 모바일 앱 KR/US 통합 환경 (US 포지션/거래내역 추가)
- **수정 파일**: `lib/api-client.ts`, `lib/trading-data-provider.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/trades.tsx`
- `api-client.ts`: USPortfolioData, USPositionData, USTradeData 타입 추가 + getUSPortfolio/getUSPositions/getUSTrades 메서드 추가
- `trading-data-provider.tsx`: TradingState에 usPortfolio/usPositions 추가, connect/refresh/polling에서 US 데이터 fetch
- `index.tsx`: USPositionsSection을 US 봇 API 기반으로 전환 (portfolio/positions props, stage 배지, 전략 배지)
- `trades.tsx`: KR/US 마켓 탭 추가, US 모드에서 getUSTrades 호출 후 TradeEventData로 변환, 가격 표시 formatUSD 적용
