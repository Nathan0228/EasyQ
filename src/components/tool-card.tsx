import { Link, type Href } from "expo-router";
import { useId, useState } from "react";
import { Image, Platform, Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { AppText } from "@/components/app-text";
import { AppIcon } from "@/components/app-icon";
import { useApp } from "@/context/app-context";
import { decorativeSvgProps } from "@/lib/decorative-svg";
import { internalTools, type InternalTool } from "@/lib/internal-tools";
import type { ExternalTool } from "@/types/tool";

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
const internalColors = {
  traval: { light: ["#F9FBFA", "#E5EFEB"], dark: ["#293632", "#222D2B"] },
  questions: { light: ["#FCFCF6", "#EBF0E4"], dark: ["#2E382F", "#252E27"] },
} as const;

export function InternalToolCard({ tool, active }: { tool: InternalTool; active: boolean }) {
  const { colors, language, theme } = useApp();
  const gradientId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const travel = tool === "traval";
  const { name, description } = internalTools[tool][language];
  const [top, bottom] = internalColors[tool][theme];

  return (
    <Link href={internalTools[tool].href} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={name}
        accessibilityHint={description}
        aria-hidden={!active}
        importantForAccessibility={active ? "auto" : "no-hide-descendants"}
        focusable={active}
        tabIndex={active ? 0 : -1}
        pointerEvents={active ? "auto" : "none"}
        className="internal-tool-card ui-pressable flex-1 items-center justify-center overflow-hidden rounded-3xl border px-4 py-6"
        style={{ borderColor: colors.border, backgroundColor: top, minHeight: 230 }}
      >
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Svg width="100%" height="100%" {...decorativeSvgProps}>
            <Defs>
              <LinearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={top} />
                <Stop offset="100%" stopColor={bottom} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
          </Svg>
        </View>
        <View className="mb-3 h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.surfaceSoft }}>
          {travel ? (
            <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={colors.accent}
              strokeWidth={1.55} strokeLinecap="round" {...decorativeSvgProps}>
              <Circle cx={12} cy={12} r={9} />
              <Path d="M3 12h18M12 3c2.1 2.4 3.2 5.4 3.2 9s-1.1 6.6-3.2 9c-2.1-2.4-3.2-5.4-3.2-9S9.9 5.4 12 3Z" />
            </Svg>
          ) : <AppIcon name="message" size={25} color={colors.accent} />}
        </View>
        <AppText className="mb-2 text-center text-[26px] font-semibold leading-8" style={{ fontFamily: titleFont }}>{name}</AppText>
        <AppText className="max-w-[330px] text-center text-sm leading-6" style={{ color: colors.secondary }}>{description}</AppText>
      </Pressable>
    </Link>
  );
}

export function ExternalToolCard({ tool }: { tool: ExternalTool }) {
  const { colors, language } = useApp();
  let host = "";
  try { host = new URL(tool.url).hostname; } catch { /* Older entries may omit the hostname. */ }
  const web = Platform.OS === "web";
  const hint = language === "zh" ? "在新标签页打开" : "Opens in a new tab";
  const webLinkProps = web ? { hrefAttrs: { target: "_blank", rel: "noopener noreferrer" } } : {};
  return <Link href={tool.url as Href} target="_blank" rel="noopener noreferrer" asChild>
    <Pressable {...webLinkProps} accessibilityRole="link" accessibilityLabel={web ? `${tool.name} · ${hint}` : tool.name}
      className="tool-card ui-pressable flex-1 gap-3 rounded-2xl border p-5"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
      <View className="flex-row items-center gap-3">
        <ToolIcon key={tool.iconUrl} uri={tool.iconUrl} name={tool.name} />
        <View className="min-w-0 flex-1 gap-1">
          <AppText className="text-lg font-semibold leading-6">{tool.name}</AppText>
          {Boolean(host) && <AppText numberOfLines={1} className="text-xs" style={{ color: colors.secondary }}>{host}</AppText>}
        </View>
        <View style={{ transform: [{ rotate: "135deg" }] }}><AppIcon name="arrow" size={17} color={colors.accent} /></View>
      </View>
      {Boolean(tool.description) && <AppText className="text-sm leading-6" style={{ color: colors.secondary }}>{tool.description}</AppText>}
    </Pressable>
  </Link>;
}
