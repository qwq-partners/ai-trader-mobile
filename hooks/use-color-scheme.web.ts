import { useEffect, useState } from 'react';

export function useColorScheme() {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setColorScheme(mq.matches ? 'dark' : 'light');
    const handler = (e: MediaQueryListEvent) => setColorScheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return colorScheme;
}
