export const Colors = {
  dark: {
    background: "#0b0b14",
    surface: "#12121e",
    elevated: "#1a1a2e",
    border: "rgba(255,255,255,0.07)",
    foreground: "#e2e8f0",
    muted: "#94a3b8",
    primary: "#6366f1",
    primaryLight: "#818cf8",
    success: "#34d399",
    error: "#f87171",
    warning: "#fbbf24",
    info: "#60a5fa",
    profit: "#34d399",
    loss: "#f87171",
  },
  light: {
    // 라이트 모드는 미사용, 다크만 지원
    background: "#0b0b14",
    surface: "#12121e",
    elevated: "#1a1a2e",
    border: "rgba(255,255,255,0.07)",
    foreground: "#e2e8f0",
    muted: "#94a3b8",
    primary: "#6366f1",
    primaryLight: "#818cf8",
    success: "#34d399",
    error: "#f87171",
    warning: "#fbbf24",
    info: "#60a5fa",
    profit: "#34d399",
    loss: "#f87171",
  },
};

export type ThemeColors = typeof Colors.dark;
