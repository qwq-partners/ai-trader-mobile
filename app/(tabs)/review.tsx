import React from 'react';
import { View, Text } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';

export default function ReviewScreen() {
  const colors = useColors();
  return (
    <ScreenContainer>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: colors.foreground, fontSize: 18 }}>리뷰 탭</Text>
        <Text style={{ color: colors.muted, fontSize: 14, marginTop: 8 }}>구현 예정</Text>
      </View>
    </ScreenContainer>
  );
}
