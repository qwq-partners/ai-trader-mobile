import React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { type IconProps } from '@expo/vector-icons/build/createIconSet';
import type { ComponentProps } from 'react';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

interface IconSymbolProps {
  name: MaterialIconName;
  size?: number;
  color: string;
  style?: any;
}

export function IconSymbol({ name, size = 24, color, style }: IconSymbolProps) {
  return <MaterialIcons name={name} size={size} color={color} style={style} />;
}
