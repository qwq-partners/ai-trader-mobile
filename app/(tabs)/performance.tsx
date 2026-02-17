import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useTradingData } from '@/lib/trading-data-provider';
import { apiClient } from '@/lib/api-client';
import type { TradeStats, EquityHistoryResponse, EquitySnapshot, PositionSnapshot } from '@/lib/api-client';
import { DEMO_STRATEGIES, formatKRW, formatPct, formatHoldingTime } from '@/lib/demo-data';
import { ScreenContainer } from '@/components/screen-container';
import { EquityChart } from '@/components/equity-chart';
import { useColors } from '@/hooks/use-colors';

// =============================================================================
// 데모 데이터
// =============================================================================

const DEMO_STATS: TradeStats = {
  total_trades: 120,
  wins: 59,
  losses: 61,
  win_rate: 49.2,
  total_pnl: 434000,
  avg_pnl_pct: 0.36,
  avg_holding_minutes: 262,
  best_trade: null,
  worst_trade: null,
  by_strategy: {
    momentum_breakout: { trades: 45, wins: 22, total_pnl: 156000, win_rate: 48.9 },
    sepa_trend: { trades: 28, wins: 15, total_pnl: 234000, win_rate: 53.6 },
    theme_chasing: { trades: 32, wins: 14, total_pnl: -45000, win_rate: 43.8 },
    gap_and_go: { trades: 15, wins: 8, total_pnl: 89000, win_rate: 53.3 },
  },
  open_trades: 0,
  open_pnl: 0,
  open_avg_pnl_pct: 0,
  all_trades: 120,
};

const DEMO_EQUITY_SNAPSHOTS: EquitySnapshot[] = Array.from({ length: 14 }, (_, i) => {
  const date = new Date(Date.now() - (13 - i) * 86400000);
  const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  const baseEquity = 10_000_000 + i * 18000 + (Math.random() - 0.4) * 50000;
  const dailyPnl = (Math.random() - 0.4) * 80000;
  return {
    date: dateStr,
    total_equity: Math.round(baseEquity),
    cash: Math.round(baseEquity * 0.5),
    positions_value: Math.round(baseEquity * 0.5),
    daily_pnl: Math.round(dailyPnl),
    daily_pnl_pct: parseFloat((dailyPnl / baseEquity * 100).toFixed(2)),
    trades_count: Math.floor(Math.random() * 6) + 1,
    position_count: Math.floor(Math.random() * 4) + 1,
    win_rate: Math.round(Math.random() * 100),
    positions: [],
    timestamp: new Date(date).toISOString(),
  };
});

const DEMO_EQUITY_SUMMARY: EquityHistoryResponse['summary'] = {
  period_return: 234500,
  period_return_pct: 2.35,
  max_drawdown_pct: -3.2,
  avg_daily_pnl: 18500,
  first_equity: 10_000_000,
  last_equity: 10_234_500,
  data_days: 14,
  oldest_date: '2026-02-01',
};

const DEMO_POSITIONS_FOR_DATE: PositionSnapshot[] = [
  { symbol: '005930', name: '삼성전자', quantity: 30, avg_price: 72500, current_price: 74200, pnl: 51000, pnl_pct: 2.34, weight: 21.7 },
  { symbol: '000660', name: 'SK하이닉스', quantity: 15, avg_price: 178000, current_price: 182500, pnl: 67500, pnl_pct: 2.53, weight: 26.7 },
];

// =============================================================================
// 서브 컴포넌트
// =============================================================================

function DemoBadge() {
  const colors = useColors();
  return (
    <View style={{
      backgroundColor: colors.warning + '20',
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 12,
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 4,
      alignItems: 'center',
    }}>
      <Text style={{ color: colors.warning, fontSize: 12, fontWeight: '600' }}>
        DEMO MODE - 샘플 데이터
      </Text>
    </View>
  );
}

function SubTabBar({
  activeTab,
  onChange,
}: {
  activeTab: 'analysis' | 'equity';
  onChange: (tab: 'analysis' | 'equity') => void;
}) {
  const colors = useColors();
  const tabs: { key: 'analysis' | 'equity'; label: string }[] = [
    { key: 'analysis', label: '성과 분석' },
    { key: 'equity', label: '자산 히스토리' },
  ];

  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 12,
      padding: 4,
    }}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 10,
              alignItems: 'center',
              backgroundColor: isActive ? colors.primary : 'transparent',
            }}
          >
            <Text style={{
              color: isActive ? '#ffffff' : colors.muted,
              fontSize: 14,
              fontWeight: isActive ? '700' : '500',
            }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function PeriodChips({
  selected,
  onChange,
  options,
}: {
  selected: number;
  onChange: (n: number) => void;
  options: number[];
}) {
  const colors = useColors();
  return (
    <View style={{
      flexDirection: 'row',
      marginHorizontal: 16,
      marginBottom: 12,
      gap: 8,
    }}>
      {options.map((opt) => {
        const isSelected = selected === opt;
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onChange(opt)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: isSelected ? colors.primary : colors.elevated,
            }}
          >
            <Text style={{
              color: isSelected ? '#ffffff' : colors.muted,
              fontSize: 13,
              fontWeight: isSelected ? '600' : '400',
            }}>
              {opt}일
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function StatsSummary({ stats }: { stats: TradeStats | null }) {
  const colors = useColors();

  const items = [
    { label: '총거래', value: stats ? `${stats.total_trades}건` : '-' },
    { label: '승률', value: stats ? `${stats.win_rate.toFixed(1)}%` : '-' },
    {
      label: '총손익',
      value: stats ? formatKRW(stats.total_pnl) : '-',
      color: stats ? (stats.total_pnl >= 0 ? colors.success : colors.error) : colors.foreground,
    },
    {
      label: '평균수익률',
      value: stats ? `${stats.avg_pnl_pct.toFixed(2)}%` : '-',
      color: stats ? (stats.avg_pnl_pct >= 0 ? colors.success : colors.error) : colors.foreground,
    },
    {
      label: '진행중',
      value: stats ? `${stats.open_trades}건` : '-',
    },
    { label: '평균보유', value: stats ? formatHoldingTime(stats.avg_holding_minutes) : '-' },
  ];

  return (
    <View style={{
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 12,
    }}>
      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
      }}>
        {items.map((item, i) => (
          <View key={i} style={{
            width: '33.33%',
            paddingVertical: 8,
            alignItems: 'center',
          }}>
            <Text style={{
              color: colors.muted,
              fontSize: 11,
              marginBottom: 4,
            }}>
              {item.label}
            </Text>
            <Text style={{
              color: item.color || colors.foreground,
              fontSize: 16,
              fontWeight: '700',
            }}>
              {item.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const STRATEGY_LABELS: Record<string, string> = {
  momentum_breakout: '모멘텀 돌파',
  sepa_trend: 'SEPA 추세',
  theme_chasing: '테마 추종',
  gap_and_go: '갭상승',
};

function StrategyCards({ stats, isDemo }: { stats: TradeStats | null; isDemo: boolean }) {
  const colors = useColors();

  const strategies = (isDemo
    ? DEMO_STRATEGIES
    : stats
      ? Object.entries(stats.by_strategy).map(([name, data]) => ({
          name,
          trades: data.trades,
          wins: data.wins,
          losses: data.trades - data.wins,
          win_rate: data.win_rate,
          total_pnl: data.total_pnl,
        }))
      : []
  ).sort((a, b) => b.total_pnl - a.total_pnl);

  return (
    <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
      <Text style={{
        color: colors.foreground,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 10,
      }}>
        전략별 성과
      </Text>
      {strategies.map((s, i) => (
        <View key={i} style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 8,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '600' }}>
              {STRATEGY_LABELS[s.name] || s.name}
            </Text>
            <Text style={{
              color: s.total_pnl >= 0 ? colors.success : colors.error,
              fontSize: 14,
              fontWeight: '700',
            }}>
              {s.total_pnl >= 0 ? '+' : ''}{formatKRW(s.total_pnl)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ color: colors.muted, fontSize: 12, width: 60 }}>
              {s.trades}건
            </Text>
            <View style={{ flex: 1, height: 6, backgroundColor: colors.elevated, borderRadius: 3 }}>
              <View style={{
                width: `${Math.min(s.win_rate, 100)}%`,
                height: 6,
                backgroundColor: s.win_rate >= 50 ? colors.success : colors.warning,
                borderRadius: 3,
              }} />
            </View>
            <Text style={{ color: colors.muted, fontSize: 12, width: 48, textAlign: 'right' }}>
              {s.win_rate.toFixed(1)}%
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.muted, fontSize: 11 }}>
              {s.wins}승 {s.losses}패
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// =============================================================================
// AnalysisView (성과 분석)
// =============================================================================

function AnalysisView() {
  const { state } = useTradingData();
  const colors = useColors();
  const [period, setPeriod] = useState(30);
  const [stats, setStats] = useState<TradeStats | null>(null);
  const [equityData, setEquityData] = useState<EquitySnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    loadData();
  }, [period, state.isDemo]);

  const loadData = async () => {
    if (state.isDemo) {
      setStats(DEMO_STATS);
      setEquityData(DEMO_EQUITY_SNAPSHOTS);
      return;
    }
    setLoading(true);
    try {
      const [statsData, equityResp] = await Promise.all([
        apiClient.getTradeStats(period),
        apiClient.getEquityHistory(period),
      ]);
      setStats(statsData);
      setEquityData(equityResp.snapshots);
    } catch {
      // 에러 시 기존 데이터 유지
    }
    setLoading(false);
  };

  return (
    <View>
      <PeriodChips selected={period} onChange={setPeriod} options={[7, 30, 90]} />

      {loading && (
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      <StatsSummary stats={stats} />

      <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
        <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700', marginBottom: 8 }}>
          자산 추이
        </Text>
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          paddingVertical: 8,
          overflow: 'hidden',
        }}>
          <EquityChart
            data={equityData.map(s => ({ date: s.date, equity: s.total_equity, pnl: s.daily_pnl }))}
            width={screenWidth - 32}
            height={220}
          />
        </View>
      </View>

      <StrategyCards stats={stats} isDemo={state.isDemo} />
    </View>
  );
}

// =============================================================================
// EquityHistoryView (자산 히스토리)
// =============================================================================

function EquitySummaryCard({ summary }: { summary?: EquityHistoryResponse['summary'] | null }) {
  const colors = useColors();

  const items = [
    {
      label: '기간수익률',
      value: summary ? formatPct(summary.period_return_pct) : '-',
      color: summary ? (summary.period_return_pct >= 0 ? colors.success : colors.error) : colors.foreground,
    },
    {
      label: '최대낙폭',
      value: summary ? `${summary.max_drawdown_pct.toFixed(1)}%` : '-',
      color: colors.error,
    },
    {
      label: '평균일일손익',
      value: summary ? formatKRW(summary.avg_daily_pnl) : '-',
      color: summary ? (summary.avg_daily_pnl >= 0 ? colors.success : colors.error) : colors.foreground,
    },
    {
      label: '데이터일수',
      value: summary ? `${summary.data_days}일` : '-',
    },
  ];

  return (
    <View style={{
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 12,
    }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {items.map((item, i) => (
          <View key={i} style={{
            width: '50%',
            paddingVertical: 8,
            alignItems: 'center',
          }}>
            <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>
              {item.label}
            </Text>
            <Text style={{
              color: item.color || colors.foreground,
              fontSize: 16,
              fontWeight: '700',
            }}>
              {item.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function DailyList({
  snapshots,
  onPress,
}: {
  snapshots: EquitySnapshot[];
  onPress: (date: string) => void;
}) {
  const colors = useColors();

  const reversed = [...snapshots].reverse();

  const renderItem = ({ item }: { item: EquitySnapshot }) => (
    <TouchableOpacity
      onPress={() => onPress(item.date)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <Text style={{ color: colors.foreground, fontSize: 13, flex: 1 }}>
        {item.date.slice(5)}
      </Text>
      <Text style={{ color: colors.foreground, fontSize: 13, flex: 1.2, textAlign: 'right' }}>
        {formatKRW(item.total_equity)}
      </Text>
      <Text style={{
        color: item.daily_pnl >= 0 ? colors.success : colors.error,
        fontSize: 13,
        flex: 1,
        textAlign: 'right',
        fontWeight: '600',
      }}>
        {item.daily_pnl >= 0 ? '+' : ''}{formatKRW(item.daily_pnl)}
      </Text>
      <Text style={{ color: colors.muted, fontSize: 12, width: 36, textAlign: 'right' }}>
        {item.trades_count}건
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={{
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginHorizontal: 16,
      marginBottom: 12,
      overflow: 'hidden',
    }}>
      <View style={{
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}>
        <Text style={{ color: colors.muted, fontSize: 11, flex: 1 }}>날짜</Text>
        <Text style={{ color: colors.muted, fontSize: 11, flex: 1.2, textAlign: 'right' }}>총자산</Text>
        <Text style={{ color: colors.muted, fontSize: 11, flex: 1, textAlign: 'right' }}>변동</Text>
        <Text style={{ color: colors.muted, fontSize: 11, width: 36, textAlign: 'right' }}>거래</Text>
      </View>
      <FlatList
        data={reversed}
        renderItem={renderItem}
        keyExtractor={(item) => item.date}
        scrollEnabled={false}
      />
    </View>
  );
}

function PositionBottomSheet({
  date,
  positions,
  onClose,
}: {
  date: string;
  positions: PositionSnapshot[];
  onClose: () => void;
}) {
  const colors = useColors();

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end',
        }}
      >
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: 12,
            paddingBottom: 40,
            maxHeight: Dimensions.get('window').height * 0.6,
          }}>
            {/* Handle bar */}
            <View style={{
              width: 40,
              height: 4,
              backgroundColor: colors.muted,
              borderRadius: 2,
              alignSelf: 'center',
              marginBottom: 12,
            }} />

            {/* Header */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 20,
              marginBottom: 16,
            }}>
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700' }}>
                {date} 보유 포지션
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>닫기</Text>
              </TouchableOpacity>
            </View>

            {positions.length === 0 ? (
              <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                <Text style={{ color: colors.muted, fontSize: 14 }}>포지션 데이터 없음</Text>
              </View>
            ) : (
              <FlatList
                data={positions}
                keyExtractor={(item) => item.symbol}
                renderItem={({ item }) => (
                  <View style={{
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '600' }}>
                        {item.name}
                      </Text>
                      <Text style={{
                        color: item.pnl >= 0 ? colors.success : colors.error,
                        fontSize: 14,
                        fontWeight: '700',
                      }}>
                        {item.pnl >= 0 ? '+' : ''}{formatKRW(item.pnl)}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: colors.muted, fontSize: 12 }}>
                        {item.quantity}주 | 평균 {item.avg_price.toLocaleString()}원
                      </Text>
                      <Text style={{
                        color: item.pnl_pct >= 0 ? colors.success : colors.error,
                        fontSize: 12,
                      }}>
                        {formatPct(item.pnl_pct)}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                      <Text style={{ color: colors.muted, fontSize: 11 }}>
                        현재가 {item.current_price.toLocaleString()}원
                      </Text>
                      <Text style={{ color: colors.muted, fontSize: 11 }}>
                        비중 {item.weight.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function EquityHistoryView() {
  const { state } = useTradingData();
  const colors = useColors();
  const [period, setPeriod] = useState(30);
  const [historyData, setHistoryData] = useState<EquityHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [datePositions, setDatePositions] = useState<PositionSnapshot[]>([]);
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    loadHistory();
  }, [period, state.isDemo]);

  const loadHistory = async () => {
    if (state.isDemo) {
      setHistoryData({
        snapshots: DEMO_EQUITY_SNAPSHOTS,
        summary: DEMO_EQUITY_SUMMARY,
      });
      return;
    }
    setLoading(true);
    try {
      const data = await apiClient.getEquityHistory(period);
      setHistoryData(data);
    } catch {
      // 에러 시 기존 데이터 유지
    }
    setLoading(false);
  };

  const loadPositions = async (date: string) => {
    setSelectedDate(date);
    if (state.isDemo) {
      setDatePositions(DEMO_POSITIONS_FOR_DATE);
      return;
    }
    try {
      const positions = await apiClient.getEquityPositions(date);
      setDatePositions(positions);
    } catch {
      setDatePositions([]);
    }
  };

  return (
    <View>
      <PeriodChips selected={period} onChange={setPeriod} options={[7, 14, 30]} />

      {loading && (
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      <EquitySummaryCard summary={historyData?.summary} />

      <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          paddingVertical: 8,
          overflow: 'hidden',
        }}>
          <EquityChart
            data={(historyData?.snapshots || []).map(s => ({
              date: s.date,
              equity: s.total_equity,
              pnl: s.daily_pnl,
            }))}
            width={screenWidth - 32}
            height={220}
            showArea
          />
        </View>
      </View>

      <DailyList
        snapshots={historyData?.snapshots || []}
        onPress={loadPositions}
      />

      {selectedDate && (
        <PositionBottomSheet
          date={selectedDate}
          positions={datePositions}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </View>
  );
}

// =============================================================================
// 메인 화면
// =============================================================================

export default function PerformanceScreen() {
  const { state } = useTradingData();
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<'analysis' | 'equity'>('analysis');

  return (
    <ScreenContainer>
      {state.isDemo && <DemoBadge />}
      <SubTabBar activeTab={activeTab} onChange={setActiveTab} />
      {activeTab === 'analysis' ? <AnalysisView /> : <EquityHistoryView />}
    </ScreenContainer>
  );
}
