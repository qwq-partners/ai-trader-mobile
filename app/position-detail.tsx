import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTradingData, getDemoPositions } from '@/lib/trading-data-provider';
import { formatKRW, formatPct, formatPrice } from '@/lib/demo-data';
import { useColors } from '@/hooks/use-colors';
import type { ThemeColors } from '@/constants/theme';
import type { PositionData } from '@/lib/api-client';
import Svg, { Line, Rect, Text as SvgText, Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

// =============================================================================
// 헤더
// =============================================================================

function Header({
  name,
  symbol,
  onClose,
  colors,
}: {
  name: string;
  symbol: string;
  onClose: () => void;
  colors: ThemeColors;
}) {
  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '700' }}>
          {name}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginLeft: 8 }}>
          {symbol}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onClose}
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: colors.elevated,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: colors.muted, fontSize: 16, fontWeight: '700' }}>
          {'\u2715'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// =============================================================================
// 손익 히어로
// =============================================================================

function PnlHero({ position, colors }: { position: PositionData; colors: ThemeColors }) {
  const pnlColor = position.unrealized_pnl >= 0 ? colors.profit : colors.loss;

  return (
    <View style={{
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 12,
    }}>
      {/* 현재가 */}
      <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: '700' }}>
        {formatPrice(position.current_price)}원
      </Text>

      {/* 미실현 손익 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
        <Text style={{ color: pnlColor, fontSize: 18, fontWeight: '700' }}>
          {position.unrealized_pnl >= 0 ? '+' : ''}{formatKRW(position.unrealized_pnl)}
        </Text>
        <Text style={{ color: pnlColor, fontSize: 14, marginLeft: 8 }}>
          ({formatPct(position.unrealized_pnl_pct)})
        </Text>
      </View>

      {/* 평가금액 */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
        <View>
          <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 2 }}>평가금액</Text>
          <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '600' }}>
            {formatKRW(position.market_value)}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 2 }}>매입금액</Text>
          <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '600' }}>
            {formatKRW(position.cost_basis)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// =============================================================================
// 가격 레벨 차트 (SVG)
// =============================================================================

function PriceLevelChart({ position, colors }: { position: PositionData; colors: ThemeColors }) {
  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = windowWidth - 32; // marginHorizontal: 16 * 2
  const chartHeight = 200;
  const paddingLeft = 12;
  const paddingRight = 100; // 라벨 공간
  const paddingTop = 20;
  const paddingBottom = 20;
  const lineWidth = chartWidth - paddingLeft - paddingRight;

  const avgPrice = position.avg_price;
  const currentPrice = position.current_price;
  const stopLoss = position.stop_loss;
  const stopLossPrice = stopLoss ? Math.round(stopLoss) : Math.round(avgPrice * (1 - 2.5 / 100));
  const firstExitPrice = Math.round(avgPrice * (1 + 2.5 / 100));
  const highestPrice = position.highest_price;

  // 모든 가격 레벨 수집
  const prices = [avgPrice, currentPrice, stopLossPrice, firstExitPrice];
  if (highestPrice) prices.push(highestPrice);

  const minPrice = Math.min(...prices) * 0.998;
  const maxPrice = Math.max(...prices) * 1.002;
  const priceRange = maxPrice - minPrice;

  const priceToY = (price: number): number => {
    if (priceRange === 0) return chartHeight / 2;
    return paddingTop + ((maxPrice - price) / priceRange) * (chartHeight - paddingTop - paddingBottom);
  };

  interface PriceLevel {
    price: number;
    y: number;
    label: string;
    color: string;
    dashArray: string;
    isCurrent: boolean;
  }

  const levels: PriceLevel[] = [
    {
      price: stopLossPrice,
      y: priceToY(stopLossPrice),
      label: '손절가',
      color: colors.error,
      dashArray: '6,4',
      isCurrent: false,
    },
    {
      price: avgPrice,
      y: priceToY(avgPrice),
      label: '진입가',
      color: colors.info,
      dashArray: '6,4',
      isCurrent: false,
    },
    {
      price: currentPrice,
      y: priceToY(currentPrice),
      label: '현재가',
      color: colors.foreground,
      dashArray: '',
      isCurrent: true,
    },
    {
      price: firstExitPrice,
      y: priceToY(firstExitPrice),
      label: '1차 익절',
      color: colors.success,
      dashArray: '6,4',
      isCurrent: false,
    },
  ];

  if (highestPrice) {
    levels.push({
      price: highestPrice,
      y: priceToY(highestPrice),
      label: '최고가',
      color: colors.warning,
      dashArray: '4,4',
      isCurrent: false,
    });
  }

  // y 기준 정렬 (위에서 아래로)
  levels.sort((a, b) => a.y - b.y);

  return (
    <View style={{
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 12,
    }}>
      <Svg width={chartWidth} height={chartHeight}>
        {/* 배경 */}
        <Rect x={0} y={0} width={chartWidth} height={chartHeight} fill="transparent" />

        {levels.map((level, idx) => (
          <React.Fragment key={idx}>
            {/* 가격 라인 */}
            <Line
              x1={paddingLeft}
              y1={level.y}
              x2={paddingLeft + lineWidth}
              y2={level.y}
              stroke={level.color}
              strokeWidth={level.isCurrent ? 2 : 1}
              strokeDasharray={level.dashArray || undefined}
            />
            {/* 현재가에 원형 강조 */}
            {level.isCurrent && (
              <Circle
                cx={paddingLeft + lineWidth}
                cy={level.y}
                r={4}
                fill={level.color}
              />
            )}
            {/* 라벨 */}
            <SvgText
              x={paddingLeft + lineWidth + 8}
              y={level.y - 6}
              fill={level.color}
              fontSize={10}
              fontWeight="600"
            >
              {level.label}
            </SvgText>
            {/* 가격 */}
            <SvgText
              x={paddingLeft + lineWidth + 8}
              y={level.y + 8}
              fill={level.color}
              fontSize={11}
              fontWeight="700"
            >
              {formatPrice(level.price)}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
}

// =============================================================================
// 포지션 상세 정보
// =============================================================================

function DetailCard({ label, value, colors }: { label: string; value: string; colors: ThemeColors }) {
  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.elevated,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
    }}>
      <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>{label}</Text>
      <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

const STRATEGY_LABELS: Record<string, string> = {
  momentum_breakout: '모멘텀',
  sepa_trend: 'SEPA',
  theme_chasing: '테마',
  gap_and_go: '갭상승',
};

function PositionDetails({ position, colors }: { position: PositionData; colors: ThemeColors }) {
  const entryTime = position.entry_time;
  const dateStr = entryTime
    ? (() => {
        const d = new Date(entryTime);
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      })()
    : '-';
  const investedAmount = position.avg_price * position.quantity;

  return (
    <View style={{
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 12,
    }}>
      {/* 1행: 수량, 평균가, 현재가 */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        <DetailCard label="수량" value={`${position.quantity}주`} colors={colors} />
        <DetailCard label="평균가" value={`${formatPrice(position.avg_price)}원`} colors={colors} />
        <DetailCard label="현재가" value={`${formatPrice(position.current_price)}원`} colors={colors} />
      </View>

      {/* 2행: 투자금, 평가금, 전략 */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <DetailCard label="투자금" value={formatKRW(investedAmount)} colors={colors} />
        <DetailCard label="평가금" value={formatKRW(position.market_value)} colors={colors} />
        <DetailCard label="전략" value={STRATEGY_LABELS[position.strategy || ''] || position.strategy || '-'} colors={colors} />
      </View>

      {/* 진입일 */}
      <View style={{
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
      }}>
        <Text style={{ color: colors.muted, fontSize: 12 }}>진입일</Text>
        <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '600' }}>{dateStr}</Text>
      </View>
    </View>
  );
}

// =============================================================================
// 청산 진행 상태
// =============================================================================

const EXIT_STATE_MAP: Record<string, { label: string; color: string; bgColor: string }> = {
  none: { label: '대기', color: '#94a3b8', bgColor: 'rgba(148,163,184,0.15)' },
  monitoring: { label: '모니터링 중', color: '#94a3b8', bgColor: 'rgba(148,163,184,0.15)' },
  breakeven: { label: '본전 이동 활성', color: '#60a5fa', bgColor: 'rgba(96,165,250,0.15)' },
  trailing: { label: '트레일링 스탑 활성', color: '#34d399', bgColor: 'rgba(52,211,153,0.15)' },
  first_exit: { label: '1차 익절 완료', color: '#a78bfa', bgColor: 'rgba(167,139,250,0.15)' },
};

function ExitProgress({ position, colors }: { position: PositionData; colors: ThemeColors }) {
  const exitStage = position.exit_state?.stage || 'none';
  const exitState = EXIT_STATE_MAP[exitStage] || EXIT_STATE_MAP.none;
  const exitInfo = position.exit_state;

  return (
    <View style={{
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 12,
    }}>
      <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '700', marginBottom: 12 }}>
        청산 상태
      </Text>

      {/* 현재 상태 배지 */}
      <View style={{
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: exitState.bgColor,
        marginBottom: 16,
      }}>
        <Text style={{ color: exitState.color, fontSize: 13, fontWeight: '600' }}>
          {exitState.label}
        </Text>
      </View>

      {/* 청산 상태 상세 정보 */}
      {exitInfo && (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{
            flex: 1,
            backgroundColor: colors.elevated,
            borderRadius: 8,
            padding: 10,
            alignItems: 'center',
          }}>
            <Text style={{ color: colors.muted, fontSize: 10, marginBottom: 4 }}>원래수량</Text>
            <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600' }}>
              {exitInfo.original_quantity}주
            </Text>
          </View>
          <View style={{
            flex: 1,
            backgroundColor: colors.elevated,
            borderRadius: 8,
            padding: 10,
            alignItems: 'center',
          }}>
            <Text style={{ color: colors.muted, fontSize: 10, marginBottom: 4 }}>잔여수량</Text>
            <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600' }}>
              {exitInfo.remaining_quantity}주
            </Text>
          </View>
          <View style={{
            flex: 1,
            backgroundColor: colors.elevated,
            borderRadius: 8,
            padding: 10,
            alignItems: 'center',
          }}>
            <Text style={{ color: colors.muted, fontSize: 10, marginBottom: 4 }}>실현손익</Text>
            <Text style={{
              color: exitInfo.realized_pnl >= 0 ? colors.success : colors.error,
              fontSize: 13,
              fontWeight: '600',
            }}>
              {formatKRW(exitInfo.realized_pnl)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// =============================================================================
// 메인 화면
// =============================================================================

export default function PositionDetailModal() {
  const { symbol, name } = useLocalSearchParams<{ symbol: string; name: string }>();
  const { state } = useTradingData();
  const colors = useColors();
  const router = useRouter();

  const positions = state.isDemo ? getDemoPositions() : state.positions;
  const position = positions.find(p => p.symbol === symbol);

  if (!position) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.muted, fontSize: 14 }}>포지션을 찾을 수 없습니다</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 16, padding: 12, backgroundColor: colors.primary, borderRadius: 8 }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>돌아가기</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Header name={position.name} symbol={position.symbol} onClose={() => router.back()} colors={colors} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        <PnlHero position={position} colors={colors} />
        <PriceLevelChart position={position} colors={colors} />
        <PositionDetails position={position} colors={colors} />
        <ExitProgress position={position} colors={colors} />
      </ScrollView>
    </SafeAreaView>
  );
}
