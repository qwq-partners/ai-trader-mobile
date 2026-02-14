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

function ReviewSummary({ summary, colors }: {
  summary: DailyReviewData['summary'];
  colors: ThemeColors;
}) {
  const gradeColorMap: Record<string, string> = {
    A: colors.success,
    B: colors.info,
    C: colors.warning,
    D: colors.error,
    F: colors.error,
  };
  const gradeColor = gradeColorMap[summary.llm_grade?.charAt(0)] || colors.muted;
  const pnlColor = summary.total_pnl >= 0 ? colors.profit : colors.loss;

  return (
    <View style={{
      flexDirection: 'row',
      gap: 8,
      marginHorizontal: 16,
      marginBottom: 12,
    }}>
      <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: 'center' }}>
        <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>승률</Text>
        <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700' }}>
          {formatPct(summary.win_rate, false)}
        </Text>
      </View>
      <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: 'center' }}>
        <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>손익비</Text>
        <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700' }}>
          {summary.profit_loss_ratio.toFixed(2)}
        </Text>
      </View>
      <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: 'center' }}>
        <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>총손익</Text>
        <Text style={{ color: pnlColor, fontSize: 16, fontWeight: '700' }}>
          {formatKRW(summary.total_pnl)}
        </Text>
      </View>
      <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: 'center' }}>
        <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>LLM평가</Text>
        <Text style={{ color: gradeColor, fontSize: 20, fontWeight: '800' }}>
          {summary.llm_grade || '-'}
        </Text>
      </View>
    </View>
  );
}

function TradeReviewCards({ trades, expandedIndex, onToggle, colors }: {
  trades: DailyReviewData['trades'];
  expandedIndex: number | null;
  onToggle: (index: number | null) => void;
  colors: ThemeColors;
}) {
  const strategyLabel: Record<string, string> = {
    MOMENTUM_BREAKOUT: '모멘텀',
    SEPA_TREND: 'SEPA',
    THEME_CHASING: '테마',
    GAP_AND_GO: '갭상승',
  };

  if (trades.length === 0) {
    return (
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 24,
        marginHorizontal: 16,
        marginBottom: 12,
        alignItems: 'center',
      }}>
        <Text style={{ color: colors.muted, fontSize: 13 }}>거래 내역 없음</Text>
      </View>
    );
  }

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.foreground, marginHorizontal: 16, marginBottom: 8 }}>
        거래 복기
      </Text>
      {trades.map((trade, idx) => {
        const isExpanded = expandedIndex === idx;
        const pnlColor = trade.pnl >= 0 ? colors.profit : colors.loss;

        return (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.7}
            onPress={() => onToggle(isExpanded ? null : idx)}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              marginHorizontal: 16,
              marginBottom: 8,
            }}
          >
            {/* 상단: 종목명 + 전략 + 손익 */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '700' }}>
                  {trade.name}
                </Text>
                <View style={{
                  marginLeft: 8,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  backgroundColor: colors.elevated,
                }}>
                  <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '600' }}>
                    {strategyLabel[trade.strategy] || trade.strategy}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: pnlColor, fontSize: 15, fontWeight: '700' }}>
                  {formatPct(trade.pnl_pct)}
                </Text>
                <Text style={{ color: pnlColor, fontSize: 11 }}>
                  {trade.pnl >= 0 ? '+' : ''}{formatKRW(trade.pnl)}
                </Text>
              </View>
            </View>

            {/* 진입/퇴출 사유 */}
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

            {/* 접이식: LLM 분석 */}
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

            {/* 접기/펼치기 인디케이터 */}
            <Text style={{ color: colors.muted, fontSize: 10, textAlign: 'center', marginTop: 6 }}>
              {isExpanded ? '\u25B2 접기' : '\u25BC 상세'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function LLMInsights({ analysis, colors }: {
  analysis: DailyReviewData['llm_analysis'];
  colors: ThemeColors;
}) {
  return (
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

      {/* 전체 평가 */}
      {analysis.overall_assessment ? (
        <Text style={{ color: colors.foreground, fontSize: 13, lineHeight: 20, marginBottom: 12 }}>
          {analysis.overall_assessment}
        </Text>
      ) : null}

      {/* 인사이트 목록 */}
      {analysis.insights && analysis.insights.length > 0 ? (
        <View style={{ marginBottom: 12 }}>
          {analysis.insights.map((insight, idx) => (
            <View key={idx} style={{ flexDirection: 'row', marginBottom: 4 }}>
              <Text style={{ color: colors.primary, fontSize: 12, marginRight: 6 }}>{'\u2022'}</Text>
              <Text style={{ color: colors.foreground, fontSize: 12, lineHeight: 18, flex: 1 }}>{insight}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* 2칸 그리드: 회피 패턴 / 집중 기회 */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {/* 회피 패턴 */}
        <View style={{ flex: 1, backgroundColor: colors.elevated, borderRadius: 8, padding: 12 }}>
          <Text style={{ color: colors.error, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>
            회피 패턴
          </Text>
          {analysis.avoid_patterns && analysis.avoid_patterns.length > 0 ? (
            analysis.avoid_patterns.map((pattern, idx) => (
              <View key={idx} style={{ flexDirection: 'row', marginBottom: 3 }}>
                <Text style={{ color: colors.error, fontSize: 11, marginRight: 4 }}>{'\u2022'}</Text>
                <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 16, flex: 1 }}>{pattern}</Text>
              </View>
            ))
          ) : (
            <Text style={{ color: colors.muted, fontSize: 11 }}>-</Text>
          )}
        </View>

        {/* 집중 기회 */}
        <View style={{ flex: 1, backgroundColor: colors.elevated, borderRadius: 8, padding: 12 }}>
          <Text style={{ color: colors.success, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>
            집중 기회
          </Text>
          {analysis.focus_opportunities && analysis.focus_opportunities.length > 0 ? (
            analysis.focus_opportunities.map((opp, idx) => (
              <View key={idx} style={{ flexDirection: 'row', marginBottom: 3 }}>
                <Text style={{ color: colors.success, fontSize: 11, marginRight: 4 }}>{'\u2022'}</Text>
                <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 16, flex: 1 }}>{opp}</Text>
              </View>
            ))
          ) : (
            <Text style={{ color: colors.muted, fontSize: 11 }}>-</Text>
          )}
        </View>
      </View>
    </View>
  );
}

function ParameterRecommendations({ recommendations, colors }: {
  recommendations: DailyReviewData['parameter_recommendations'];
  colors: ThemeColors;
}) {
  const [applyingIndex, setApplyingIndex] = useState<number | null>(null);

  const strategyLabel: Record<string, string> = {
    MOMENTUM_BREAKOUT: '모멘텀',
    SEPA_TREND: 'SEPA',
    THEME_CHASING: '테마',
    GAP_AND_GO: '갭상승',
  };

  const handleApply = (rec: DailyReviewData['parameter_recommendations'][0], idx: number) => {
    Alert.alert(
      '파라미터 적용',
      `${strategyLabel[rec.strategy] || rec.strategy} - ${rec.parameter}\n${String(rec.current_value)} -> ${String(rec.suggested_value)}\n\n적용하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '적용',
          onPress: async () => {
            setApplyingIndex(idx);
            try {
              const result = await apiClient.applyEvolution({
                strategy: rec.strategy,
                parameter: rec.parameter,
                value: rec.suggested_value,
              });
              if (result.success) {
                Alert.alert('성공', result.message || '파라미터가 적용되었습니다.');
              } else {
                Alert.alert('실패', result.message || '적용에 실패했습니다.');
              }
            } catch {
              Alert.alert('오류', '서버 연결에 실패했습니다.');
            }
            setApplyingIndex(null);
          },
        },
      ],
    );
  };

  return (
    <View style={{
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 12,
    }}>
      <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '700', marginBottom: 12 }}>
        파라미터 추천
      </Text>

      {recommendations.map((rec, idx) => {
        const confidencePct = Math.round(rec.confidence * 100);

        return (
          <View key={idx} style={{
            paddingVertical: 12,
            borderTopWidth: idx > 0 ? 1 : 0,
            borderTopColor: colors.border,
          }}>
            {/* 전략 + 파라미터 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <View style={{
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
                backgroundColor: colors.elevated,
                marginRight: 8,
              }}>
                <Text style={{ color: colors.primaryLight, fontSize: 10, fontWeight: '600' }}>
                  {strategyLabel[rec.strategy] || rec.strategy}
                </Text>
              </View>
              <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600' }}>
                {rec.parameter}
              </Text>
            </View>

            {/* 현재 -> 제안 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                {String(rec.current_value)}
              </Text>
              <Text style={{ color: colors.primary, fontSize: 12, marginHorizontal: 8 }}>
                {'\u2192'}
              </Text>
              <Text style={{ color: colors.info, fontSize: 12, fontWeight: '700' }}>
                {String(rec.suggested_value)}
              </Text>
            </View>

            {/* 사유 */}
            {rec.reason ? (
              <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 16, marginBottom: 8 }}>
                {rec.reason}
              </Text>
            ) : null}

            {/* 신뢰도 바 + 적용 버튼 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.muted, fontSize: 10, marginBottom: 3 }}>
                  신뢰도 {confidencePct}%
                </Text>
                <View style={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.elevated,
                }}>
                  <View style={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: confidencePct >= 70 ? colors.success : confidencePct >= 50 ? colors.warning : colors.error,
                    width: `${confidencePct}%` as any,
                  }} />
                </View>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleApply(rec, idx)}
                disabled={applyingIndex === idx}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  opacity: applyingIndex === idx ? 0.5 : 1,
                }}
              >
                {applyingIndex === idx ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>적용</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
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
  const [expandedTrade, setExpandedTrade] = useState<number | null>(null);

  useEffect(() => {
    if (!state.isDemo) loadDates();
  }, [state.isDemo]);

  const loadDates = async () => {
    try {
      const resp = await apiClient.getDailyReviewDates();
      setAvailableDates(resp.dates || []);
      if (resp.dates?.length > 0) loadReview(resp.dates[0]);
    } catch {}
  };

  const loadReview = async (date: string) => {
    setLoading(true);
    try {
      const data = await apiClient.getDailyReview(date);
      setReview(data);
    } catch {}
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
          {review && <ReviewSummary summary={review.summary} colors={colors} />}
          {review && (
            <TradeReviewCards
              trades={review.trades}
              expandedIndex={expandedTrade}
              onToggle={setExpandedTrade}
              colors={colors}
            />
          )}
          {review?.llm_analysis && <LLMInsights analysis={review.llm_analysis} colors={colors} />}
          {review?.parameter_recommendations && review.parameter_recommendations.length > 0 && (
            <ParameterRecommendations recommendations={review.parameter_recommendations} colors={colors} />
          )}
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
          {data.total_evolutions}
        </Text>
      </View>
      <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: 'center' }}>
        <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>성공</Text>
        <Text style={{ color: colors.success, fontSize: 18, fontWeight: '700' }}>
          {data.successful}
        </Text>
      </View>
      <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: 'center' }}>
        <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>롤백</Text>
        <Text style={{ color: colors.error, fontSize: 18, fontWeight: '700' }}>
          {data.rolled_back}
        </Text>
      </View>
      <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: 'center' }}>
        <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>최근일</Text>
        <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '600' }}>
          {data.last_evolution_date || '-'}
        </Text>
      </View>
    </View>
  );
}

function ChangeHistoryList({ history, expandedIndex, onToggle, colors }: {
  history: EvolutionHistoryItem[];
  expandedIndex: number | null;
  onToggle: (index: number | null) => void;
  colors: ThemeColors;
}) {
  const strategyLabel: Record<string, string> = {
    MOMENTUM_BREAKOUT: '모멘텀',
    SEPA_TREND: 'SEPA',
    THEME_CHASING: '테마',
    GAP_AND_GO: '갭상승',
  };

  const effectConfig: Record<string, { color: string; label: string }> = {
    positive: { color: colors.success, label: '긍정적' },
    negative: { color: colors.error, label: '부정적' },
    neutral: { color: colors.muted, label: '중립' },
  };

  const statusConfig: Record<string, { color: string; label: string }> = {
    applied: { color: colors.info, label: '적용됨' },
    rolled_back: { color: colors.error, label: '롤백' },
    pending: { color: colors.warning, label: '대기중' },
  };

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
    const effect = effectConfig[item.effect || 'neutral'] || effectConfig.neutral;
    const status = statusConfig[item.status] || statusConfig.pending;

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
          <Text style={{ color: colors.muted, fontSize: 11, marginRight: 8 }}>{item.date}</Text>
          <View style={{
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 4,
            backgroundColor: colors.elevated,
            marginRight: 8,
          }}>
            <Text style={{ color: colors.primaryLight, fontSize: 10, fontWeight: '600' }}>
              {strategyLabel[item.strategy] || item.strategy}
            </Text>
          </View>
          <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600', flex: 1 }}>
            {item.parameter}
          </Text>
        </View>

        {/* 이전값 -> 새값 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ color: colors.muted, fontSize: 13 }}>{String(item.old_value)}</Text>
          <Text style={{ color: colors.primary, fontSize: 13, marginHorizontal: 8 }}>{'\u2192'}</Text>
          <Text style={{ color: colors.info, fontSize: 13, fontWeight: '700' }}>{String(item.new_value)}</Text>
        </View>

        {/* 효과 뱃지 + 상태 뱃지 */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 4,
            backgroundColor: effect.color + '22',
          }}>
            <Text style={{ color: effect.color, fontSize: 10, fontWeight: '700' }}>
              {effect.label}
            </Text>
          </View>
          <View style={{
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 4,
            backgroundColor: status.color + '22',
          }}>
            <Text style={{ color: status.color, fontSize: 10, fontWeight: '700' }}>
              {status.label}
            </Text>
          </View>
        </View>

        {/* 접이식: 사유 */}
        {isExpanded && item.reason ? (
          <View style={{
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}>
            <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '600', marginBottom: 4 }}>사유</Text>
            <Text style={{ color: colors.foreground, fontSize: 12, lineHeight: 18 }}>
              {item.reason}
            </Text>
          </View>
        ) : null}
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
    } catch {}
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
          { key: 'review', label: '일일 리뷰' },
          { key: 'evolution', label: '진화 이력' },
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
