import { Stack } from "expo-router";
import { View } from "react-native";

import { WebBottomTabs } from "@/components/web-bottom-tabs";

export default function WebTabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
      <WebBottomTabs />
    </View>
  );
}
