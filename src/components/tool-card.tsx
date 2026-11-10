import { Link, type Href } from "expo-router";
import { useState } from "react";
import { Image, Platform, Pressable, View } from "react-native";
import { AppText } from "@/components/app-text";
import { AppIcon } from "@/components/app-icon";
import { useApp } from "@/context/app-context";

const titleFont = Platform.select({
  web: '"Kaiti SC", "STKaiti", "KaiTi", "Baskerville", "Palatino Linotype", Georgia, serif',
  ios: "Kaiti SC",
  android: "serif",
});

export function ToolIcon({ uri, name, plain = false }: { uri?: string; name: string; plain?: boolean }) {
  const { colors } = useApp();
  const [failed, setFailed] = useState(false);
  return <View className="h-14 w-14 items-center justify-center overflow-hidden" style={{ backgroundColor: plain ? "transparent" : colors.surfaceSoft, borderRadius: plain ? 0 : 16 }}>
    {uri && !failed ? <Image accessibilityLabel="" source={{ uri }} style={{ width: plain ? 44 : 40, height: plain ? 44 : 40 }} resizeMode="contain" onError={() => setFailed(true)} /> : <AppText className="text-[32px]" style={{ color: colors.accent, fontFamily: titleFont }}>{Array.from(name)[0] || "↗"}</AppText>}
  </View>;
}
export function ToolCard({ name, description, href, iconUrl, external = false }: {
  name: string; description: string; href: Href; iconUrl?: string; external?: boolean;
}) {
  const { colors, language } = useApp();
  // Link.asChild forwards target/rel directly, but RN Web's Pressable/View
  // only writes those anchor attributes when supplied through hrefAttrs.
  const webLinkProps = Platform.OS === "web" && external
    ? { hrefAttrs: { target: "_blank", rel: "noopener noreferrer" } }
    : {};
  return <Link href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} asChild>
    <Pressable {...webLinkProps} accessibilityRole="link" accessibilityLabel={external ? `${name}，${language === "zh" ? "在新标签页打开" : "opens in a new tab"}` : name} className="tool-card ui-pressable min-h-[164px] flex-row items-center rounded-lg border px-4 py-5" style={{ flex: 1, borderColor: colors.border }}>
      <View className="w-28 shrink-0 items-center border-r pr-4" style={{ borderColor: colors.border }}>
        <ToolIcon key={iconUrl || "default"} uri={iconUrl} name={name} plain />
        <AppText accessibilityRole="header" numberOfLines={3} className="mt-2 text-center text-[23px] leading-7" style={{ fontFamily: titleFont, fontWeight: "400", fontStyle: /[\u3400-\u9fff]/.test(name) ? "normal" : "italic" }}>{name}</AppText>
      </View>
      <View className="min-w-0 flex-1 pl-4">
        <AppText className="text-sm leading-6" style={{ color: colors.secondary }}>{description}</AppText>
        <View className="mt-4 self-end" style={{ transform: [{ rotate: external ? "135deg" : "180deg" }] }}>
          <AppIcon name="arrow" size={17} color={colors.secondary} />
        </View>
      </View>
    </Pressable>
  </Link>;
}
