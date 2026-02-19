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
import type { TradeEventData } from '@/lib/api-client';
import { DEMO_TRADE_EVENTS, formatKRW, formatPct, formatPrice } from '@/lib/demo-data';
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
// FilterTabs
// =============================================================================

type FilterType = 'all' | 'buy' | 'sell';

function FilterTabs({
  current,
  counts,
  onChange,
}: {
  current: FilterType;
  counts: { all: number; buy: number; sell: number };
  onChange: (t: FilterType) => void;
}) {
  const colors = useColors();
  const tabs: { key: FilterType; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'buy', label: '매수' },
    { key: 'sell', label: '매도' },
  ];

  return (
    <View
      style={{
        flexDirection: 'row',
        marginHorizontal: 16,
        marginTop: 12,
        gap: 8,
      }}
    >
      {tabs.map((tab) => {
        const active = current === tab.key;
        const count = counts[tab.key];
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={{
              backgroundColor: active ? colors.primary : colors.surface,
              borderRadius: 8,
              paddingVertical: 8,
              paddingHorizontal: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Text
              style={{
                color: active ? '#fff' : colors.muted,
                fontSize: 13,
                fontWeight: '600',
              }}
            >
              {tab.label}
            </Text>
            <View
              style={{
                backgroundColor: active ? 'rgba(255,255,255,0.2)' : colors.elevated,
                borderRadius: 10,
                paddingHorizontal: 6,
                paddingVertical: 1,
                minWidth: 20,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: active ? '#fff' : colors.muted,
                  fontSize: 11,
                  fontWeight: '700',
                }}
              >
                {count}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// =============================================================================
// DailySummary
// =============================================================================

function DailySummary({ events }: { events: TradeEventData[] }) {
  const colors = useColors();

  const stats = useMemo(() => {
    const buys = events.filter((e) => e.event_type === 'BUY');
    const sells = events.filter((e) => e.event_type === 'SELL');
    const holding = buys.filter((e) => e.status === 'holding');

    const sellPnl = sells.reduce((s, e) => s + (e.pnl || 0), 0);
    const holdPnl = holding.reduce((s, e) => s + (e.pnl || 0), 0);
    const totalPnl = sellPnl + holdPnl;

    const withPnl = [...sells, ...holding].filter((e) => e.pnl != null && e.pnl !== 0);
    const avgPnlPct =
      withPnl.length > 0
        ? withPnl.reduce((s, e) => s + (e.pnl_pct || 0), 0) / withPnl.length
        : 0;

    const wins = sells.filter((e) => (e.pnl || 0) > 0);
    const winRate = sells.length > 0 ? (wins.length / sells.length) * 100 : 0;

    return {
      tradeCount: buys.length,
      holdingCount: holding.length,
      sellCount: sells.length,
      winRate,
      totalPnl,
      avgPnlPct,
    };
  }, [events]);

  const items = [
    {
      label: '거래수',
      value: stats.holdingCount > 0 ? `${stats.tradeCount}건 (보유${stats.holdingCount})` : `${stats.tradeCount}건`,
      color: colors.foreground,
    },
    {
      label: '승률',
      value: stats.sellCount > 0 ? `${stats.winRate.toFixed(1)}%` : '-',
      color: stats.winRate >= 50 ? colors.profit : stats.winRate > 0 ? colors.loss : colors.muted,
    },
    {
      label: '총손익',
      value: stats.totalPnl !== 0 ? formatKRW(stats.totalPnl) : '-',
      color: stats.totalPnl > 0 ? colors.profit : stats.totalPnl < 0 ? colors.loss : colors.muted,
    },
    {
      label: '평균수익률',
      value: stats.avgPnlPct !== 0 ? formatPct(stats.avgPnlPct) : '-',
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

function classifyExitType(event: TradeEventData): string {
  const exitType = (event.exit_type ?? '').toLowerCase();
  const reason = (event.exit_reason ?? '').toLowerCase();

  if (exitType.includes('stop') || reason.includes('손절')) return 'stop';
  if (exitType.includes('first') || reason.includes('1차')) return 'first';
  if (exitType.includes('second') || reason.includes('2차')) return 'second';
  if (exitType.includes('third') || reason.includes('3차')) return 'third';
  if (exitType.includes('trailing') || reason.includes('트레일링')) return 'trailing';
  if (exitType.includes('breakeven') || reason.includes('본전')) return 'breakeven';
  if (exitType.includes('take_profit') || reason.includes('익절')) return 'profit';
  return 'other';
}

function ExitTypeBar({ events }: { events: TradeEventData[] }) {
  const colors = useColors();
  const sells = events.filter((e) => e.event_type === 'SELL');

  const categories = useMemo((): ExitCategory[] => {
    const map: Record<string, ExitCategory> = {
      stop: { label: '손절', color: colors.error, count: 0 },
      first: { label: '1차익절', color: colors.primary, count: 0 },
      second: { label: '2차익절', color: '#22d3ee', count: 0 },
      third: { label: '3차익절', color: '#a78bfa', count: 0 },
      profit: { label: '익절', color: colors.profit, count: 0 },
      trailing: { label: '트레일링', color: '#fbbf24', count: 0 },
      breakeven: { label: '본전', color: '#fbbf24', count: 0 },
      other: { label: '기타', color: colors.muted, count: 0 },
    };

    sells.forEach((e) => {
      const type = classifyExitType(e);
      map[type].count++;
    });

    return Object.values(map).filter((c) => c.count > 0);
  }, [sells, colors]);

  if (sells.length === 0) return null;

  const total = sells.length;

  return (
    <View style={{ marginHorizontal: 16, marginTop: 12 }}>
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
// Status / Strategy Labels
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

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  holding: { label: '보유중', color: '#60a5fa' },
  partial: { label: '부분매도', color: '#fbbf24' },
  take_profit: { label: '익절', color: '#34d399' },
  first_take_profit: { label: '1차익절', color: '#34d399' },
  second_take_profit: { label: '2차익절', color: '#22d3ee' },
  third_take_profit: { label: '3차익절', color: '#22d3ee' },
  trailing: { label: '트레일링', color: '#fbbf24' },
  breakeven: { label: '본전', color: '#fbbf24' },
  stop_loss: { label: '손절', color: '#f87171' },
  manual: { label: '수동', color: '#a78bfa' },
  kis_sync: { label: '동기화', color: '#a78bfa' },
  closed: { label: '청산', color: '#60a5fa' },
  time_exit: { label: '시간청산', color: '#a78bfa' },
};

function formatEventTime(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

// =============================================================================
// EventCard
// =============================================================================

function EventCard({
  event,
  onPress,
}: {
  event: TradeEventData;
  onPress: () => void;
}) {
  const colors = useColors();
  const isBuy = event.event_type === 'BUY';
  const pnl = event.pnl || 0;
  const pnlPct = event.pnl_pct || 0;
  const pnlColor = pnl > 0 ? colors.profit : pnl < 0 ? colors.loss : colors.muted;

  const statusInfo = STATUS_LABELS[event.status] ?? { label: event.status, color: colors.muted };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 14,
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
          backgroundColor: isBuy ? colors.info : (pnl >= 0 ? colors.success : colors.error),
          marginRight: 12,
        }}
      />

      {/* Content */}
      <View style={{ flex: 1 }}>
        {/* Header: time + name + type badge + strategy badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
          <Text style={{ color: colors.muted, fontSize: 11, marginRight: 4 }}>
            {formatEventTime(event.event_time)}
          </Text>
          <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '700', marginRight: 6 }}>
            {event.name || event.symbol}
          </Text>

          {/* 매수/매도 배지 */}
          <View
            style={{
              backgroundColor: isBuy ? 'rgba(99,102,241,0.12)' : (pnl >= 0 ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)'),
              borderRadius: 4,
              paddingVertical: 2,
              paddingHorizontal: 6,
            }}
          >
            <Text
              style={{
                color: isBuy ? colors.primary : (pnl >= 0 ? colors.profit : colors.error),
                fontSize: 10,
                fontWeight: '700',
              }}
            >
              {isBuy ? '매수' : '매도'}
            </Text>
          </View>

          {/* 전략 배지 */}
          {event.strategy && event.strategy !== 'unknown' && (
            <View
              style={{
                backgroundColor: colors.elevated,
                borderRadius: 4,
                paddingVertical: 2,
                paddingHorizontal: 6,
              }}
            >
              <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '600' }}>
                {strategyLabel(event.strategy)}
              </Text>
            </View>
          )}
        </View>

        {/* Price + Qty row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            {formatPrice(event.price)}원 x {event.quantity}주
          </Text>
          {isBuy && event.current_price && event.status === 'holding' && (
            <Text style={{ color: '#22d3ee', fontSize: 12, marginLeft: 8 }}>
              {'\u2192'} {formatPrice(event.current_price)}원
            </Text>
          )}
        </View>

        {/* PnL row + status badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {pnl !== 0 && (
            <Text style={{ color: pnlColor, fontSize: 14, fontWeight: '700' }}>
              {pnl > 0 ? '+' : ''}{formatKRW(pnl)} ({formatPct(pnlPct)})
            </Text>
          )}
          <View
            style={{
              backgroundColor: `${statusInfo.color}20`,
              borderRadius: 4,
              paddingVertical: 2,
              paddingHorizontal: 6,
            }}
          >
            <Text style={{ color: statusInfo.color, fontSize: 10, fontWeight: '600' }}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        {/* Exit reason */}
        {!isBuy && event.exit_reason && (
          <Text
            style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}
            numberOfLines={1}
          >
            {event.exit_reason}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// =============================================================================
// EventList
// =============================================================================

function EventList({
  events,
  onPress,
}: {
  events: TradeEventData[];
  onPress: (event: TradeEventData) => void;
}) {
  const colors = useColors();

  if (events.length === 0) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 40 }}>
        <Text style={{ color: colors.muted, fontSize: 14 }}>거래 내역이 없습니다</Text>
      </View>
    );
  }

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
        거래 이벤트 로그
      </Text>
      <FlatList
        data={events}
        scrollEnabled={false}
        keyExtractor={(item) => `${item.id}`}
        renderItem={({ item }) => (
          <EventCard event={item} onPress={() => onPress(item)} />
        )}
      />
    </View>
  );
}

// =============================================================================
// EventDetailModal
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

function EventDetailModal({
  event,
  onClose,
}: {
  event: TradeEventData;
  onClose: () => void;
}) {
  const colors = useColors();
  const isBuy = event.event_type === 'BUY';
  const pnl = event.pnl || 0;
  const pnlColor = pnl > 0 ? colors.profit : pnl < 0 ? colors.loss : colors.muted;
  const statusInfo = STATUS_LABELS[event.status] ?? { label: event.status, color: colors.muted };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
      >
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
              {event.name || event.symbol}
            </Text>
            <View
              style={{
                backgroundColor: isBuy ? 'rgba(99,102,241,0.12)' : (pnl >= 0 ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)'),
                borderRadius: 6,
                paddingVertical: 4,
                paddingHorizontal: 8,
              }}
            >
              <Text
                style={{
                  color: isBuy ? colors.primary : (pnl >= 0 ? colors.profit : colors.error),
                  fontSize: 12,
                  fontWeight: '700',
                }}
              >
                {isBuy ? '매수' : '매도'}
              </Text>
            </View>
          </View>

          {/* Details */}
          <DetailRow label="상태" value={statusInfo.label} valueColor={statusInfo.color} />
          <DetailRow label="종목코드" value={event.symbol} />
          <DetailRow label="시간" value={formatEventTime(event.event_time)} />
          <DetailRow label="가격" value={`${formatPrice(event.price)}원`} />
          <DetailRow label="수량" value={`${event.quantity}주`} />
          <DetailRow label="금액" value={formatKRW(event.price * event.quantity)} />

          {event.strategy && event.strategy !== 'unknown' && (
            <DetailRow label="전략" value={strategyLabel(event.strategy)} />
          )}
          {event.signal_score > 0 && (
            <DetailRow label="시그널 점수" value={`${event.signal_score}`} />
          )}

          {pnl !== 0 && (
            <DetailRow
              label="손익"
              value={`${pnl > 0 ? '+' : ''}${formatKRW(pnl)} (${formatPct(event.pnl_pct || 0)})`}
              valueColor={pnlColor}
            />
          )}

          {isBuy && event.current_price && (
            <DetailRow label="현재가" value={`${formatPrice(event.current_price)}원`} />
          )}
          {isBuy && event.entry_price && (
            <DetailRow label="진입가" value={`${formatPrice(event.entry_price)}원`} />
          )}

          {!isBuy && event.exit_type && (
            <DetailRow label="청산 유형" value={event.exit_type} />
          )}
          {!isBuy && event.exit_reason && (
            <DetailRow label="청산 사유" value={event.exit_reason} />
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
  const [events, setEvents] = useState<TradeEventData[]>([]);
  const [allEvents, setAllEvents] = useState<TradeEventData[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedEvent, setSelectedEvent] = useState<TradeEventData | null>(null);

  const counts = useMemo(() => ({
    all: allEvents.length,
    buy: allEvents.filter((e) => e.event_type === 'BUY').length,
    sell: allEvents.filter((e) => e.event_type === 'SELL').length,
  }), [allEvents]);

  // 날짜 변경 시 거래 이벤트 로드
  useEffect(() => {
    loadEvents();
  }, [selectedDate, state.isDemo]);

  // 필터 변경 시 재조회
  useEffect(() => {
    loadFilteredEvents();
  }, [filter]);

  const loadEvents = async () => {
    if (state.isDemo) {
      setAllEvents(DEMO_TRADE_EVENTS);
      setEvents(DEMO_TRADE_EVENTS);
      setFilter('all');
      return;
    }
    setLoading(true);
    try {
      const dateStr = toDateString(selectedDate);
      const data = await apiClient.getTradeEvents(dateStr, 'all');
      setAllEvents(data);
      if (filter === 'all') {
        setEvents(data);
      } else {
        const filtered = await apiClient.getTradeEvents(dateStr, filter);
        setEvents(filtered);
      }
    } catch (e) {
      console.warn('[Trades] 거래 이벤트 로드 실패:', e);
      setAllEvents([]);
      setEvents([]);
    }
    setLoading(false);
  };

  const loadFilteredEvents = async () => {
    if (state.isDemo) {
      if (filter === 'all') {
        setEvents(DEMO_TRADE_EVENTS);
      } else {
        const type = filter === 'buy' ? 'BUY' : 'SELL';
        setEvents(DEMO_TRADE_EVENTS.filter((e) => e.event_type === type));
      }
      return;
    }
    if (allEvents.length === 0 && events.length === 0) return;
    try {
      const dateStr = toDateString(selectedDate);
      const data = await apiClient.getTradeEvents(dateStr, filter);
      setEvents(data);
    } catch (e) {
      console.warn('[Trades] 거래 이벤트 필터 실패:', e);
    }
  };

  return (
    <ScreenContainer refreshing={loading} onRefresh={loadEvents}>
      {state.isDemo && <DemoBadge />}
      <DateNavigator date={selectedDate} onChange={setSelectedDate} />
      <FilterTabs current={filter} counts={counts} onChange={setFilter} />
      <DailySummary events={allEvents} />
      <ExitTypeBar events={allEvents} />

      {loading ? (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <ActivityIndicator color={colors.primary} size="small" />
        </View>
      ) : (
        <EventList events={events} onPress={setSelectedEvent} />
      )}

      {selectedEvent && (
        <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </ScreenContainer>
  );
}
