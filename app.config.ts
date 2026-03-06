import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "AI Trader",
  slug: "ai-trader-mobile",
  version: "1.1.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "ai-trader",
  userInterfaceStyle: "dark",
  newArchEnabled: true,
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#0b0b14",
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "kr.ai.qwq.trader",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#0b0b14",
    },
    package: "kr.ai.qwq.trader",
  },
  web: {
    bundler: "metro",
    output: "single",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-notifications",
      {
        icon: "./assets/images/icon.png",
        color: "#6366f1",
        sounds: [],
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
});
