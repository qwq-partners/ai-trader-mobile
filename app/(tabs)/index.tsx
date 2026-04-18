import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { useTradingData, getDemoPortfolio, getDemoStatus, getDemoPositions, getDemoEvents, getDemoRisk, getDemoPendingOrders } from '@/lib/trading-data-provider';
import { apiClient, sseClient } from '@/lib/api-client';
import type { ThemeData, ScreeningItem, PositionData, EventData, PendingOrder, ExternalAccount, OverseasData, PortfolioData, RiskData, StatusData, USPortfolioData, USPositionData, CoreHoldingsData, MarketIndexItem } from '@/lib/api-client';
import { DEMO_THEMES, DEMO_SCREENING, formatKRW, formatUSD, formatPct, formatPrice, formatTime } from '@/lib/demo-data';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useRouter } from 'expo-router';
import type { ThemeColors } from '@/constants/theme';

// =============================================================================
// 섹션 컴포넌트
// =============================================================================

function DemoBadge({ colors }: { colors: ThemeColors }) {
  return (
    <View style={{
      alignSelf: 'flex-start',
      marginLeft: 16,
      marginTop: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: 'rgba(251,191,36,0.15)',
      borderWidth: 1,
      borderColor: colors.warning,
    }}>
      <Text style={{ color: colors.warning, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
        DEMO
      </Text>
    </View>
  );
}

function PortfolioHero({ portfolio, colors }: { portfolio: PortfolioData | null; colors: ThemeColors }) {
  if (!portfolio) return null;

  const totalEquity = portfolio.total_equity;
  const dailyPnl = portfolio.daily_pnl;
  const dailyPnlPct = portfolio.daily_pnl_pct;
  const realizedDaily = portfolio.realized_daily_pnl ?? 0;
  const unrealizedNet = portfolio.unrealized_pnl_net ?? portfolio.unrealized_pnl;
  const cashBalance = portfolio.cash;
  const investedAmount = portfolio.total_position_value;
  const totalAmount = cashBalance + investedAmount;
  const cashPct = totalAmount > 0 ? Math.round((cashBalance / totalAmount) * 100) : 0;
  const investPct = 100 - cashPct;
  const pnlColor = dailyPnl >= 0 ? colors.profit : colors.loss;

  return (
    <View style={{
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 12,
      marginTop: 12,
    }}>
      <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 4 }}>
        총 자산
      </Text>
      <Text style={{ color: colors.foreground, fontSize: 28, fontWeight: 'bold' }}>
        {formatKRW(totalEquity)}
      </Text>

      {/* 당일 손익 (당일 기준 실효) */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        backgroundColor: dailyPnl >= 0 ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        alignSelf: 'flex-start',
      }}>
        <Text style={{ color: pnlColor, fontSize: 18, fontWeight: '700' }}>
          {dailyPnl >= 0 ? '+' : ''}{formatKRW(dailyPnl)}
        </Text>
        <Text style={{ color: pnlColor, fontSize: 15, fontWeight: '600', marginLeft: 6 }}>
          ({formatPct(dailyPnlPct)})
        </Text>
      </View>

      {/* 실현 / 미실현(수수료후) 분해 */}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: colors.muted, fontSize: 11 }}>실현  </Text>
          <Text style={{
            color: realizedDaily >= 0 ? colors.profit : colors.loss,
            fontSize: 11, fontWeight: '600',
          }}>
            {realizedDaily >= 0 ? '+' : ''}{formatKRW(realizedDaily)}
          </Text>
        </View>
        <Text style={{ color: colors.muted, fontSize: 11 }}>·</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: colors.muted, fontSize: 11 }}>미실현(순)  </Text>
          <Text style={{
            color: unrealizedNet >= 0 ? colors.profit : colors.loss,
            fontSize: 11, fontWeight: '600',
          }}>
            {unrealizedNet >= 0 ? '+' : ''}{formatKRW(unrealizedNet)}
          </Text>
        </View>
      </View>

      {/* 현금/투자 비율 바 */}
      <View style={{ marginTop: 14 }}>
        <View style={{
          flexDirection: 'row',
          height: 6,
          borderRadius: 3,
          overflow: 'hidden',
          backgroundColor: colors.elevated,
        }}>
          <View style={{
            flex: cashPct,
            backgroundColor: colors.info,
            borderRadius: 3,
          }} />
          <View style={{
            flex: investPct,
            backgroundColor: colors.primary,
          }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
          <Text style={{ color: colors.muted, fontSize: 11 }}>
            현금 {cashPct}% ({formatKRW(cashBalance)})
          </Text>
          <Text style={{ color: colors.muted, fontSize: 11 }}>
            투자 {investPct}% ({formatKRW(investedAmount)})
          </Text>
        </View>
      </View>
    </View>
  );
}

function RiskGauge({ risk, status, colors }: { risk: RiskData | null; status: StatusData | null; colors: ThemeColors }) {
  if (!risk || !status) return null;

  // 일일 손실 한도 사용률 — initial_capital 분모 기준 (2026-04-18 엔진 일치)
  const dailyUsedPct = risk.daily_loss_limit_pct !== 0
    ? Math.min(100, Math.max(0, Math.abs(risk.daily_loss_pct / risk.daily_loss_limit_pct) * 100))
    : 0;
  const canTrade = risk.can_trade && status.running && !status.engine?.paused;
  const tradingColor = canTrade ? colors.success : colors.error;
  const tradingText = canTrade ? '거래가능' : '중단';
  // 웹 대시보드와 임계값 통일: >90% 빨강, >60% 주황, 그 외 초록
  const gaugeColor = dailyUsedPct > 90 ? colors.error : dailyUsedPct > 60 ? colors.warning : colors.success;
  const lossTextColor = risk.daily_loss_pct <= -4.5 ? colors.error
    : risk.daily_loss_pct <= -3.0 ? colors.warning
    : colors.foreground;

  return (
    <View style={{
      flexDirection: 'row',
      gap: 8,
      marginHorizontal: 16,
      marginBottom: 12,
    }}>
      {/* 일일손실 */}
      <View style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 12,
      }}>
        <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>일일손실</Text>
        <Text style={{ color: lossTextColor, fontSize: 13, fontWeight: '600' }}>
          {formatPct(risk.daily_loss_pct)} / {formatPct(risk.daily_loss_limit_pct, false)}
        </Text>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel="일일 손실 한도 사용률"
          accessibilityValue={{ min: 0, max: 100, now: Math.round(dailyUsedPct) }}
          style={{
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.elevated,
            marginTop: 6,
          }}
        >
          <View style={{
            height: 4,
            borderRadius: 2,
            backgroundColor: gaugeColor,
            width: `${Math.min(dailyUsedPct, 100)}%` as any,
          }} />
        </View>
      </View>

      {/* 포지션 수 */}
      <View style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 12,
      }}>
        <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>포지션</Text>
        <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600' }}>
          {risk.position_count}개
        </Text>
      </View>

      {/* 상태 */}
      <View style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 12,
      }}>
        <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>상태</Text>
        <Text style={{ color: tradingColor, fontSize: 13, fontWeight: '600' }}>
          {tradingText}
        </Text>
      </View>
    </View>
  );
}

const EXIT_STATE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  none: { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', label: '대기' },
  monitoring: { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', label: '모니터링' },
  breakeven: { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa', label: '본전이동' },
  trailing: { bg: 'rgba(52,211,153,0.15)', text: '#34d399', label: '트레일링' },
  first: { bg: 'rgba(52,211,153,0.15)', text: '#34d399', label: '1차익절' },
  second: { bg: 'rgba(52,211,153,0.18)', text: '#34d399', label: '2차익절' },
  third: { bg: 'rgba(52,211,153,0.22)', text: '#34d399', label: '3차익절' },
  first_exit: { bg: 'rgba(167,139,250,0.15)', text: '#a78bfa', label: '1차익절' },
};

const STRATEGY_LABELS: Record<string, string> = {
  momentum_breakout: '모멘텀',
  sepa_trend: 'SEPA',
  theme_chasing: '테마',
  gap_and_go: '갭상승',
  rsi2_reversal: 'RSI2',
  strategic_swing: '스윙',
  core_holding: '코어',
};

// 전략별 특수 뱃지 (웹 대시보드와 동등)
const STRATEGY_BADGE: Record<string, { label: string; fg: string; bg: string; border: string; title: string }> = {
  core_holding:   { label: '코어', fg: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.35)', title: '코어홀딩: SL -15%, 트레일링 8%, 분할익절 미사용' },
  theme_chasing:  { label: '테마', fg: '#f0abfc', bg: 'rgba(240,171,252,0.10)', border: 'rgba(240,171,252,0.35)', title: '테마추종: 최대 3일 보유, 14:00 이후 신규진입 차단' },
  gap_and_go:     { label: '갭',   fg: '#22d3ee', bg: 'rgba(34,211,238,0.08)',  border: 'rgba(34,211,238,0.30)', title: '갭상승: 09:20~10:30 한정, VWAP 이탈 시 청산' },
  rsi2_reversal:  { label: 'RSI2', fg: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.30)', title: 'RSI(2) 과매도 반전: bear 체제 차단, ATR×2 손절' },
};

/** 다음 TP / SL 거리 계산 — 웹 renderStageProjection과 동등 */
function getStageProjection(position: PositionData, netPct: number) {
  const isCore = position.strategy === 'core_holding';
  const stage = position.exit_state?.stage || 'none';
  const es = position.exit_state || {};
  const tp1 = (es as any).first_exit_pct ?? 5.0;
  const tp2 = (es as any).second_exit_pct ?? 15.0;
  const tp3 = (es as any).third_exit_pct ?? 25.0;
  const sl  = -((es as any).stop_loss_pct ?? (isCore ? 15.0 : 5.0));
  let nextLabel = 'TP1', nextPct = tp1;
  if (stage === 'first')  { nextLabel = 'TP2'; nextPct = tp2; }
  else if (stage === 'second') { nextLabel = 'TP3'; nextPct = tp3; }
  else if (stage === 'third' || stage === 'trailing') { nextLabel = 'TRAIL'; nextPct = tp3; }
  const toTp = nextPct - netPct;
  const toSl = netPct - sl;
  const range = nextPct - sl;
  const fillPct = range > 0 ? Math.max(0, Math.min(100, ((netPct - sl) / range) * 100)) : 50;
  return { nextLabel, nextPct, sl, toTp, toSl, fillPct };
}

function PositionCard({ position, onPress, colors }: { position: PositionData; onPress: () => void; colors: ThemeColors }) {
  // 수수료 포함 순손익 + NaN 가드 (웹 P0-4 동등)
  const _rawPnl = position.unrealized_pnl_net ?? position.unrealized_pnl;
  const _rawPct = position.unrealized_pnl_net_pct ?? position.unrealized_pnl_pct;
  const netPnl = (typeof _rawPnl === 'number' && isFinite(_rawPnl)) ? _rawPnl : 0;
  const netPct = (typeof _rawPct === 'number' && isFinite(_rawPct)) ? _rawPct : 0;
  const pnlColor = netPnl >= 0 ? colors.profit : colors.loss;
  const exitStage = position.exit_state?.stage || 'none';
  const exitState = EXIT_STATE_COLORS[exitStage] || EXIT_STATE_COLORS.none;

  // 전략 특수 뱃지 (웹 동등)
  const stratBadge = STRATEGY_BADGE[position.strategy || ''];

  // 청산단계 projection (P0-1 + Impact1)
  const proj = getStageProjection(position, netPct);
  const slClose = proj.toSl < 1.0;
  const tpClose = proj.toTp < 1.0 && proj.toTp > -1.0;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        marginHorizontal: 16,
        marginBottom: 8,
        flexDirection: 'row',
        overflow: 'hidden',
      }}
    >
      {/* 좌측 수익률 컬러바 */}
      <View style={{
        width: 5,
        backgroundColor: pnlColor,
      }} />

      <View style={{ flex: 1, padding: 16 }}>
        {/* 상단: 종목명 + 수익률 */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12, flexWrap: 'wrap' }}>
            <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '700' }}>
              {position.name}
            </Text>
            {/* 전략 특수 뱃지 (코어/테마/갭/RSI2) — 웹과 동등 */}
            {stratBadge && (
              <View style={{
                marginLeft: 6,
                paddingHorizontal: 5,
                paddingVertical: 1,
                borderRadius: 3,
                backgroundColor: stratBadge.bg,
                borderWidth: 1,
                borderColor: stratBadge.border,
              }}>
                <Text style={{ color: stratBadge.fg, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>
                  {stratBadge.label}
                </Text>
              </View>
            )}
            <View style={{
              marginLeft: 6,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
              backgroundColor: colors.elevated,
            }}>
              <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '600' }}>
                {STRATEGY_LABELS[position.strategy || ''] || position.strategy || '-'}
              </Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            {/* 수수료 포함 순손익률 (메인 표시) */}
            <Text style={{ color: pnlColor, fontSize: 17, fontWeight: '800' }}>
              {formatPct(netPct)}
            </Text>
            <Text style={{ color: pnlColor, fontSize: 12, marginTop: 2 }}>
              {netPnl >= 0 ? '+' : ''}{formatKRW(netPnl)}
            </Text>
            {/* 수수료 전 평가손익 (보조 표시) */}
            <Text style={{ color: colors.muted, fontSize: 10, marginTop: 1 }}>
              평가 {position.unrealized_pnl >= 0 ? '+' : ''}{formatKRW(position.unrealized_pnl)}
            </Text>
          </View>
        </View>

        {/* 하단: 상세 정보 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 12 }}>
          <Text style={{ color: colors.muted, fontSize: 11 }}>
            {formatPrice(position.avg_price)} → {formatPrice(position.current_price)}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 11 }}>
            {position.quantity}주
          </Text>
          <View style={{
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 4,
            backgroundColor: exitState.bg,
          }}>
            <Text style={{ color: exitState.text, fontSize: 10, fontWeight: '600' }}>
              {exitState.label}
            </Text>
          </View>
        </View>

        {/* P0-1 + Impact1: 청산단계 projection 미니바 + SL/TP 거리 */}
        <View style={{ marginTop: 8 }}>
          <View style={{
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.elevated,
            overflow: 'hidden',
          }}>
            <View style={{
              height: 4,
              backgroundColor: pnlColor,
              width: `${proj.fillPct}%` as any,
              borderRadius: 2,
            }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}>
            <Text style={{ fontSize: 10, color: slClose ? colors.error : colors.muted, fontVariant: ['tabular-nums'] }}>
              SL +{proj.toSl.toFixed(1)}%p
            </Text>
            <Text style={{ fontSize: 10, color: tpClose ? colors.success : colors.muted, fontVariant: ['tabular-nums'] }}>
              {proj.toTp >= 0 ? `${proj.nextLabel} -${proj.toTp.toFixed(1)}%p` : `${proj.nextLabel} ✓`}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function PositionCards({ positions, onPress, colors }: {
  positions: PositionData[];
  onPress: (p: PositionData) => void;
  colors: ThemeColors;
}) {
  if (positions.length === 0) {
    return (
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 24,
        marginHorizontal: 16,
        marginBottom: 12,
        alignItems: 'center',
      }}>
        <Text style={{ color: colors.muted, fontSize: 13 }}>보유 포지션 없음</Text>
      </View>
    );
  }

  const sorted = [...positions].sort((a, b) => (b.unrealized_pnl_pct ?? 0) - (a.unrealized_pnl_pct ?? 0));

  return (
    <View style={{ marginBottom: 4 }}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground, marginHorizontal: 16, marginBottom: 10 }}>
        보유 포지션
      </Text>
      {sorted.map((p) => (
        <PositionCard
          key={p.symbol}
          position={p}
          onPress={() => onPress(p)}
          colors={colors}
        />
      ))}
    </View>
  );
}

const US_STRATEGY_LABELS: Record<string, string> = {
  sepa_trend: 'SEPA',
  momentum: '모멘텀',
  momentum_breakout: '모멘텀',
  theme_chasing: '테마',
  gap_and_go: '갭상승',
};

const US_STAGE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  none: { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', label: '대기' },
  monitoring: { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', label: '모니터링' },
  breakeven: { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa', label: '본전이동' },
  trailing: { bg: 'rgba(52,211,153,0.15)', text: '#34d399', label: '트레일링' },
  first_exit: { bg: 'rgba(167,139,250,0.15)', text: '#a78bfa', label: '1차익절' },
};

function USPositionsSection({ positions, portfolio, colors }: {
  positions: USPositionData[];
  portfolio: USPortfolioData | null;
  colors: ThemeColors;
}) {
  const totalValue = portfolio?.total_value ?? 0;
  const cash = portfolio?.cash ?? 0;
  const dailyPnl = portfolio?.daily_pnl ?? 0;
  const dailyPnlPct = portfolio?.daily_pnl_pct ?? 0;
  const pnlColor = dailyPnl >= 0 ? colors.profit : colors.loss;

  return (
    <View style={{ marginBottom: 4 }}>
      {/* 헤더 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 10 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground }}>
          US 봇
        </Text>
        {positions.length > 0 && (
          <View style={{
            marginLeft: 8,
            backgroundColor: colors.elevated,
            borderRadius: 10,
            paddingHorizontal: 7,
            paddingVertical: 2,
          }}>
            <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '600' }}>
              {positions.length}
            </Text>
          </View>
        )}
      </View>

      {/* 자산 요약 카드 */}
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        marginHorizontal: 16,
        marginBottom: 8,
        padding: 14,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: colors.muted, fontSize: 11 }}>총자산</Text>
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700', marginTop: 2 }}>
              {formatUSD(totalValue)}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: colors.muted, fontSize: 11 }}>현금</Text>
            <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '600', marginTop: 2 }}>
              {formatUSD(cash)}
            </Text>
          </View>
        </View>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 8,
          backgroundColor: dailyPnl >= 0 ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
          borderRadius: 6,
          paddingHorizontal: 8,
          paddingVertical: 4,
          alignSelf: 'flex-start',
        }}>
          <Text style={{ color: pnlColor, fontSize: 13, fontWeight: '700' }}>
            당일손익 {dailyPnl >= 0 ? '+' : ''}{formatUSD(dailyPnl)}
          </Text>
          <Text style={{ color: pnlColor, fontSize: 12, fontWeight: '600', marginLeft: 4 }}>
            ({formatPct(dailyPnlPct)})
          </Text>
        </View>
      </View>

      {/* 포지션 카드들 */}
      {positions.map((pos) => {
        const posPnlColor = pos.pnl >= 0 ? colors.profit : colors.loss;
        const stageInfo = US_STAGE_COLORS[pos.stage] || US_STAGE_COLORS.none;
        return (
          <View
            key={pos.symbol}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              marginHorizontal: 16,
              marginBottom: 8,
              flexDirection: 'row',
              overflow: 'hidden',
            }}
          >
            <View style={{ width: 5, backgroundColor: posPnlColor }} />
            <View style={{ flex: 1, padding: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                  <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '700' }}>
                    {pos.name}
                  </Text>
                  {pos.strategy && (
                    <View style={{
                      marginLeft: 8,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 4,
                      backgroundColor: colors.elevated,
                    }}>
                      <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '600' }}>
                        {US_STRATEGY_LABELS[pos.strategy] || pos.strategy}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: posPnlColor, fontSize: 17, fontWeight: '800' }}>
                    {formatPct(pos.pnl_pct)}
                  </Text>
                  <Text style={{ color: posPnlColor, fontSize: 12, marginTop: 2 }}>
                    {pos.pnl >= 0 ? '+' : ''}{formatUSD(pos.pnl)}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 12 }}>
                <Text style={{ color: colors.muted, fontSize: 11 }}>
                  ${pos.avg_price.toFixed(2)} → ${pos.current_price.toFixed(2)}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 11 }}>
                  {pos.quantity}주
                </Text>
                <View style={{
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  backgroundColor: stageInfo.bg,
                }}>
                  <Text style={{ color: stageInfo.text, fontSize: 10, fontWeight: '600' }}>
                    {stageInfo.label}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function ExternalAccountsSection({ accounts, colors }: { accounts: ExternalAccount[]; colors: ThemeColors }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={{
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginHorizontal: 16,
      marginBottom: 12,
      overflow: 'hidden',
    }}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setExpanded(!expanded)}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '700' }}>
            외부 계좌
          </Text>
          <View style={{
            marginLeft: 8,
            backgroundColor: colors.elevated,
            borderRadius: 10,
            paddingHorizontal: 7,
            paddingVertical: 2,
          }}>
            <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '600' }}>
              {accounts.length}
            </Text>
          </View>
        </View>
        <Text style={{ color: colors.muted, fontSize: 14 }}>
          {expanded ? '\u25B2' : '\u25BC'}
        </Text>
      </TouchableOpacity>

      {expanded && [...accounts].sort((a, b) => {
        const aPnl = (a.summary?.purchase_amount ?? 0) > 0 ? ((a.summary?.unrealized_pnl ?? 0) / a.summary!.purchase_amount) * 100 : 0;
        const bPnl = (b.summary?.purchase_amount ?? 0) > 0 ? ((b.summary?.unrealized_pnl ?? 0) / b.summary!.purchase_amount) * 100 : 0;
        return bPnl - aPnl;
      }).map((account, idx) => {
        const unrealizedPnl = account.summary?.unrealized_pnl ?? 0;
        const totalEquity = account.summary?.total_equity ?? 0;
        const purchaseAmount = account.summary?.purchase_amount ?? 0;
        const pnlPct = purchaseAmount > 0 ? (unrealizedPnl / purchaseAmount) * 100 : 0;
        const pnlColor = unrealizedPnl >= 0 ? colors.profit : colors.loss;
        return (
          <View key={idx} style={{
            paddingHorizontal: 16,
            paddingBottom: 14,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingTop: 12,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600' }}>
                {account.name}
              </Text>
              <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600' }}>
                {formatKRW(totalEquity)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <Text style={{ color: pnlColor, fontSize: 12 }}>
                {unrealizedPnl >= 0 ? '+' : ''}{formatKRW(unrealizedPnl)} ({formatPct(pnlPct)})
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function PendingOrdersSection({ orders, colors }: { orders: PendingOrder[]; colors: ThemeColors }) {
  return (
    <View style={{
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 12,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '700' }}>
          대기 주문
        </Text>
        <View style={{
          marginLeft: 8,
          backgroundColor: colors.elevated,
          borderRadius: 10,
          paddingHorizontal: 7,
          paddingVertical: 2,
        }}>
          <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '600' }}>
            {orders.length}
          </Text>
        </View>
      </View>

      {orders.map((order, idx) => {
        const isBuy = order.side === 'BUY';
        const sideColor = isBuy ? colors.profit : colors.loss;
        const sideText = isBuy ? '매수' : '매도';
        const elapsedRatio = order.progress_pct / 100;

        return (
          <View key={idx} style={{
            paddingVertical: 8,
            borderTopWidth: idx > 0 ? 1 : 0,
            borderTopColor: colors.border,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600' }}>
                  {order.name}
                </Text>
                <View style={{
                  marginLeft: 6,
                  paddingHorizontal: 5,
                  paddingVertical: 1,
                  borderRadius: 3,
                  backgroundColor: sideColor + '22',
                }}>
                  <Text style={{ color: sideColor, fontSize: 10, fontWeight: '700' }}>
                    {sideText}
                  </Text>
                </View>
              </View>
              <Text style={{ color: colors.muted, fontSize: 11 }}>
                {order.quantity}주
              </Text>
            </View>
            {/* 경과시간 바 */}
            <View style={{
              height: 2,
              borderRadius: 1,
              backgroundColor: colors.elevated,
              marginTop: 6,
            }}>
              <View style={{
                height: 2,
                borderRadius: 1,
                backgroundColor: elapsedRatio > 0.8 ? colors.error : colors.warning,
                width: `${Math.min(elapsedRatio * 100, 100)}%` as any,
              }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function ThemeChips({ themes, colors }: { themes: ThemeData[]; colors: ThemeColors }) {
  if (themes.length === 0) return null;

  return (
    <View style={{ marginTop: 20 }}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground, marginHorizontal: 16, marginBottom: 12 }}>
        활성 테마
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {themes.map((theme, idx) => (
          <View key={idx} style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.elevated,
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 8,
          }}>
            <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '500' }}>
              {theme.name}
            </Text>
            <View style={{
              marginLeft: 6,
              backgroundColor: colors.primary + '33',
              borderRadius: 10,
              paddingHorizontal: 6,
              paddingVertical: 2,
            }}>
              <Text style={{ color: colors.primaryLight, fontSize: 11, fontWeight: '700' }}>
                {theme.score}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function ScreeningTop({ items, colors }: { items: ScreeningItem[]; colors: ThemeColors }) {
  if (items.length === 0) return null;
  const topItems = items.slice(0, 5);

  return (
    <View style={{ marginTop: 20 }}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground, marginHorizontal: 16, marginBottom: 12 }}>
        스크리닝 상위
      </Text>
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        marginHorizontal: 16,
        paddingVertical: 4,
      }}>
        {topItems.map((item, idx) => {
          const changePctColor = item.change_pct >= 0 ? colors.profit : colors.loss;
          return (
            <View key={item.symbol} style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderTopWidth: idx > 0 ? 1 : 0,
              borderTopColor: colors.border,
            }}>
              <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', width: 20 }}>
                {idx + 1}
              </Text>
              <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600', flex: 1 }}>
                {item.name}
              </Text>
              <View style={{
                backgroundColor: colors.primary + '22',
                borderRadius: 6,
                paddingHorizontal: 6,
                paddingVertical: 2,
                marginRight: 10,
              }}>
                <Text style={{ color: colors.primaryLight, fontSize: 11, fontWeight: '700' }}>
                  {item.score}
                </Text>
              </View>
              <Text style={{ color: changePctColor, fontSize: 12, fontWeight: '600', minWidth: 50, textAlign: 'right' }}>
                {formatPct(item.change_pct)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function MarketIndicesBar({ indices, colors }: { indices: MarketIndexItem[]; colors: ThemeColors }) {
  if (!indices || indices.length === 0) return null;
  const filtered = indices.filter(i => i.kind === "index_kr" || i.kind === "index_us");
  if (filtered.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ backgroundColor: colors.surface, borderBottomWidth: 0.5, borderBottomColor: colors.border }}
      contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 16, flexDirection: "row", alignItems: "center" }}
    >
      {filtered.map((item) => {
        const isUp = item.change_pct >= 0;
        const color = isUp ? colors.profit : colors.loss;
        return (
          <View key={item.symbol} style={{ alignItems: "center", minWidth: 70 }}>
            <Text style={{ color: colors.muted, fontSize: 10, fontWeight: "600" }}>{item.label}</Text>
            <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "700", marginTop: 1 }}>
              {item.kind === "index_us"
                ? item.price.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                : item.price.toLocaleString("ko-KR")}
            </Text>
            <Text style={{ color, fontSize: 10, fontWeight: "600" }}>
              {isUp ? "+" : ""}{item.change_pct.toFixed(2)}%
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

function CoreHoldingsSection({ data, colors }: { data: CoreHoldingsData | null; colors: ThemeColors }) {
  if (!data || data.positions.length === 0) return null;
  const summary = data.summary;
  const totalPnlColor = summary.total_pnl_pct >= 0 ? colors.profit : colors.loss;

  return (
    <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "700" }}>코어 홀딩</Text>
          <View style={{ backgroundColor: "rgba(251,191,36,0.15)", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: "rgba(251,191,36,0.4)" }}>
            <Text style={{ color: "#fbbf24", fontSize: 10, fontWeight: "700" }}>CORE</Text>
          </View>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: totalPnlColor, fontSize: 13, fontWeight: "700" }}>
            {summary.total_pnl_pct >= 0 ? "+" : ""}{summary.total_pnl_pct.toFixed(2)}%
          </Text>
          <Text style={{ color: colors.muted, fontSize: 10 }}>
            {data.positions.length}/{summary.max_positions}슬롯
            {data.days_to_rebalance > 0 ? ` · 리밸 D-${data.days_to_rebalance}` : ""}
          </Text>
        </View>
      </View>
      {/* Positions */}
      {data.positions.map((pos) => {
        const isUp = pos.unrealized_pnl_pct >= 0;
        const pnlColor = isUp ? colors.profit : colors.loss;
        return (
          <View key={pos.symbol} style={{
            backgroundColor: colors.surface,
            borderRadius: 10,
            padding: 12,
            marginBottom: 6,
            borderLeftWidth: 3,
            borderLeftColor: "#fbbf24",
          }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "700" }}>{pos.name}</Text>
                <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>
                  {pos.symbol} · {pos.holding_days}일 보유 · {pos.weight_pct.toFixed(1)}%
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: pnlColor, fontSize: 14, fontWeight: "700" }}>
                  {isUp ? "+" : ""}{pos.unrealized_pnl_pct.toFixed(2)}%
                </Text>
                <Text style={{ color: colors.muted, fontSize: 11 }}>
                  {pos.current_price.toLocaleString("ko-KR")}원
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const EVENT_ICONS: Record<string, { icon: string; color: string }> = {
  fill: { icon: '\u25CF', color: '#34d399' },
  signal: { icon: '\u25B2', color: '#60a5fa' },
  error: { icon: '\u2715', color: '#f87171' },
  warning: { icon: '\u25B3', color: '#fbbf24' },
  info: { icon: '\u2139', color: '#94a3b8' },
};

function EventFeed({ events, colors }: { events: EventData[]; colors: ThemeColors }) {
  const recentEvents = events.slice(0, 10);

  return (
    <View style={{ marginTop: 20 }}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground, marginHorizontal: 16, marginBottom: 12 }}>
        이벤트
      </Text>
      {recentEvents.length === 0 ? (
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 24,
          marginHorizontal: 16,
          alignItems: 'center',
        }}>
          <Text style={{ color: colors.muted, fontSize: 13 }}>이벤트 없음</Text>
        </View>
      ) : (
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          marginHorizontal: 16,
          paddingVertical: 4,
        }}>
          {recentEvents.map((event, idx) => {
            const eventStyle = EVENT_ICONS[event.type] || EVENT_ICONS.info;
            return (
              <View key={event.id || idx} style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderTopWidth: idx > 0 ? 1 : 0,
                borderTopColor: colors.border,
              }}>
                <Text style={{
                  color: eventStyle.color,
                  fontSize: 12,
                  width: 18,
                  marginTop: 1,
                }}>
                  {eventStyle.icon}
                </Text>
                <Text style={{
                  color: colors.foreground,
                  fontSize: 12,
                  flex: 1,
                  lineHeight: 18,
                }}>
                  {event.message}
                </Text>
                <Text style={{
                  color: colors.muted,
                  fontSize: 10,
                  marginLeft: 8,
                  marginTop: 2,
                }}>
                  {formatTime(event.timestamp)}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

// =============================================================================
// 메인 화면
// =============================================================================

export default function RealtimeScreen() {
  const { state, refresh } = useTradingData();
  const colors = useColors();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [themes, setThemes] = useState<ThemeData[]>([]);
  const [screening, setScreening] = useState<ScreeningItem[]>([]);
  const [coreHoldings, setCoreHoldings] = useState<CoreHoldingsData | null>(null);
  const [marketIndices, setMarketIndices] = useState<MarketIndexItem[]>([]);

  // Pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    if (!state.isDemo) {
      try {
        const [t, s] = await Promise.all([apiClient.getThemes(), apiClient.getScreening()]);
        setThemes(t);
        setScreening(s);
      } catch (e) {
        console.warn('[Dashboard] 테마/스크리닝 로드 실패:', e);
      }
    }
    setRefreshing(false);
  };

  // 데이터 소스 (데모 vs 실제)
  const portfolio = state.isDemo ? getDemoPortfolio() : state.portfolio;
  const status = state.isDemo ? getDemoStatus() : state.status;
  const positions = state.isDemo ? getDemoPositions() : state.positions;
  const risk = state.isDemo ? getDemoRisk() : state.risk;
  const events = state.isDemo ? getDemoEvents() : state.events;
  const pendingOrders = state.isDemo ? getDemoPendingOrders() : state.pendingOrders;
  const externalAccounts: ExternalAccount[] = state.isDemo ? [] : state.externalAccounts;
  const overseasData = state.isDemo ? null : state.overseasData;
  const usPositions = state.isDemo ? [] : state.usPositions;
  const usPortfolio = state.isDemo ? null : state.usPortfolio;
  const displayThemes = state.isDemo ? DEMO_THEMES : themes;
  const displayScreening = state.isDemo ? DEMO_SCREENING : screening;

  // 테마/스크리닝 초기 로드
  useEffect(() => {
    if (!state.isDemo) {
      Promise.all([apiClient.getThemes(), apiClient.getScreening()])
        .then(([t, s]) => { setThemes(t); setScreening(s); })
        .catch((e) => console.warn('[Dashboard] 초기 테마/스크리닝 로드 실패:', e));
    }
  }, [state.isDemo]);

  // 코어홀딩 / 지수 초기 로드 + SSE
  useEffect(() => {
    if (state.isDemo) return;

    // 초기 데이터 로드
    const loadInitialData = async () => {
      const [coreHoldingsData, marketIndicesData] = await Promise.allSettled([
        apiClient.getCoreHoldings(),
        apiClient.getMarketIndices(),
      ]);
      if (coreHoldingsData.status === "fulfilled") setCoreHoldings(coreHoldingsData.value);
      if (marketIndicesData.status === "fulfilled") setMarketIndices(marketIndicesData.value);
    };
    loadInitialData();

    // SSE 리스너
    const unsub = sseClient.addListener((msg) => {
      if (msg.type === "core_holdings") setCoreHoldings(msg.data);
      if (msg.type === "market_indices") setMarketIndices(msg.data);
    });
    return unsub;
  }, [state.isDemo]);

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={handleRefresh}>
      <MarketIndicesBar indices={marketIndices} colors={colors} />
      {state.isDemo && <DemoBadge colors={colors} />}
      <PortfolioHero portfolio={portfolio} colors={colors} />
      <RiskGauge risk={risk} status={status} colors={colors} />
      <PositionCards
        positions={positions}
        onPress={(p) => router.push(`/position-detail?symbol=${p.symbol}&name=${encodeURIComponent(p.name)}`)}
        colors={colors}
      />
      <CoreHoldingsSection data={coreHoldings} colors={colors} />
      {(usPositions.length > 0 || (usPortfolio?.positions_count ?? 0) > 0) &&
        <USPositionsSection positions={usPositions} portfolio={usPortfolio} colors={colors} />}
      {externalAccounts.length > 0 && <ExternalAccountsSection accounts={externalAccounts} colors={colors} />}
      {pendingOrders.length > 0 && <PendingOrdersSection orders={pendingOrders} colors={colors} />}
      <ThemeChips themes={displayThemes} colors={colors} />
      <ScreeningTop items={displayScreening} colors={colors} />
      <EventFeed events={events} colors={colors} />
      <View style={{ height: 20 }} />
    </ScreenContainer>
  );
}
