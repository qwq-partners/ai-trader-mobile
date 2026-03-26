import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { apiClient } from '@/lib/api-client';
import type { ThemeDetailData, ScreeningItem, USThemeData, USScreeningItem } from '@/lib/api-client';
import { formatKRW, formatPct } from '@/lib/demo-data';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { formatTime } from '@/lib/demo-data';
import type { ThemeColors } from '@/constants/theme';

// =============================================================================
// MarketFilter
// =============================================================================

type MarketFilter = 'all' | 'KR' | 'US';

function MarketFilterTabs({
  current,
  onChange,
}: {
  current: MarketFilter;
  onChange: (m: MarketFilter) => void;
}) {
  const colors = useColors();
  const tabs: { key: MarketFilter; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'KR', label: 'KR' },
    { key: 'US', label: 'US' },
  ];

  return (
    <View style={{ flexDirection: 'row', marginHorizontal: 16, marginTop: 12, gap: 8 }}>
      {tabs.map((tab) => {
        const active = current === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={{
              backgroundColor: active ? colors.primary : colors.surface,
              borderRadius: 8,
              paddingVertical: 8,
              paddingHorizontal: 16,
            }}
          >
            <Text style={{ color: active ? '#fff' : colors.muted, fontSize: 14, fontWeight: '700' }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// =============================================================================
// Score helpers
// =============================================================================

function getScoreColor(score: number, colors: ThemeColors): string {
  if (score >= 80) return colors.profit;
  if (score >= 60) return colors.warning;
  return colors.primary;
}

// =============================================================================
// KR ThemeCard
// =============================================================================

function KRThemeCard({ theme, colors }: { theme: ThemeDetailData; colors: ThemeColors }) {
  const scoreColor = getScoreColor(theme.score, colors);
  const keywords = (theme.keywords || []).slice(0, 5);
  const stocks = (theme.related_stocks || []).slice(0, 6);
  const newsTitles = (theme.news_titles || []).slice(0, 3);

  return (
    <View style={{
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      marginHorizontal: 16,
      marginBottom: 10,
    }}>
      {/* Header: name + score */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '700', flex: 1 }}>{theme.name}</Text>
        <Text style={{ color: scoreColor, fontSize: 14, fontWeight: '700' }}>{theme.score}</Text>
      </View>

      {/* Score bar */}
      <View style={{
        height: 3,
        borderRadius: 2,
        backgroundColor: colors.elevated,
        marginTop: 8,
      }}>
        <View style={{
          height: 3,
          borderRadius: 2,
          backgroundColor: scoreColor,
          width: `${Math.min(theme.score, 100)}%`,
        }} />
      </View>

      {/* Keywords */}
      {keywords.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {keywords.map((kw, i) => (
            <View key={i} style={{
              backgroundColor: colors.elevated,
              borderRadius: 12,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}>
              <Text style={{ color: colors.muted, fontSize: 11 }}>{kw}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Related stocks */}
      {stocks.length > 0 && (
        <Text style={{ color: colors.muted, fontSize: 11, marginTop: 8 }} numberOfLines={1}>
          {stocks.join(', ')}
        </Text>
      )}

      {/* News titles */}
      {newsTitles.length > 0 && (
        <View style={{ marginTop: 8 }}>
          {newsTitles.map((title, i) => (
            <Text key={i} style={{ color: colors.muted, fontSize: 11, marginTop: i > 0 ? 2 : 0 }} numberOfLines={1}>
              {title}
            </Text>
          ))}
        </View>
      )}

      {/* Detected time */}
      <Text style={{ color: colors.muted, fontSize: 10, marginTop: 8, textAlign: 'right' }}>
        {formatTime(theme.detected_at)}
      </Text>
    </View>
  );
}

// =============================================================================
// US ThemeCard
// =============================================================================

function USThemeCard({ theme, colors }: { theme: USThemeData; colors: ThemeColors }) {
  const scoreColor = getScoreColor(theme.score, colors);
  const keywords = (theme.keywords || []).slice(0, 5);
  const tickers = (theme.stocks || []).slice(0, 6);
  const newsTitles = (theme.news_titles || []).slice(0, 3);

  return (
    <View style={{
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      marginHorizontal: 16,
      marginBottom: 10,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '700', flex: 1 }}>{theme.name}</Text>
        <Text style={{ color: scoreColor, fontSize: 14, fontWeight: '700' }}>{theme.score}</Text>
      </View>

      <View style={{
        height: 3,
        borderRadius: 2,
        backgroundColor: colors.elevated,
        marginTop: 8,
      }}>
        <View style={{
          height: 3,
          borderRadius: 2,
          backgroundColor: scoreColor,
          width: `${Math.min(theme.score, 100)}%`,
        }} />
      </View>

      {keywords.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {keywords.map((kw, i) => (
            <View key={i} style={{
              backgroundColor: colors.elevated,
              borderRadius: 12,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}>
              <Text style={{ color: colors.muted, fontSize: 11 }}>{kw}</Text>
            </View>
          ))}
        </View>
      )}

      {tickers.length > 0 && (
        <Text style={{ color: colors.muted, fontSize: 11, marginTop: 8 }} numberOfLines={1}>
          {tickers.join(', ')}
        </Text>
      )}

      {newsTitles.length > 0 && (
        <View style={{ marginTop: 8 }}>
          {newsTitles.map((title, i) => (
            <Text key={i} style={{ color: colors.muted, fontSize: 11, marginTop: i > 0 ? 2 : 0 }} numberOfLines={1}>
              {title}
            </Text>
          ))}
        </View>
      )}

      <Text style={{ color: colors.muted, fontSize: 10, marginTop: 8, textAlign: 'right' }}>
        {formatTime(theme.detected_at)}
      </Text>
    </View>
  );
}

// =============================================================================
// ScreeningList
// =============================================================================

function ScreeningList({ items, colors }: { items: (ScreeningItem | USScreeningItem)[]; colors: ThemeColors }) {
  if (items.length === 0) {
    return (
      <Text style={{ color: colors.muted, fontSize: 13, marginHorizontal: 16, marginTop: 4 }}>없음</Text>
    );
  }

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 12, marginHorizontal: 16, paddingVertical: 4 }}>
      {items.map((item, idx) => {
        const changePctColor = item.change_pct >= 0 ? colors.profit : colors.loss;
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
              <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                {item.reasons[0] || ''}
              </Text>
            </View>
            <View style={{
              backgroundColor: colors.primary + '22',
              borderRadius: 6,
              paddingHorizontal: 6,
              paddingVertical: 2,
              marginRight: 10,
            }}>
              <Text style={{ color: colors.primaryLight, fontSize: 11, fontWeight: '700' }}>{item.score}</Text>
            </View>
            <Text style={{ color: changePctColor, fontSize: 12, fontWeight: '600', minWidth: 50, textAlign: 'right' }}>
              {formatPct(item.change_pct)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// =============================================================================
// SectionTitle
// =============================================================================

function SectionTitle({ title, count }: { title: string; count?: number }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 20, marginBottom: 8 }}>
      <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700' }}>{title}</Text>
      {count !== undefined && (
        <View style={{
          backgroundColor: colors.primary + '22',
          borderRadius: 10,
          paddingHorizontal: 7,
          paddingVertical: 2,
          marginLeft: 8,
        }}>
          <Text style={{ color: colors.primaryLight, fontSize: 11, fontWeight: '700' }}>{count}</Text>
        </View>
      )}
    </View>
  );
}

// =============================================================================
// ThemesScreen
// =============================================================================

export default function ThemesScreen() {
  const colors = useColors();
  const [filter, setFilter] = useState<MarketFilter>('all');
  const [krThemes, setKRThemes] = useState<ThemeDetailData[]>([]);
  const [krScreening, setKRScreening] = useState<ScreeningItem[]>([]);
  const [usThemes, setUSThemes] = useState<USThemeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [kr, screening, us] = await Promise.all([
        apiClient.getThemes() as Promise<ThemeDetailData[]>,
        apiClient.getScreening(),
        apiClient.getUSThemes(),
      ]);
      setKRThemes(kr);
      setKRScreening(screening);
      setUSThemes(us);
    } catch (e) {
      console.warn('[Themes] loadData 실패:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const showKR = filter === 'all' || filter === 'KR';
  const showUS = filter === 'all' || filter === 'US';

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={handleRefresh}>
      <MarketFilterTabs current={filter} onChange={setFilter} />

      {loading && (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {!loading && (
        <>
          {/* KR Themes */}
          {showKR && (
            <>
              <SectionTitle title={'\uD83C\uDDF0\uD83C\uDDF7 활성 테마'} count={krThemes.length} />
              {krThemes.length === 0 ? (
                <Text style={{ color: colors.muted, fontSize: 13, marginHorizontal: 16 }}>없음</Text>
              ) : (
                krThemes.map((theme, i) => (
                  <KRThemeCard key={theme.name + i} theme={theme} colors={colors} />
                ))
              )}

              <SectionTitle title="스크리닝 결과" count={krScreening.length} />
              <ScreeningList items={krScreening} colors={colors} />
            </>
          )}

          {/* US Themes */}
          {showUS && (
            <>
              <SectionTitle title={'\uD83C\uDDFA\uD83C\uDDF8 US 테마'} count={usThemes.length} />
              {usThemes.length === 0 ? (
                <Text style={{ color: colors.muted, fontSize: 13, marginHorizontal: 16 }}>없음</Text>
              ) : (
                usThemes.map((theme, i) => (
                  <USThemeCard key={theme.name + i} theme={theme} colors={colors} />
                ))
              )}
            </>
          )}
        </>
      )}
    </ScreenContainer>
  );
}
