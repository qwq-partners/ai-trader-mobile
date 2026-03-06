# Changelog

## 2026-03-06
### feat: 모바일 앱 KR/US 통합 환경 (US 포지션/거래내역 추가)
- **수정 파일**: `lib/api-client.ts`, `lib/trading-data-provider.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/trades.tsx`
- `api-client.ts`: USPortfolioData, USPositionData, USTradeData 타입 추가 + getUSPortfolio/getUSPositions/getUSTrades 메서드 추가
- `trading-data-provider.tsx`: TradingState에 usPortfolio/usPositions 추가, connect/refresh/polling에서 US 데이터 fetch
- `index.tsx`: USPositionsSection을 US 봇 API 기반으로 전환 (portfolio/positions props, stage 배지, 전략 배지)
- `trades.tsx`: KR/US 마켓 탭 추가, US 모드에서 getUSTrades 호출 후 TradeEventData로 변환, 가격 표시 formatUSD 적용
