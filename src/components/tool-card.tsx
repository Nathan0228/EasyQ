import { Link, type Href } from "expo-router";
import { useState } from "react";
import { Image, Pressable, View } from "react-native";
import { AppText } from "@/components/app-text";
import { useApp } from "@/context/app-context";

export function ToolIcon({ uri, name }: { uri?: string; name: string }) {
  const { colors } = useApp();
  const [failed, setFailed] = useState(false);
  return <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-2xl" style={{ backgroundColor: colors.surfaceSoft }}>
    {uri && !failed ? <Image accessibilityLabel="" source={{ uri }} style={{ width: 40, height: 40 }} resizeMode="contain" onError={() => setFailed(true)} /> : <AppText className="text-2xl font-semibold" style={{ color: colors.accent }}>{Array.from(name)[0] || "↗"}</AppText>}
  </View>;
}
export function ToolCard({ name, description, href, iconUrl, external = false }: {
  name: string; description: string; href: Href; iconUrl?: string; external?: boolean;
}) {
  const { colors, language } = useApp();
  return <Link href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} asChild>
    <Pressable accessibilityRole="link" accessibilityLabel={external ? `${name}，${language === "zh" ? "在新标签页打开" : "opens in a new tab"}` : name} className="feature-card ui-pressable h-full rounded-[26px] border p-6" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
      <View className="mb-6 flex-row items-start justify-between"><ToolIcon key={iconUrl || "default"} uri={iconUrl} name={name} /><AppText className="text-xs" style={{ color: colors.secondary }}>{external ? (language === "zh" ? "站外 ↗" : "EXTERNAL ↗") : (language === "zh" ? "站内 →" : "EASYQ →")}</AppText></View>
      <AppText accessibilityRole="header" className="mb-3 text-[23px] font-semibold">{name}</AppText>
      <AppText className="flex-1 text-sm leading-6" style={{ color: colors.secondary }}>{description}</AppText>
      <AppText className="mt-6 text-sm font-semibold" style={{ color: colors.accent }}>{external ? (language === "zh" ? "访问网站 ↗" : "Visit website ↗") : (language === "zh" ? "开始使用 →" : "Open tool →")}</AppText>
    </Pressable>
  </Link>;
}
