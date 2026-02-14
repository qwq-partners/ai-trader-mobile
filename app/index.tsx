import { View, Text } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-foreground text-xl font-bold">AI Trader</Text>
      <Text className="text-muted text-sm mt-2">Mobile Dashboard</Text>
    </View>
  );
}
