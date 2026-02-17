import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { useTradingData } from '@/lib/trading-data-provider';
import { apiClient } from '@/lib/api-client';
import type { ConfigData } from '@/lib/api-client';
import { notificationManager, type NotificationSettings } from '@/lib/notifications';
import { DEMO_RISK_SETTINGS } from '@/lib/demo-data';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import type { ThemeColors } from '@/constants/theme';

// =============================================================================
// 섹션 컴포넌트
// =============================================================================

function SectionHeader({ title, colors }: { title: string; colors: ThemeColors }) {
  return (
    <Text style={{
      fontSize: 16,
      fontWeight: '700',
      color: colors.foreground,
      marginHorizontal: 16,
      marginTop: 20,
      marginBottom: 12,
    }}>
      {title}
    </Text>
  );
}

// --- 서버 연결 ---

function ServerConnection({
  serverUrl,
  setServerUrl,
  connected,
  connecting,
  testing,
  testResult,
  onTest,
  onConnect,
  onDisconnect,
  colors,
}: {
  serverUrl: string;
  setServerUrl: (url: string) => void;
  connected: boolean;
  connecting: boolean;
  testing: boolean;
  testResult: { connected: boolean; latencyMs: number } | null;
  onTest: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  colors: ThemeColors;
}) {
  return (
    <View>
      <SectionHeader title="서버 연결" colors={colors} />
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
      }}>
        {/* 연결 상태 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <View style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: connected ? colors.success : colors.error,
            marginRight: 8,
          }} />
          <Text style={{ color: connected ? colors.success : colors.error, fontSize: 13, fontWeight: '600' }}>
            {connected ? '연결됨' : '연결 해제'}
          </Text>
        </View>

        {/* URL 입력 */}
        <TextInput
          value={serverUrl}
          onChangeText={setServerUrl}
          placeholder="https://qwq.ai.kr"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          style={{
            backgroundColor: colors.elevated,
            color: colors.foreground,
            borderRadius: 8,
            padding: 12,
            fontSize: 14,
            marginBottom: 12,
          }}
        />

        {/* 연결 테스트 결과 */}
        {testResult && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
            paddingHorizontal: 4,
          }}>
            <Text style={{
              color: testResult.connected ? colors.success : colors.error,
              fontSize: 13,
            }}>
              {testResult.connected
                ? `연결됨 \u2713 (${testResult.latencyMs}ms)`
                : '연결 실패 \u2717'}
            </Text>
          </View>
        )}

        {/* 버튼 행 */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={onTest}
            disabled={testing}
            style={{
              flex: 1,
              backgroundColor: colors.elevated,
              borderRadius: 8,
              padding: 12,
              alignItems: 'center',
              opacity: testing ? 0.6 : 1,
            }}
          >
            {testing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '600' }}>
                연결 테스트
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={connected ? onDisconnect : onConnect}
            disabled={connecting}
            style={{
              flex: 1,
              backgroundColor: connected ? colors.error + '22' : colors.primary,
              borderRadius: 8,
              padding: 12,
              alignItems: 'center',
              opacity: connecting ? 0.6 : 1,
            }}
          >
            {connecting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{
                color: connected ? colors.error : '#fff',
                fontSize: 14,
                fontWeight: '600',
              }}>
                {connected ? '해제' : '연결'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// --- 알림 설정 ---

const NOTIFICATION_LABELS: { key: keyof NotificationSettings; label: string }[] = [
  { key: 'trade_fill', label: '체결 알림' },
  { key: 'stop_loss', label: '손절/익절 알림' },
  { key: 'risk_warning', label: '리스크 경고' },
  { key: 'error', label: '에러 알림' },
  { key: 'daily_summary', label: '일일 요약' },
];

function NotificationSettingsSection({
  settings,
  onToggle,
  colors,
}: {
  settings: NotificationSettings | null;
  onToggle: (key: keyof NotificationSettings, value: boolean) => void;
  colors: ThemeColors;
}) {
  if (!settings) return null;

  return (
    <View>
      <SectionHeader title="알림 설정" colors={colors} />
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        marginHorizontal: 16,
        marginBottom: 12,
      }}>
        {NOTIFICATION_LABELS.map(({ key, label }, idx) => (
          <View
            key={key}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderTopWidth: idx > 0 ? 1 : 0,
              borderTopColor: colors.border,
            }}
          >
            <Text style={{ color: colors.foreground, fontSize: 14 }}>{label}</Text>
            <Switch
              value={settings[key]}
              onValueChange={(value) => onToggle(key, value)}
              trackColor={{ false: colors.elevated, true: colors.primary + '66' }}
              thumbColor={settings[key] ? colors.primary : colors.muted}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

// --- 현재 설정 ---

function ConfigRow({ label, value, colors }: { label: string; value: string; colors: ThemeColors }) {
  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    }}>
      <Text style={{ color: colors.muted, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

function CurrentConfig({ config, isDemo, colors }: { config: ConfigData | null; isDemo: boolean; colors: ThemeColors }) {
  // 데모 모드에서는 DEMO_RISK_SETTINGS 사용
  const riskSettings = isDemo ? DEMO_RISK_SETTINGS : null;

  // 서버 연결 시 config에서 리스크 데이터 추출
  const riskFromConfig = config?.risk;
  const exitFromConfig = config?.exit_manager;
  const strategiesFromConfig = config?.strategies;

  // 데이터가 없으면 표시하지 않음
  if (!isDemo && !config) return null;

  return (
    <View>
      <SectionHeader title="현재 설정" colors={colors} />
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
      }}>
        {/* 리스크 설정 */}
        <Text style={{ color: colors.primaryLight, fontSize: 13, fontWeight: '700', marginBottom: 8 }}>
          리스크
        </Text>
        {isDemo ? (
          <>
            <ConfigRow label="일일 최대 손실" value={`${riskSettings!.daily_loss_limit_pct}%`} colors={colors} />
            <ConfigRow label="포지션 비율" value={`${riskSettings!.max_position_pct}%`} colors={colors} />
            <ConfigRow label="최대 포지션 비율" value={`${riskSettings!.max_total_position_pct}%`} colors={colors} />
            <ConfigRow label="최소 현금 비율" value={`${riskSettings!.min_cash_pct}%`} colors={colors} />
            <ConfigRow label="기본 손절" value={`${riskSettings!.default_stop_loss_pct}%`} colors={colors} />
            <ConfigRow label="기본 익절" value={`${riskSettings!.default_take_profit_pct}%`} colors={colors} />
          </>
        ) : (
          <>
            <ConfigRow
              label="일일 최대 손실"
              value={`${riskFromConfig?.daily_loss_limit_pct ?? riskFromConfig?.max_daily_loss_pct ?? '-'}%`}
              colors={colors}
            />
            <ConfigRow
              label="포지션 비율"
              value={`${riskFromConfig?.position_size_pct ?? riskFromConfig?.max_position_pct ?? '-'}%`}
              colors={colors}
            />
            <ConfigRow
              label="기본 손절"
              value={`${exitFromConfig?.stop_loss_pct ?? exitFromConfig?.default_stop_loss_pct ?? '-'}%`}
              colors={colors}
            />
            <ConfigRow
              label="기본 익절"
              value={`${exitFromConfig?.first_exit_pct ?? exitFromConfig?.default_take_profit_pct ?? '-'}%`}
              colors={colors}
            />
          </>
        )}

        {/* 전략 설정 */}
        <View style={{
          borderTopWidth: 1,
          borderTopColor: colors.border,
          marginTop: 12,
          paddingTop: 12,
        }}>
          <Text style={{ color: colors.primaryLight, fontSize: 13, fontWeight: '700', marginBottom: 8 }}>
            전략
          </Text>
          {isDemo ? (
            <>
              <ConfigRow label="모멘텀 돌파" value="활성" colors={colors} />
              <ConfigRow label="테마 추종" value="활성" colors={colors} />
              <ConfigRow label="갭상승" value="활성" colors={colors} />
              <ConfigRow label="SEPA 추세" value="활성" colors={colors} />
            </>
          ) : strategiesFromConfig ? (
            Object.entries(strategiesFromConfig).map(([key, val]) => {
              const strategyVal = val as Record<string, any>;
              const enabled = strategyVal.enabled !== false;
              return (
                <ConfigRow
                  key={key}
                  label={key}
                  value={enabled ? '활성' : '비활성'}
                  colors={colors}
                />
              );
            })
          ) : (
            <Text style={{ color: colors.muted, fontSize: 13 }}>전략 정보 없음</Text>
          )}
        </View>
      </View>
    </View>
  );
}

// --- 데모 모드 ---

function DemoModeSection({
  isDemo,
  onToggle,
  colors,
}: {
  isDemo: boolean;
  onToggle: (value: boolean) => void;
  colors: ThemeColors;
}) {
  return (
    <View>
      <SectionHeader title="데모 모드" colors={colors} />
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
      }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}>
          <Text style={{ color: colors.foreground, fontSize: 14 }}>데모 모드</Text>
          <Switch
            value={isDemo}
            onValueChange={onToggle}
            trackColor={{ false: colors.elevated, true: colors.primary + '66' }}
            thumbColor={isDemo ? colors.primary : colors.muted}
          />
        </View>
        <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>
          실제 서버 데이터 대신 샘플 데이터를 표시합니다
        </Text>
      </View>
    </View>
  );
}

// --- 앱 정보 ---

function AppInfo({ colors }: { colors: ThemeColors }) {
  return (
    <View>
      <SectionHeader title="앱 정보" colors={colors} />
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
      }}>
        <ConfigRow label="버전" value="1.0.0" colors={colors} />
        <ConfigRow label="빌드" value="2026-02-15" colors={colors} />
        <ConfigRow label="프레임워크" value="Expo + React Native" colors={colors} />
      </View>
    </View>
  );
}

// =============================================================================
// 메인 화면
// =============================================================================

export default function SettingsScreen() {
  const { state, connect, disconnect, setDemoMode } = useTradingData();
  const colors = useColors();
  const [serverUrl, setServerUrl] = useState(state.serverUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ connected: boolean; latencyMs: number } | null>(null);
  const [notifSettings, setNotifSettings] = useState<NotificationSettings | null>(null);
  const [config, setConfig] = useState<ConfigData | null>(null);

  useEffect(() => {
    notificationManager.loadSettings().then(setNotifSettings);
    if (!state.isDemo) {
      apiClient.getConfig().then(setConfig).catch((e) => console.warn('[Settings] 설정 로드 실패:', e));
    }
  }, [state.isDemo]);

  const handleTest = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    try {
      await apiClient.setServerUrl(serverUrl);
      const result = await apiClient.testConnection();
      setTestResult(result);
    } catch (e) {
      console.warn('[Settings] 연결 테스트 실패:', e);
      setTestResult({ connected: false, latencyMs: 0 });
    }
    setTesting(false);
  }, [serverUrl]);

  const handleConnect = useCallback(async () => {
    await connect(serverUrl);
  }, [connect, serverUrl]);

  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  const handleNotifToggle = useCallback(async (key: keyof NotificationSettings, value: boolean) => {
    const updated = { ...notifSettings!, [key]: value };
    setNotifSettings(updated);
    await notificationManager.saveSettings({ [key]: value });
  }, [notifSettings]);

  const handleDemoToggle = useCallback((value: boolean) => {
    setDemoMode(value);
    if (value) {
      setConfig(null);
    }
  }, [setDemoMode]);

  return (
    <ScreenContainer>
      <ServerConnection
        serverUrl={serverUrl}
        setServerUrl={setServerUrl}
        connected={state.connected}
        connecting={state.connecting}
        testing={testing}
        testResult={testResult}
        onTest={handleTest}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        colors={colors}
      />
      <NotificationSettingsSection
        settings={notifSettings}
        onToggle={handleNotifToggle}
        colors={colors}
      />
      <CurrentConfig config={config} isDemo={state.isDemo} colors={colors} />
      <DemoModeSection
        isDemo={state.isDemo}
        onToggle={handleDemoToggle}
        colors={colors}
      />
      <AppInfo colors={colors} />
      <View style={{ height: 20 }} />
    </ScreenContainer>
  );
}
