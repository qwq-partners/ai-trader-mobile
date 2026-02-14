import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PositionDetailModal() {
  const colors = useColors();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: colors.foreground, fontSize: 18 }}>포지션 상세</Text>
        <Text style={{ color: colors.muted, fontSize: 14, marginTop: 8 }}>구현 예정</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 20, padding: 12, backgroundColor: colors.primary, borderRadius: 8 }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>닫기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
