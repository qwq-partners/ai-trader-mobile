import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { apiClient } from '@/lib/api-client';
import type { DailySettlementData, SettlementSellItem, SettlementBuyItem, SettlementHoldingItem } from '@/lib/api-client';
import { formatKRW, formatPct } from '@/lib/demo-data';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { toDateString, getPnlColor } from '@/lib/utils';

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
// SummaryCards
// =============================================================================

function SummaryCards({ data }: { data: DailySettlementData }) {
  const colors = useColors();
  const s = data.summary;

  const cards = [
    { label: '실현손익', value: formatKRW(s.realized_pnl), color: getPnlColor(s.realized_pnl, colors) },
    { label: '미실현손익', value: formatKRW(s.unrealized_pnl), color: getPnlColor(s.unrealized_pnl, colors) },
    { label: '총손익', value: formatKRW(s.total_pnl), color: getPnlColor(s.total_pnl, colors) },
    { label: '승/패', value: `${s.win_count} / ${s.loss_count}`, color: colors.foreground },
    { label: '매수/매도', value: `${s.buy_count} / ${s.sell_count}`, color: colors.foreground },
  ];

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: 16,
        marginTop: 12,
        gap: 8,
      }}
    >
      {cards.map((card, i) => (
        <View
          key={i}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 10,
            padding: 12,
            width: i < 2 ? '48.5%' : '31%',
            flexGrow: i >= 2 ? 1 : 0,
          }}
        >
          <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>{card.label}</Text>
          <Text style={{ color: card.color, fontSize: i < 3 ? 16 : 15, fontWeight: '700' }}>{card.value}</Text>
        </View>
      ))}
    </View>
  );
}

// =============================================================================
// SectionTitle
// =============================================================================

function SectionTitle({ title, count }: { title: string; count: number }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 20, marginBottom: 8 }}>
      <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700' }}>{title}</Text>
      <View style={{
        backgroundColor: colors.primary + '22',
        borderRadius: 10,
        paddingHorizontal: 7,
        paddingVertical: 2,
        marginLeft: 8,
      }}>
        <Text style={{ color: colors.primaryLight, fontSize: 11, fontWeight: '700' }}>{count}</Text>
      </View>
    </View>
  );
}

// =============================================================================
// SellList
// =============================================================================

function SellList({ sells }: { sells: SettlementSellItem[] }) {
  const colors = useColors();
  if (sells.length === 0) {
    return (
      <Text style={{ color: colors.muted, fontSize: 13, marginHorizontal: 16, marginTop: 4 }}>없음</Text>
    );
  }

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 12, marginHorizontal: 16, paddingVertical: 4 }}>
      {sells.map((item, idx) => {
        const pnlColor = getPnlColor(item.pnl, colors);
        return (
          <View
            key={item.odno + idx}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderTopWidth: idx > 0 ? 1 : 0,
              borderTopColor: colors.border,
            }}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600' }}>{item.name}</Text>
                <Text style={{ color: colors.muted, fontSize: 11 }}>{item.quantity}주</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <Text style={{ color: colors.muted, fontSize: 11 }}>{item.time}</Text>
                <Text style={{ color: colors.muted, fontSize: 11 }}>매도 {item.price.toLocaleString()}</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: pnlColor, fontSize: 14, fontWeight: '700' }}>
                {item.pnl >= 0 ? '+' : ''}{formatKRW(item.pnl)}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Text style={{ color: pnlColor, fontSize: 11 }}>{formatPct(item.pnl_pct)}</Text>
                <View style={{
                  backgroundColor: colors.elevated,
                  borderRadius: 4,
                  paddingHorizontal: 5,
                  paddingVertical: 1,
                }}>
                  <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '600' }}>{item.exit_type}</Text>
                </View>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// =============================================================================
// BuyList
// =============================================================================

function BuyList({ buys }: { buys: SettlementBuyItem[] }) {
  const colors = useColors();
  if (buys.length === 0) {
    return (
      <Text style={{ color: colors.muted, fontSize: 13, marginHorizontal: 16, marginTop: 4 }}>없음</Text>
    );
  }

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 12, marginHorizontal: 16, paddingVertical: 4 }}>
      {buys.map((item, idx) => (
        <View
          key={item.odno + idx}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderTopWidth: idx > 0 ? 1 : 0,
            borderTopColor: colors.border,
          }}
        >
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600' }}>{item.name}</Text>
              <Text style={{ color: colors.muted, fontSize: 11 }}>{item.quantity}주</Text>
            </View>
            <Text style={{ color: colors.muted, fontSize: 11, marginTop: 3 }}>{item.time}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600' }}>
              {item.price.toLocaleString()}원
            </Text>
            <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>
              총 {formatKRW(item.total)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// =============================================================================
// HoldingsList
// =============================================================================

function HoldingsList({ holdings }: { holdings: SettlementHoldingItem[] }) {
  const colors = useColors();
  if (holdings.length === 0) {
    return (
      <Text style={{ color: colors.muted, fontSize: 13, marginHorizontal: 16, marginTop: 4 }}>없음</Text>
    );
  }

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 12, marginHorizontal: 16, paddingVertical: 4 }}>
      {holdings.map((item, idx) => {
        const pnlColor = getPnlColor(item.unrealized_pnl, colors);
        return (
          <View
            key={item.symbol + idx}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderTopWidth: idx > 0 ? 1 : 0,
              borderTopColor: colors.border,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600' }}>{item.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <Text style={{ color: colors.muted, fontSize: 11 }}>{item.quantity}주</Text>
                <Text style={{ color: colors.muted, fontSize: 11 }}>평단 {item.avg_price.toLocaleString()}</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600' }}>
                {item.current_price.toLocaleString()}원
              </Text>
              <Text style={{ color: pnlColor, fontSize: 12, fontWeight: '600', marginTop: 2 }}>
                {item.unrealized_pnl >= 0 ? '+' : ''}{formatKRW(item.unrealized_pnl)} ({formatPct(item.unrealized_pct)})
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// =============================================================================
// SettlementScreen
// =============================================================================

export default function SettlementScreen() {
  const colors = useColors();
  const [date, setDate] = useState(new Date());
  const [data, setData] = useState<DailySettlementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (targetDate: Date) => {
    setLoading(true);
    setError(null);
    try {
      const dateStr = toDateString(targetDate);
      const result = await apiClient.getDailySettlement(dateStr);
      if (result.error) {
        setError(result.error);
      }
      setData(result);
    } catch (e: any) {
      setError(e.message || '데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(date);
  }, [date, loadData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData(date);
    setRefreshing(false);
  }, [date, loadData]);

  const handleDateChange = useCallback((d: Date) => {
    setDate(d);
  }, []);

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={handleRefresh}>
      <DateNavigator date={date} onChange={handleDateChange} />

      {loading && !refreshing && (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {error && !loading && (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <Text style={{ color: colors.loss, fontSize: 14, marginBottom: 12 }}>{error}</Text>
          <TouchableOpacity
            onPress={() => loadData(date)}
            style={{ backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 }}
          >
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      )}

      {data && !loading && (
        <>
          <SummaryCards data={data} />

          <SectionTitle title="매도 체결" count={data.sells.length} />
          <SellList sells={data.sells} />

          <SectionTitle title="매수 체결" count={data.buys.length} />
          <BuyList buys={data.buys} />

          <SectionTitle title="보유 종목" count={data.holdings.length} />
          <HoldingsList holdings={data.holdings} />
        </>
      )}
    </ScreenContainer>
  );
}
