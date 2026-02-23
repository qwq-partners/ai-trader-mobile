import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, Alert } from 'react-native';
import { useTradingData } from '@/lib/trading-data-provider';
import { apiClient } from '@/lib/api-client';
import type { DailyReviewData, EvolutionData, EvolutionHistoryItem } from '@/lib/api-client';
import { DEMO_EVOLUTION, DEMO_EVOLUTION_HISTORY, formatKRW, formatPct } from '@/lib/demo-data';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import type { ThemeColors } from '@/constants/theme';

// =============================================================================
// 공통 컴포넌트
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

interface SubTabBarProps {
  activeTab: string;
  onChange: (tab: any) => void;
  tabs: Array<{ key: string; label: string }>;
  colors: ThemeColors;
}

function SubTabBar({ activeTab, onChange, tabs, colors }: SubTabBarProps) {
  return (
    <View style={{
      flexDirection: 'row',
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 12,
    }}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.7}
            onPress={() => onChange(tab.key)}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 10,
              borderBottomWidth: 2,
              borderBottomColor: isActive ? colors.primary : 'transparent',
            }}
          >
            <Text style={{
              color: isActive ? colors.foreground : colors.muted,
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

// =============================================================================
// 일일 리뷰 컴포넌트
// =============================================================================

function ReviewDateNav({ date, hasPrev, hasNext, onPrev, onNext, colors }: {
  date?: string;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  colors: ThemeColors;
}) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 16,
      marginBottom: 12,
      gap: 16,
    }}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPrev}
        disabled={!hasPrev}
        style={{ opacity: hasPrev ? 1 : 0.3, padding: 8 }}
      >
        <Text style={{ color: colors.foreground, fontSize: 20 }}>{'\u25C0'}</Text>
      </TouchableOpacity>
      <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700' }}>
        {date || '-'}
      </Text>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onNext}
        disabled={!hasNext}
        style={{ opacity: hasNext ? 1 : 0.3, padding: 8 }}
      >
        <Text style={{ color: colors.foreground, fontSize: 20 }}>{'\u25B6'}</Text>
      </TouchableOpacity>
    </View>
  );
}

// DailyReviewData is now { date, trade_report: any, llm_review: any }
// We render based on the actual data structure from the server

const STRATEGY_NAMES: Record<string, string> = {
  momentum_breakout: '모멘텀',
  theme_chasing: '테마추종',
  gap_and_go: '갭상승',
  mean_reversion: '평균회귀',
  sepa_trend: 'SEPA',
  rsi2_reversal: 'RSI2',
  strategic_swing: '전략스윙',
};

const EXIT_TYPE_NAMES: Record<string, string> = {
  take_profit: '익절',
  first_take_profit: '1차익절',
  second_take_profit: '2차익절',
  third_take_profit: '3차익절',
  stop_loss: '손절',
  trailing: '트레일링',
  trailing_stop: '트레일링',
  breakeven: '본전',
  manual: '수동',
  kis_sync: '동기화',
  profit_taking: '익절',
  time_exit: '시간청산',
};

function ReviewContent({ review, colors }: { review: DailyReviewData; colors: ThemeColors }) {
  const [expandedTrade, setExpandedTrade] = useState<number | null>(null);

  const tradeReport = review.trade_report;
  const llmReview = review.llm_review;

  if (!tradeReport && !llmReview) {
    return (
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 32,
        marginHorizontal: 16,
        marginTop: 20,
        alignItems: 'center',
      }}>
        <Text style={{ color: colors.muted, fontSize: 13 }}>해당 날짜의 리뷰 데이터가 없습니다</Text>
      </View>
    );
  }

  // Extract summary from trade_report
  const summary = tradeReport?.summary;
  const totalTrades = summary?.total_trades ?? tradeReport?.trades?.length ?? 0;
  const winRate = summary?.win_rate ?? 0;
  const totalPnl = summary?.total_pnl ?? 0;
  const pnlColor = totalPnl >= 0 ? colors.profit : colors.loss;

  // Extract LLM review data
  const overallGrade = llmReview?.overall_grade ?? '-';
  const gradeColorMap: Record<string, string> = {
    A: colors.success,
    B: colors.info,
    C: colors.warning,
    D: colors.error,
    F: colors.error,
  };
  const gradeColor = gradeColorMap[overallGrade?.charAt?.(0)] || colors.muted;

  const keyInsights = llmReview?.key_insights ?? [];
  const mistakes = llmReview?.mistakes ?? [];
  const improvements = llmReview?.improvements ?? [];

  return (
    <View>
      {/* Summary cards */}
      <View style={{
        flexDirection: 'row',
        gap: 8,
        marginHorizontal: 16,
        marginBottom: 8,
      }}>
        <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: 'center' }}>
          <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>거래수</Text>
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700' }}>
            {totalTrades}건
          </Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: 'center' }}>
          <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>승/패</Text>
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700' }}>
            <Text style={{ color: colors.profit }}>{summary?.wins ?? 0}</Text>
            {'/'}
            <Text style={{ color: colors.loss }}>{summary?.losses ?? 0}</Text>
          </Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: 'center' }}>
          <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>승률</Text>
          <Text style={{ color: winRate >= 50 ? colors.profit : winRate > 0 ? colors.loss : colors.foreground, fontSize: 16, fontWeight: '700' }}>
            {formatPct(winRate, false)}
          </Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: 'center' }}>
          <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>총손익</Text>
          <Text style={{ color: pnlColor, fontSize: 16, fontWeight: '700' }}>
            {formatKRW(totalPnl)}
          </Text>
        </View>
      </View>
      <View style={{
        flexDirection: 'row',
        gap: 8,
        marginHorizontal: 16,
        marginBottom: 12,
      }}>
        <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: 'center' }}>
          <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>PF</Text>
          <Text style={{ color: (summary?.profit_factor ?? 0) >= 1 ? colors.profit : colors.loss, fontSize: 16, fontWeight: '700' }}>
            {summary?.profit_factor?.toFixed(2) ?? '--'}
          </Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: 'center' }}>
          <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>최고</Text>
          <Text style={{ color: colors.profit, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
            {summary?.best_trade ? `${summary.best_trade.name} ${formatPct(summary.best_trade.pnl_pct)}` : '--'}
          </Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: 'center' }}>
          <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>최저</Text>
          <Text style={{ color: colors.loss, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
            {summary?.worst_trade ? `${summary.worst_trade.name} ${formatPct(summary.worst_trade.pnl_pct)}` : '--'}
          </Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: 'center' }}>
          <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>LLM평가</Text>
          <Text style={{ color: gradeColor, fontSize: 20, fontWeight: '800' }}>
            {overallGrade}
          </Text>
        </View>
      </View>

      {/* Trade list from trade_report */}
      {tradeReport?.trades && tradeReport.trades.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.foreground, marginHorizontal: 16, marginBottom: 8 }}>
            거래 복기
          </Text>
          {[...tradeReport.trades].sort((a: any, b: any) => (b.pnl_pct ?? 0) - (a.pnl_pct ?? 0)).map((trade: any, idx: number) => {
            const isExpanded = expandedTrade === idx;
            const tradePnl = trade.pnl ?? 0;
            const tradePnlPct = trade.pnl_pct ?? 0;
            const tradePnlColor = tradePnl >= 0 ? colors.profit : colors.loss;

            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.7}
                onPress={() => setExpandedTrade(isExpanded ? null : idx)}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  marginHorizontal: 16,
                  marginBottom: 8,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                    <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '700' }}>
                      {trade.name || trade.symbol}
                    </Text>
                    {trade.entry_strategy && (
                      <View style={{
                        marginLeft: 8,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                        backgroundColor: colors.elevated,
                      }}>
                        <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '600' }}>
                          {STRATEGY_NAMES[trade.entry_strategy] || trade.entry_strategy}
                        </Text>
                      </View>
                    )}
                    {trade.exit_type && (
                      <View style={{
                        marginLeft: 4,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                        backgroundColor: tradePnl >= 0 ? `${colors.profit}20` : `${colors.loss}20`,
                      }}>
                        <Text style={{ color: tradePnl >= 0 ? colors.profit : colors.loss, fontSize: 10, fontWeight: '600' }}>
                          {EXIT_TYPE_NAMES[trade.exit_type] || trade.exit_type}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: tradePnlColor, fontSize: 15, fontWeight: '700' }}>
                      {formatPct(tradePnlPct)}
                    </Text>
                    <Text style={{ color: tradePnlColor, fontSize: 11 }}>
                      {tradePnl >= 0 ? '+' : ''}{formatKRW(tradePnl)}
                    </Text>
                  </View>
                </View>

                <View style={{ marginTop: 8, gap: 4 }}>
                  {trade.entry_reason ? (
                    <View style={{ flexDirection: 'row' }}>
                      <Text style={{ color: colors.info, fontSize: 11, fontWeight: '600', width: 32 }}>진입</Text>
                      <Text style={{ color: colors.muted, fontSize: 11, flex: 1 }}>{trade.entry_reason}</Text>
                    </View>
                  ) : null}
                  {trade.exit_reason ? (
                    <View style={{ flexDirection: 'row' }}>
                      <Text style={{ color: colors.error, fontSize: 11, fontWeight: '600', width: 32 }}>퇴출</Text>
                      <Text style={{ color: colors.muted, fontSize: 11, flex: 1 }}>{trade.exit_reason}</Text>
                    </View>
                  ) : null}
                </View>

                {isExpanded && trade.llm_analysis ? (
                  <View style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                  }}>
                    <Text style={{ color: colors.primaryLight, fontSize: 11, fontWeight: '700', marginBottom: 4 }}>
                      AI 분석
                    </Text>
                    <Text style={{ color: colors.foreground, fontSize: 12, lineHeight: 18 }}>
                      {trade.llm_analysis}
                    </Text>
                  </View>
                ) : null}

                <Text style={{ color: colors.muted, fontSize: 10, textAlign: 'center', marginTop: 6 }}>
                  {isExpanded ? '\u25B2 접기' : '\u25BC 상세'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* LLM Insights */}
      {llmReview && (
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 16,
          marginHorizontal: 16,
          marginBottom: 12,
        }}>
          <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '700', marginBottom: 12 }}>
            AI 종합 평가
          </Text>

          {keyInsights.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              {keyInsights.map((insight: string, idx: number) => (
                <View key={idx} style={{ flexDirection: 'row', marginBottom: 4 }}>
                  <Text style={{ color: colors.primary, fontSize: 12, marginRight: 6 }}>{'\u2022'}</Text>
                  <Text style={{ color: colors.foreground, fontSize: 12, lineHeight: 18, flex: 1 }}>{insight}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: colors.elevated, borderRadius: 8, padding: 12 }}>
              <Text style={{ color: colors.error, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>
                실수/회피
              </Text>
              {mistakes.length > 0 ? (
                mistakes.map((item: string, idx: number) => (
                  <View key={idx} style={{ flexDirection: 'row', marginBottom: 3 }}>
                    <Text style={{ color: colors.error, fontSize: 11, marginRight: 4 }}>{'\u2022'}</Text>
                    <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 16, flex: 1 }}>{item}</Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: colors.muted, fontSize: 11 }}>-</Text>
              )}
            </View>

            <View style={{ flex: 1, backgroundColor: colors.elevated, borderRadius: 8, padding: 12 }}>
              <Text style={{ color: colors.success, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>
                개선점
              </Text>
              {improvements.length > 0 ? (
                improvements.map((item: string, idx: number) => (
                  <View key={idx} style={{ flexDirection: 'row', marginBottom: 3 }}>
                    <Text style={{ color: colors.success, fontSize: 11, marginRight: 4 }}>{'\u2022'}</Text>
                    <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 16, flex: 1 }}>{item}</Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: colors.muted, fontSize: 11 }}>-</Text>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

function DemoReviewPlaceholder({ colors }: { colors: ThemeColors }) {
  return (
    <View style={{
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 32,
      marginHorizontal: 16,
      marginTop: 40,
      alignItems: 'center',
    }}>
      <Text style={{ color: colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 22 }}>
        서버에 연결하면{'\n'}일일 리뷰를 확인할 수 있습니다
      </Text>
    </View>
  );
}

// =============================================================================
// 일일 리뷰 뷰
// =============================================================================

function DailyReviewView({ colors }: { colors: ThemeColors }) {
  const { state } = useTradingData();
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [review, setReview] = useState<DailyReviewData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!state.isDemo) loadDates();
  }, [state.isDemo]);

  const loadDates = async () => {
    try {
      const resp = await apiClient.getDailyReviewDates();
      setAvailableDates(resp.dates || []);
      if (resp.dates?.length > 0) loadReview(resp.dates[0]);
    } catch (e) {
      console.warn('[Review] 날짜 목록 로드 실패:', e);
    }
  };

  const loadReview = async (date: string) => {
    setLoading(true);
    try {
      const data = await apiClient.getDailyReview(date);
      setReview(data);
    } catch (e) {
      console.warn('[Review] 리뷰 로드 실패:', e);
    }
    setLoading(false);
  };

  const navigateDate = (direction: -1 | 1) => {
    const newIdx = currentDateIndex + direction;
    if (newIdx >= 0 && newIdx < availableDates.length) {
      setCurrentDateIndex(newIdx);
      loadReview(availableDates[newIdx]);
    }
  };

  // 데모 모드
  if (state.isDemo) {
    return <DemoReviewPlaceholder colors={colors} />;
  }

  return (
    <View>
      <ReviewDateNav
        date={availableDates[currentDateIndex]}
        hasPrev={currentDateIndex < availableDates.length - 1}
        hasNext={currentDateIndex > 0}
        onPrev={() => navigateDate(1)}
        onNext={() => navigateDate(-1)}
        colors={colors}
      />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <>
          {review && <ReviewContent review={review} colors={colors} />}
          {!review && availableDates.length === 0 && (
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 32,
              marginHorizontal: 16,
              marginTop: 20,
              alignItems: 'center',
            }}>
              <Text style={{ color: colors.muted, fontSize: 13 }}>리뷰 데이터가 없습니다</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

// =============================================================================
// 진화 이력 컴포넌트
// =============================================================================

function EvolutionSummary({ data, colors }: {
  data: EvolutionData | null;
  colors: ThemeColors;
}) {
  if (!data) return null;

  const summary = data.summary;

  return (
    <View style={{
      flexDirection: 'row',
      gap: 8,
      marginHorizontal: 16,
      marginBottom: 12,
    }}>
      <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: 'center' }}>
        <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>총진화</Text>
        <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '700' }}>
          {summary.total_evolutions}
        </Text>
      </View>
      <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: 'center' }}>
        <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>성공</Text>
        <Text style={{ color: colors.success, fontSize: 18, fontWeight: '700' }}>
          {summary.successful_changes}
        </Text>
      </View>
      <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: 'center' }}>
        <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>롤백</Text>
        <Text style={{ color: colors.error, fontSize: 18, fontWeight: '700' }}>
          {summary.rolled_back_changes}
        </Text>
      </View>
      <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: 'center' }}>
        <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>평가</Text>
        <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '600' }}>
          {summary.assessment || '-'}
        </Text>
      </View>
    </View>
  );
}

const STRATEGY_LABELS: Record<string, string> = {
  momentum_breakout: '모멘텀',
  sepa_trend: 'SEPA',
  theme_chasing: '테마',
  gap_and_go: '갭상승',
};

function ChangeHistoryList({ history, expandedIndex, onToggle, colors }: {
  history: EvolutionHistoryItem[];
  expandedIndex: number | null;
  onToggle: (index: number | null) => void;
  colors: ThemeColors;
}) {
  if (history.length === 0) {
    return (
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 24,
        marginHorizontal: 16,
        alignItems: 'center',
      }}>
        <Text style={{ color: colors.muted, fontSize: 13 }}>진화 이력이 없습니다</Text>
      </View>
    );
  }

  const renderItem = ({ item, index }: { item: EvolutionHistoryItem; index: number }) => {
    const isExpanded = expandedIndex === index;

    // Determine effectiveness display
    const effectLabel = item.is_effective === true ? '효과적' : item.is_effective === false ? '비효과적' : '평가중';
    const effectColor = item.is_effective === true ? colors.success : item.is_effective === false ? colors.error : colors.muted;

    const dateStr = item.timestamp ? item.timestamp.split('T')[0] : '-';

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onToggle(isExpanded ? null : index)}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 16,
          marginHorizontal: 16,
          marginBottom: 8,
        }}
      >
        {/* 상단: 날짜 + 전략 뱃지 + 파라미터명 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ color: colors.muted, fontSize: 11, marginRight: 8 }}>{dateStr}</Text>
          <View style={{
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 4,
            backgroundColor: colors.elevated,
            marginRight: 8,
          }}>
            <Text style={{ color: colors.primaryLight, fontSize: 10, fontWeight: '600' }}>
              {STRATEGY_LABELS[item.strategy] || item.strategy}
            </Text>
          </View>
          <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600', flex: 1 }}>
            {item.parameter}
          </Text>
        </View>

        {/* 이전값 -> 새값 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ color: colors.muted, fontSize: 13 }}>{String(item.as_is)}</Text>
          <Text style={{ color: colors.primary, fontSize: 13, marginHorizontal: 8 }}>{'\u2192'}</Text>
          <Text style={{ color: colors.info, fontSize: 13, fontWeight: '700' }}>{String(item.to_be)}</Text>
        </View>

        {/* 효과 뱃지 + 소스 뱃지 */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 4,
            backgroundColor: effectColor + '22',
          }}>
            <Text style={{ color: effectColor, fontSize: 10, fontWeight: '700' }}>
              {effectLabel}
            </Text>
          </View>
          <View style={{
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 4,
            backgroundColor: colors.info + '22',
          }}>
            <Text style={{ color: colors.info, fontSize: 10, fontWeight: '700' }}>
              {item.source || '-'}
            </Text>
          </View>
        </View>

        {/* 접이식: 사유 + 승률 비교 */}
        {isExpanded && (
          <View style={{
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}>
            {item.reason ? (
              <>
                <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '600', marginBottom: 4 }}>사유</Text>
                <Text style={{ color: colors.foreground, fontSize: 12, lineHeight: 18, marginBottom: 8 }}>
                  {item.reason}
                </Text>
              </>
            ) : null}
            {(item.win_rate_before != null || item.win_rate_after != null) && (
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <View>
                  <Text style={{ color: colors.muted, fontSize: 10, marginBottom: 2 }}>변경 전 승률</Text>
                  <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '600' }}>
                    {item.win_rate_before != null ? `${item.win_rate_before}%` : '-'}
                  </Text>
                </View>
                <View>
                  <Text style={{ color: colors.muted, fontSize: 10, marginBottom: 2 }}>변경 후 승률</Text>
                  <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '600' }}>
                    {item.win_rate_after != null ? `${item.win_rate_after}%` : '-'}
                  </Text>
                </View>
                <View>
                  <Text style={{ color: colors.muted, fontSize: 10, marginBottom: 2 }}>거래수</Text>
                  <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '600' }}>
                    {item.trades_before ?? '-'} {'\u2192'} {item.trades_after ?? '-'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View>
      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.foreground, marginHorizontal: 16, marginBottom: 8 }}>
        변경 이력
      </Text>
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(_, index) => String(index)}
        scrollEnabled={false}
      />
    </View>
  );
}

// =============================================================================
// 진화 이력 뷰
// =============================================================================

function EvolutionHistoryView({ colors }: { colors: ThemeColors }) {
  const { state } = useTradingData();
  const [evolution, setEvolution] = useState<EvolutionData | null>(null);
  const [history, setHistory] = useState<EvolutionHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    loadEvolution();
  }, [state.isDemo]);

  const loadEvolution = async () => {
    if (state.isDemo) {
      setEvolution(DEMO_EVOLUTION);
      setHistory(DEMO_EVOLUTION_HISTORY);
      return;
    }
    setLoading(true);
    try {
      const [evo, hist] = await Promise.all([
        apiClient.getEvolution(),
        apiClient.getEvolutionHistory(),
      ]);
      setEvolution(evo);
      setHistory(hist);
    } catch (e) {
      console.warn('[Review] 진화 데이터 로드 실패:', e);
    }
    setLoading(false);
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />;
  }

  return (
    <View>
      <EvolutionSummary data={evolution} colors={colors} />
      <ChangeHistoryList
        history={history}
        expandedIndex={expandedIndex}
        onToggle={setExpandedIndex}
        colors={colors}
      />
    </View>
  );
}

// =============================================================================
// 메인 화면
// =============================================================================

export default function ReviewScreen() {
  const { state } = useTradingData();
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<'review' | 'evolution'>('review');

  return (
    <ScreenContainer>
      {state.isDemo && <DemoBadge colors={colors} />}
      <SubTabBar
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { key: 'review', label: '일일 복기' },
          { key: 'evolution', label: '파라미터 변경' },
        ]}
        colors={colors}
      />
      {activeTab === 'review' ? (
        <DailyReviewView colors={colors} />
      ) : (
        <EvolutionHistoryView colors={colors} />
      )}
      <View style={{ height: 20 }} />
    </ScreenContainer>
  );
}
