# Changelog

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
