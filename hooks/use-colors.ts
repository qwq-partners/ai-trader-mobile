import { getColors } from '@/lib/_core/theme';
import type { ThemeColors } from '@/constants/theme';

export function useColors(): ThemeColors {
  return getColors();
}
