// NativeWind className merge utility
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// 숫자 포맷 (한국식: 억/만)
export function formatCompactNumber(n: number): string {
  if (Math.abs(n) >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (Math.abs(n) >= 10_000) return `${Math.round(n / 10_000).toLocaleString()}만`;
  return n.toLocaleString();
}

// 날짜 포맷
export function toDateString(date: Date): string {
  return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}`;
}

// 색상 유틸
export function getPnlColor(pnl: number, colors: { profit: string; loss: string; muted: string }): string {
  if (pnl > 0) return colors.profit;
  if (pnl < 0) return colors.loss;
  return colors.muted;
}
