import { Link, usePathname } from "expo-router";
import { Pressable } from "react-native";
import { AppIcon } from "@/components/app-icon";
import { AppText } from "@/components/app-text";
import { useApp } from "@/context/app-context";

export function WebBottomTabs() {
  const pathname = usePathname();
  const { colors, language, theme } = useApp();
  if (!["/", "/blog", "/tools"].includes(pathname)) return null;
  const tabs = [
    { href: "/" as const, icon: "home" as const, label: language === "zh" ? "首页" : "Home" },
    { href: "/blog" as const, icon: "book" as const, label: language === "zh" ? "博客" : "Blog" },
    { href: "/tools" as const, icon: "tools" as const, label: language === "zh" ? "工具" : "Tools" },
  ];
  return <nav className={`web-bottom-tabs ${theme === "dark" ? "web-bottom-tabs--dark" : ""}`} aria-label={language === "zh" ? "主导航" : "Main navigation"}>
    {tabs.map(tab => {
      const selected = pathname === tab.href;
      return <Link key={tab.href} href={tab.href} asChild><Pressable accessibilityRole="link" accessibilityState={{ selected }} style={{ flex: 1, minHeight: 58, alignItems: "center", justifyContent: "center", gap: 3, borderRadius: 23, backgroundColor: selected ? colors.surfaceSoft : "transparent" }}>
        <AppIcon name={tab.icon} size={22} color={selected ? colors.accent : colors.secondary} />
        <AppText style={{ color: selected ? colors.accent : colors.secondary, fontSize: 11, fontWeight: "600" }}>{tab.label}</AppText>
      </Pressable></Link>;
    })}
  </nav>;
}
