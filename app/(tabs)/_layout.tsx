import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  // 가상키 영역(insets.bottom)만큼 패딩 확보
  const bottomPadding = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          height: 56 + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: -2,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '실시간',
          tabBarIcon: ({ color }) => (
            <IconSymbol name="dashboard" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trades"
        options={{
          title: '거래',
          tabBarIcon: ({ color }) => (
            <IconSymbol name="receipt-long" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settlement"
        options={{
          title: '정산',
          tabBarIcon: ({ color }) => (
            <IconSymbol name="account-balance" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="themes"
        options={{
          title: '테마',
          tabBarIcon: ({ color }) => (
            <IconSymbol name="auto-awesome" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="performance"
        options={{
          title: '성과',
          tabBarIcon: ({ color }) => (
            <IconSymbol name="trending-up" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="review"
        options={{
          title: '복기',
          tabBarIcon: ({ color }) => (
            <IconSymbol name="psychology" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '설정',
          tabBarIcon: ({ color }) => (
            <IconSymbol name="settings" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
