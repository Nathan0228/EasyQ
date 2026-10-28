import { Link, usePathname } from "expo-router";
import { Pressable } from "react-native";

import { AppIcon } from "@/components/app-icon";
import { AppText } from "@/components/app-text";
import { useApp } from "@/context/app-context";
import { copy } from "@/i18n/copy";

export function WebBottomTabs() {
  const pathname = usePathname();
  const { colors, language, theme } = useApp();
  const t = copy[language];
  const onAsk = pathname === "/";
  const onHistory = pathname === "/history";

  if (!onAsk && !onHistory) return null;

  return (
    <nav className={`web-bottom-tabs ${theme === "dark" ? "web-bottom-tabs--dark" : ""}`} aria-label={language === "zh" ? "主导航" : "Main navigation"}>
      <Link href="/" asChild>
        <Pressable accessibilityRole="link" accessibilityState={{ selected: onAsk }} style={{ flex: 1, minHeight: 58, alignItems: "center", justifyContent: "center", gap: 3, borderRadius: 23, backgroundColor: onAsk ? theme === "dark" ? "rgba(167, 197, 176, 0.18)" : "rgba(49, 95, 78, 0.1)" : "transparent" }}>
          <AppIcon name="message" size={22} color={onAsk ? colors.accent : colors.secondary} />
          <AppText style={{ color: onAsk ? colors.accent : colors.secondary, fontSize: 11, fontWeight: "600" }}>{t.tabAsk}</AppText>
        </Pressable>
      </Link>
      <Link href="/history" asChild>
        <Pressable accessibilityRole="link" accessibilityState={{ selected: onHistory }} style={{ flex: 1, minHeight: 58, alignItems: "center", justifyContent: "center", gap: 3, borderRadius: 23, backgroundColor: onHistory ? theme === "dark" ? "rgba(167, 197, 176, 0.18)" : "rgba(49, 95, 78, 0.1)" : "transparent" }}>
          <AppIcon name="history" size={22} color={onHistory ? colors.accent : colors.secondary} />
          <AppText style={{ color: onHistory ? colors.accent : colors.secondary, fontSize: 11, fontWeight: "600" }}>{t.history}</AppText>
        </Pressable>
      </Link>
    </nav>
  );
}
