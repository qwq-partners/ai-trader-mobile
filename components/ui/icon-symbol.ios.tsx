import React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

interface IconSymbolProps {
  name: MaterialIconName;
  size?: number;
  color: string;
  style?: any;
}

// iOS에서도 MaterialIcons 사용 (SF Symbols 대신)
export function IconSymbol({ name, size = 24, color, style }: IconSymbolProps) {
  return <MaterialIcons name={name} size={size} color={color} style={style} />;
}
