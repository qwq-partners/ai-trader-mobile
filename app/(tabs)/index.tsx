import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { useTradingData, getDemoPortfolio, getDemoStatus, getDemoPositions, getDemoEvents, getDemoRisk, getDemoPendingOrders } from '@/lib/trading-data-provider';
import { apiClient } from '@/lib/api-client';
import type { ThemeData, ScreeningItem, PositionData, EventData, PendingOrder, ExternalAccount, PortfolioData, RiskData, StatusData } from '@/lib/api-client';
import { DEMO_THEMES, DEMO_SCREENING, formatKRW, formatPct, formatPrice, formatTime } from '@/lib/demo-data';
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

  const dailyUsedPct = risk.daily_loss_limit_pct !== 0
    ? Math.min(100, Math.max(0, Math.abs(risk.daily_loss_pct / risk.daily_loss_limit_pct) * 100))
    : 0;
  const canTrade = risk.can_trade && status.running && !status.engine?.paused;
  const tradingColor = canTrade ? colors.success : colors.error;
  const tradingText = canTrade ? '거래가능' : '중단';

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
        <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600' }}>
          {formatPct(risk.daily_loss_pct)} / {formatPct(risk.daily_loss_limit_pct, false)}
        </Text>
        <View style={{
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.elevated,
          marginTop: 6,
        }}>
          <View style={{
            height: 4,
            borderRadius: 2,
            backgroundColor: dailyUsedPct > 80 ? colors.error : dailyUsedPct > 50 ? colors.warning : colors.success,
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
  first_exit: { bg: 'rgba(167,139,250,0.15)', text: '#a78bfa', label: '1차익절' },
};

const STRATEGY_LABELS: Record<string, string> = {
  momentum_breakout: '모멘텀',
  sepa_trend: 'SEPA',
  theme_chasing: '테마',
  gap_and_go: '갭상승',
};

function PositionCard({ position, onPress, colors }: { position: PositionData; onPress: () => void; colors: ThemeColors }) {
  // 수수료 포함 순손익 기준으로 색상 결정 (실제 손익 기준)
  const netPnl = position.unrealized_pnl_net ?? position.unrealized_pnl;
  const netPct = position.unrealized_pnl_net_pct ?? position.unrealized_pnl_pct;
  const pnlColor = netPnl >= 0 ? colors.profit : colors.loss;
  const exitStage = position.exit_state?.stage || 'none';
  const exitState = EXIT_STATE_COLORS[exitStage] || EXIT_STATE_COLORS.none;

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
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
            <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '700' }}>
              {position.name}
            </Text>
            <View style={{
              marginLeft: 8,
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

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={handleRefresh}>
      {state.isDemo && <DemoBadge colors={colors} />}
      <PortfolioHero portfolio={portfolio} colors={colors} />
      <RiskGauge risk={risk} status={status} colors={colors} />
      <PositionCards
        positions={positions}
        onPress={(p) => router.push(`/position-detail?symbol=${p.symbol}&name=${encodeURIComponent(p.name)}`)}
        colors={colors}
      />
      {externalAccounts.length > 0 && <ExternalAccountsSection accounts={externalAccounts} colors={colors} />}
      {pendingOrders.length > 0 && <PendingOrdersSection orders={pendingOrders} colors={colors} />}
      <ThemeChips themes={displayThemes} colors={colors} />
      <ScreeningTop items={displayScreening} colors={colors} />
      <EventFeed events={events} colors={colors} />
      <View style={{ height: 20 }} />
    </ScreenContainer>
  );
}
