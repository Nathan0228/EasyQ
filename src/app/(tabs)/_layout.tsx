import { Stack } from "expo-router";
import { NativeTabs } from "expo-router/native-tabs";
import { Platform } from "react-native";

import { useApp } from "@/context/app-context";

export default function MainTabsLayout() {
  const { colors, language, theme } = useApp();

  if (Platform.OS !== "ios") {
    return <Stack screenOptions={{ headerShown: false, animation: "fade" }} />;
  }

  return (
    <NativeTabs
      tintColor={colors.accent}
      iconColor={{ default: colors.secondary, selected: colors.accent }}
      labelStyle={{ default: { color: colors.secondary }, selected: { color: colors.accent } }}
      blurEffect={theme === "dark" ? "systemUltraThinMaterialDark" : "systemUltraThinMaterialLight"}
      disableTransparentOnScrollEdge
      minimizeBehavior="never"
    >
      <NativeTabs.Trigger name="index" contentStyle={{ backgroundColor: colors.background }}>
        <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} />
        <NativeTabs.Trigger.Label>{language === "zh" ? "首页" : "Home"}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="blog" contentStyle={{ backgroundColor: colors.background }}>
        <NativeTabs.Trigger.Icon sf={{ default: "book", selected: "book.fill" }} />
        <NativeTabs.Trigger.Label>{language === "zh" ? "博客" : "Blog"}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="tools" contentStyle={{ backgroundColor: colors.background }}>
        <NativeTabs.Trigger.Icon sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }} />
        <NativeTabs.Trigger.Label>{language === "zh" ? "工具" : "Tools"}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
