import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { EventData } from '@/lib/api-client';

const STORAGE_KEY = '@ai_trader_notifications';

interface NotificationSettings {
  trade_fill: boolean;
  stop_loss: boolean;
  risk_warning: boolean;
  error: boolean;
  daily_summary: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  trade_fill: true,
  stop_loss: true,
  risk_warning: true,
  error: true,
  daily_summary: true,
};

class NotificationManager {
  private settings: NotificationSettings = DEFAULT_SETTINGS;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // 권한 요청
    if (Platform.OS !== 'web') {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;
    }

    // Android 채널 설정
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('trade_fill', {
        name: '체결 알림',
        importance: Notifications.AndroidImportance.HIGH,
      });
      await Notifications.setNotificationChannelAsync('stop_loss', {
        name: '손절/익절 알림',
        importance: Notifications.AndroidImportance.HIGH,
      });
      await Notifications.setNotificationChannelAsync('risk_warning', {
        name: '리스크 경고',
        importance: Notifications.AndroidImportance.HIGH,
      });
      await Notifications.setNotificationChannelAsync('error', {
        name: '에러 알림',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
      await Notifications.setNotificationChannelAsync('daily_summary', {
        name: '일일 요약',
        importance: Notifications.AndroidImportance.LOW,
      });
    }

    // 설정 로드
    await this.loadSettings();

    // 포그라운드 알림 표시
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    this.initialized = true;
  }

  async loadSettings(): Promise<NotificationSettings> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {}
    return this.settings;
  }

  async saveSettings(settings: Partial<NotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
  }

  getSettings(): NotificationSettings {
    return this.settings;
  }

  async handleTradingEvent(event: EventData): Promise<void> {
    if (!this.initialized) return;

    const { type, message } = event;

    if (type === 'fill' && this.settings.trade_fill) {
      const isSell = message.includes('매도');
      const channelId = isSell && (message.includes('손절') || message.includes('익절'))
        ? 'stop_loss'
        : 'trade_fill';

      await this.send({
        title: isSell ? '매도 체결' : '매수 체결',
        body: message,
        channelId,
      });
    } else if (type === 'error' && this.settings.error) {
      await this.send({
        title: '시스템 에러',
        body: message,
        channelId: 'error',
      });
    } else if (type === 'warning' && this.settings.risk_warning) {
      await this.send({
        title: '리스크 경고',
        body: message,
        channelId: 'risk_warning',
      });
    }
  }

  async handlePortfolioAlert(params: { dailyPnlPct: number; limitPct: number }): Promise<void> {
    if (!this.initialized || !this.settings.risk_warning) return;

    const ratio = Math.abs(params.dailyPnlPct / params.limitPct);
    if (ratio >= 0.8) {
      await this.send({
        title: '일일 손실 경고',
        body: `일일 손실 ${params.dailyPnlPct.toFixed(2)}% (한도의 ${(ratio * 100).toFixed(0)}%)`,
        channelId: 'risk_warning',
      });
    }
  }

  private async send(params: { title: string; body: string; channelId: string }): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: params.title,
          body: params.body,
          ...(Platform.OS === 'android' ? { channelId: params.channelId } : {}),
        },
        trigger: null, // 즉시 발송
      });
    } catch {}
  }
}

export const notificationManager = new NotificationManager();
export type { NotificationSettings };
