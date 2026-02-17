import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useTradingData } from '@/lib/trading-data-provider';
import { apiClient } from '@/lib/api-client';
import type { TradeData } from '@/lib/api-client';
import { DEMO_TRADES, formatKRW, formatPct, formatPrice, formatTime, formatHoldingTime } from '@/lib/demo-data';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { toDateString } from '@/lib/utils';

// =============================================================================
// DemoBadge
// =============================================================================

function DemoBadge() {
  return (
    <View
      style={{
        backgroundColor: 'rgba(251,191,36,0.15)',
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginHorizontal: 16,
        marginTop: 12,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ color: '#fbbf24', fontSize: 12, fontWeight: '700' }}>DEMO</Text>
    </View>
  );
}

// =============================================================================
// DateNavigator
// =============================================================================

function DateNavigator({
  date,
  onChange,
}: {
  date: Date;
  onChange: (d: Date) => void;
}) {
  const colors = useColors();
  const todayStr = toDateString(new Date());
  const dateStr = toDateString(date);
  const isFuture = dateStr >= todayStr;

  const shift = (days: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    if (toDateString(next) <= todayStr) {
      onChange(next);
    }
  };

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 12,
        marginHorizontal: 16,
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
      }}
    >
      <TouchableOpacity
        onPress={() => shift(-1)}
        style={{ padding: 8 }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '700' }}>{'\u25C0'}</Text>
      </TouchableOpacity>

      <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600', minWidth: 110, textAlign: 'center' }}>
        {dateStr}
      </Text>

      <TouchableOpacity
        onPress={() => shift(1)}
        disabled={isFuture}
        style={{ padding: 8, opacity: isFuture ? 0.3 : 1 }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={{ color: isFuture ? colors.muted : colors.primary, fontSize: 18, fontWeight: '700' }}>{'\u25B6'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onChange(new Date())}
        style={{
          backgroundColor: dateStr === todayStr ? colors.primary : colors.elevated,
          borderRadius: 8,
          paddingVertical: 6,
          paddingHorizontal: 12,
          marginLeft: 4,
        }}
      >
        <Text style={{ color: dateStr === todayStr ? '#fff' : colors.muted, fontSize: 13, fontWeight: '600' }}>
          오늘
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// =============================================================================
// DailySummary
// =============================================================================

function DailySummary({ trades }: { trades: TradeData[] }) {
  const colors = useColors();

  const stats = useMemo(() => {
    // 저널 포맷: 청산된 거래만 통계에 포함
    const closedTrades = trades.filter((t) => t.exit_time != null);
    const wins = closedTrades.filter((t) => t.pnl > 0);
    const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;
    const totalPnl = closedTrades.reduce((sum, t) => sum + t.pnl, 0);
    const avgPnlPct =
      closedTrades.length > 0
        ? closedTrades.reduce((sum, t) => sum + t.pnl_pct, 0) / closedTrades.length
        : 0;

    return {
      tradeCount: trades.length,
      closedCount: closedTrades.length,
      winRate,
      totalPnl,
      avgPnlPct,
    };
  }, [trades]);

  const items = [
    { label: '거래수', value: `${stats.tradeCount}건`, color: colors.foreground },
    {
      label: '승률',
      value: stats.closedCount > 0 ? `${stats.winRate.toFixed(1)}%` : '-',
      color: stats.winRate >= 50 ? colors.profit : stats.winRate > 0 ? colors.loss : colors.muted,
    },
    {
      label: '총손익',
      value: stats.totalPnl !== 0 ? formatKRW(stats.totalPnl) : '-',
      color: stats.totalPnl > 0 ? colors.profit : stats.totalPnl < 0 ? colors.loss : colors.muted,
    },
    {
      label: '평균수익률',
      value: stats.closedCount > 0 ? formatPct(stats.avgPnlPct) : '-',
      color: stats.avgPnlPct > 0 ? colors.profit : stats.avgPnlPct < 0 ? colors.loss : colors.muted,
    },
  ];

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginTop: 12,
      }}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {items.map((item, i) => (
          <View key={i} style={{ width: '50%', paddingVertical: 8, paddingHorizontal: 4 }}>
            <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 4 }}>{item.label}</Text>
            <Text style={{ color: item.color, fontSize: 18, fontWeight: '700' }}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// =============================================================================
// ExitTypeBar
// =============================================================================

interface ExitCategory {
  label: string;
  color: string;
  count: number;
}

function classifyExitType(trade: TradeData): string {
  const reason = (trade.exit_reason ?? '').toLowerCase();
  const exitType = (trade.exit_type ?? '').toLowerCase();
  if (reason.includes('손절') || reason.includes('stop') || exitType === 'stop_loss') return 'stop';
  if (reason.includes('1차') || reason.includes('first') || exitType === 'first_exit') return 'first';
  if (reason.includes('트레일링') || reason.includes('trailing') || exitType === 'trailing') return 'trailing';
  return 'other';
}

function ExitTypeBar({ trades }: { trades: TradeData[] }) {
  const colors = useColors();
  const closedTrades = trades.filter((t) => t.exit_time != null);

  const categories = useMemo((): ExitCategory[] => {
    const map: Record<string, ExitCategory> = {
      stop: { label: '손절', color: colors.error, count: 0 },
      first: { label: '1차 익절', color: colors.primary, count: 0 },
      trailing: { label: '트레일링', color: colors.profit, count: 0 },
      other: { label: '기타', color: colors.muted, count: 0 },
    };

    closedTrades.forEach((t) => {
      const type = classifyExitType(t);
      map[type].count++;
    });

    return Object.values(map).filter((c) => c.count > 0);
  }, [closedTrades, colors]);

  if (closedTrades.length === 0) return null;

  const total = closedTrades.length;

  return (
    <View style={{ marginHorizontal: 16, marginTop: 12 }}>
      {/* Bar */}
      <View
        style={{
          flexDirection: 'row',
          height: 8,
          borderRadius: 4,
          overflow: 'hidden',
          backgroundColor: colors.elevated,
        }}
      >
        {categories.map((cat, i) => (
          <View
            key={i}
            style={{
              flex: cat.count / total,
              backgroundColor: cat.color,
            }}
          />
        ))}
      </View>

      {/* Legend */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 12 }}>
        {categories.map((cat, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: cat.color,
                marginRight: 4,
              }}
            />
            <Text style={{ color: colors.muted, fontSize: 11 }}>
              {cat.label} {cat.count}건
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// =============================================================================
// TradeList
// =============================================================================

const STRATEGY_LABELS: Record<string, string> = {
  momentum_breakout: '모멘텀',
  sepa_trend: 'SEPA',
  theme_chasing: '테마',
  gap_and_go: '갭상승',
};

function strategyLabel(strategy: string): string {
  return STRATEGY_LABELS[strategy] ?? strategy;
}

function TradeCard({
  trade,
  onPress,
}: {
  trade: TradeData;
  onPress: () => void;
}) {
  const colors = useColors();
  const isClosed = trade.exit_time != null;
  const barColor = isClosed
    ? (trade.pnl >= 0 ? colors.success : colors.error)
    : colors.info;
  const pnlColor =
    trade.pnl > 0 ? colors.profit : trade.pnl < 0 ? colors.loss : colors.muted;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 8,
        flexDirection: 'row',
      }}
    >
      {/* Left color bar */}
      <View
        style={{
          width: 4,
          borderRadius: 2,
          backgroundColor: barColor,
          marginRight: 12,
        }}
      />

      {/* Content */}
      <View style={{ flex: 1 }}>
        {/* Header: name + strategy badge + status badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '700', marginRight: 8 }}>
            {trade.name}
          </Text>
          <View
            style={{
              backgroundColor: colors.elevated,
              borderRadius: 4,
              paddingVertical: 2,
              paddingHorizontal: 6,
            }}
          >
            <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '600' }}>
              {strategyLabel(trade.entry_strategy)}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: isClosed ? 'rgba(248,113,113,0.15)' : 'rgba(96,165,250,0.15)',
              borderRadius: 4,
              paddingVertical: 2,
              paddingHorizontal: 6,
              marginLeft: 4,
            }}
          >
            <Text style={{ color: isClosed ? colors.error : colors.info, fontSize: 10, fontWeight: '600' }}>
              {isClosed ? '청산' : '보유중'}
            </Text>
          </View>
        </View>

        {/* Price row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            {formatPrice(trade.entry_price)}원 x {trade.entry_quantity}주
          </Text>
          {isClosed && trade.exit_price != null && (
            <Text style={{ color: colors.muted, fontSize: 12, marginLeft: 8 }}>
              ({formatPrice(trade.entry_price)} {'\u2192'} {formatPrice(trade.exit_price)})
            </Text>
          )}
        </View>

        {/* PnL + holding_minutes row */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: pnlColor, fontSize: 14, fontWeight: '700', marginRight: 8 }}>
            {trade.pnl > 0 ? '+' : ''}
            {formatKRW(trade.pnl)} ({formatPct(trade.pnl_pct)})
          </Text>
          {trade.holding_minutes > 0 && (
            <Text style={{ color: colors.muted, fontSize: 11 }}>
              {formatHoldingTime(trade.holding_minutes)}
            </Text>
          )}
        </View>

        {/* Timestamp */}
        <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>
          {formatTime(trade.entry_time)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function TradeList({
  trades,
  onPress,
}: {
  trades: TradeData[];
  onPress: (trade: TradeData) => void;
}) {
  const colors = useColors();

  if (trades.length === 0) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 40 }}>
        <Text style={{ color: colors.muted, fontSize: 14 }}>거래 내역이 없습니다</Text>
      </View>
    );
  }

  // 청산 거래: 수익률 내림차순, 미청산 거래: 아래로 분리
  const closed = trades.filter((t) => t.exit_time != null).sort((a, b) => (b.pnl_pct ?? 0) - (a.pnl_pct ?? 0));
  const open = trades.filter((t) => t.exit_time == null);
  const sorted = [...closed, ...open];

  return (
    <View style={{ marginTop: 12 }}>
      <Text
        style={{
          fontSize: 16,
          fontWeight: '700',
          color: colors.foreground,
          marginHorizontal: 16,
          marginBottom: 12,
        }}
      >
        거래 내역
      </Text>
      <FlatList
        data={sorted}
        scrollEnabled={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TradeCard trade={item} onPress={() => onPress(item)} />
        )}
      />
    </View>
  );
}

// =============================================================================
// TradeDetailModal
// =============================================================================

function DetailRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  const colors = useColors();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <Text style={{ color: colors.muted, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: valueColor ?? colors.foreground, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right', marginLeft: 12 }}>
        {value}
      </Text>
    </View>
  );
}

function TradeDetailModal({
  trade,
  onClose,
}: {
  trade: TradeData;
  onClose: () => void;
}) {
  const colors = useColors();
  const isClosed = trade.exit_time != null;
  const pnlColor =
    trade.pnl > 0 ? colors.profit : trade.pnl < 0 ? colors.loss : colors.muted;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      {/* Backdrop */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
      >
        {/* Sheet */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {}}
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 36,
            maxHeight: '80%',
          }}
        >
          {/* Handle */}
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.muted,
              alignSelf: 'center',
              marginBottom: 16,
              opacity: 0.5,
            }}
          />

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: '700', flex: 1 }}>
              {trade.name}
            </Text>
            <View
              style={{
                backgroundColor: colors.elevated,
                borderRadius: 6,
                paddingVertical: 4,
                paddingHorizontal: 8,
              }}
            >
              <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '600' }}>
                {strategyLabel(trade.entry_strategy)}
              </Text>
            </View>
          </View>

          {/* Details */}
          <DetailRow label="상태" value={isClosed ? '청산' : '보유중'} valueColor={isClosed ? colors.error : colors.info} />
          <DetailRow label="종목코드" value={trade.symbol} />
          <DetailRow label="진입수량" value={`${trade.entry_quantity}주`} />
          <DetailRow label="진입가" value={`${formatPrice(trade.entry_price)}원`} />
          <DetailRow label="진입금액" value={formatKRW(trade.entry_price * trade.entry_quantity)} />

          {isClosed && trade.exit_price != null && (
            <>
              <DetailRow
                label="청산가"
                value={`${formatPrice(trade.exit_price)}원`}
              />
              <DetailRow
                label="청산수량"
                value={`${trade.exit_quantity ?? trade.entry_quantity}주`}
              />
            </>
          )}

          <DetailRow
            label="손익"
            value={`${trade.pnl > 0 ? '+' : ''}${formatKRW(trade.pnl)} (${formatPct(trade.pnl_pct)})`}
            valueColor={pnlColor}
          />

          {trade.entry_reason ? (
            <DetailRow label="진입 사유" value={trade.entry_reason} />
          ) : null}
          {trade.exit_reason ? (
            <DetailRow label="청산 사유" value={trade.exit_reason} />
          ) : null}
          {trade.exit_type ? (
            <DetailRow label="청산 유형" value={trade.exit_type} />
          ) : null}
          {trade.holding_minutes > 0 && (
            <DetailRow label="보유시간" value={formatHoldingTime(trade.holding_minutes)} />
          )}
          <DetailRow label="진입시간" value={formatTime(trade.entry_time)} />
          {trade.entry_signal_score > 0 && (
            <DetailRow label="시그널 점수" value={`${trade.entry_signal_score}`} />
          )}

          {/* Close button */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: colors.elevated,
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              marginTop: 20,
            }}
          >
            <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '600' }}>닫기</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// =============================================================================
// TradesScreen (메인)
// =============================================================================

export default function TradesScreen() {
  const { state } = useTradingData();
  const colors = useColors();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<TradeData | null>(null);

  // 날짜 변경 시 거래 로드
  useEffect(() => {
    loadTrades();
  }, [selectedDate, state.isDemo]);

  const loadTrades = async () => {
    if (state.isDemo) {
      setTrades(DEMO_TRADES);
      return;
    }
    setLoading(true);
    try {
      const dateStr = toDateString(selectedDate);
      const isToday = dateStr === toDateString(new Date());
      const data = isToday
        ? await apiClient.getTodayTrades()
        : await apiClient.getTrades(dateStr);
      setTrades(data);
    } catch (e) {
      console.warn('[Trades] 거래 내역 로드 실패:', e);
      setTrades([]);
    }
    setLoading(false);
  };

  return (
    <ScreenContainer refreshing={loading} onRefresh={loadTrades}>
      {state.isDemo && <DemoBadge />}
      <DateNavigator date={selectedDate} onChange={setSelectedDate} />
      <DailySummary trades={trades} />
      <ExitTypeBar trades={trades} />

      {loading ? (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <ActivityIndicator color={colors.primary} size="small" />
        </View>
      ) : (
        <TradeList trades={trades} onPress={setSelectedTrade} />
      )}

      {selectedTrade && (
        <TradeDetailModal trade={selectedTrade} onClose={() => setSelectedTrade(null)} />
      )}
    </ScreenContainer>
  );
}
