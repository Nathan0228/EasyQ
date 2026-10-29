import { Stack } from "expo-router";
import { NativeTabs } from "expo-router/native-tabs";
import { Platform } from "react-native";

import { useApp } from "@/context/app-context";
import { copy } from "@/i18n/copy";

export default function MainTabsLayout() {
  const { colors, language, theme } = useApp();
  const t = copy[language];

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
      <NativeTabs.Trigger name="ask" contentStyle={{ backgroundColor: colors.background }}>
        <NativeTabs.Trigger.Icon sf={{ default: "bubble.left", selected: "bubble.left.fill" }} />
        <NativeTabs.Trigger.Label>{t.tabAsk}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="history" contentStyle={{ backgroundColor: colors.background }}>
        <NativeTabs.Trigger.Icon sf={{ default: "clock", selected: "clock.fill" }} />
        <NativeTabs.Trigger.Label>{t.history}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
