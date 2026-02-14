import React, { createContext, useContext } from 'react';
import { getColors } from '@/lib/_core/theme';
import type { ThemeColors } from '@/constants/theme';

const ThemeContext = createContext<ThemeColors>(getColors());

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colors = getColors();
  return (
    <ThemeContext.Provider value={colors}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeColors {
  return useContext(ThemeContext);
}
