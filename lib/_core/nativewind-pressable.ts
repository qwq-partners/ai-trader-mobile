import { Pressable } from 'react-native';
import { cssInterop } from 'nativewind';

export const NativeWindPressable = cssInterop(Pressable, {
  className: 'style',
});
