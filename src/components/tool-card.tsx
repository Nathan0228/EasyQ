import { Link, type Href } from "expo-router";
import { useState } from "react";
import { Image, Platform, Pressable, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { AppText } from "@/components/app-text";
import { AppIcon } from "@/components/app-icon";
import { useApp } from "@/context/app-context";
import { decorativeSvgProps } from "@/lib/decorative-svg";
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
export function QuietQuestionsCard() {
  const { language, theme } = useApp();
  const zh = language === "zh";
  const name = zh ? "安静提问" : "Quiet questions";
  return <Link href="/ask" asChild>
    <Pressable accessibilityRole="link" accessibilityLabel={name}
      className="tool-card ui-pressable gap-4 rounded-3xl p-6 sm:p-8"
      style={{ backgroundColor: theme === "dark" ? "#28483C" : "#254E40" }}>
      <View className="flex-row items-center gap-4">
        <View className="h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: "#406856" }}>
          <AppIcon name="message" size={26} color="#E1F1DC" />
        </View>
        <AppText className="min-w-0 flex-1 text-[29px] font-semibold leading-10" style={{ color: "#FAFBF5", fontFamily: titleFont }}>{name}</AppText>
      </View>
      <AppText className="max-w-[510px] text-base leading-7" style={{ color: "#E0EBE1" }}>
        {zh ? "写下问题，把手机递给对方，安静地聊一聊。历史记录保存在当前设备。" : "Write a question and pass your phone for a quiet conversation. Your history stays on this device."}
      </AppText>
      <View className="flex-row items-center gap-2 self-start rounded-full px-4 py-2" style={{ backgroundColor: "#E1F1DC" }}>
        <AppText className="text-sm font-semibold" style={{ color: "#254E40" }}>{zh ? "开始提问" : "Ask a question"}</AppText>
        <View style={{ transform: [{ rotate: "180deg" }] }}><AppIcon name="arrow" size={16} color="#254E40" /></View>
      </View>
    </Pressable>
  </Link>;
}

export function TravalCard() {
  const { language, theme } = useApp();
  const zh = language === "zh";
  return <Link href="/traval" asChild>
    <Pressable accessibilityRole="link" accessibilityLabel="Traval"
      className="tool-card ui-pressable flex-1 gap-4 rounded-3xl p-6 sm:p-8"
      style={{ backgroundColor: theme === "dark" ? "#394B4B" : "#2E4E52" }}>
      <View className="flex-row items-center gap-4">
        <View className="h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: "#4B6A6B" }}>
          <Svg width={27} height={27} viewBox="0 0 24 24" fill="none" stroke="#E2F1E8"
            strokeWidth={1.55} strokeLinecap="round" {...decorativeSvgProps}>
            <Circle cx={12} cy={12} r={9} />
            <Path d="M3 12h18M12 3c2.1 2.4 3.2 5.4 3.2 9s-1.1 6.6-3.2 9c-2.1-2.4-3.2-5.4-3.2-9S9.9 5.4 12 3Z" />
          </Svg>
        </View>
        <AppText className="min-w-0 flex-1 text-[29px] font-semibold leading-10"
          style={{ color: "#FAFBF5", fontFamily: titleFont }}>Traval</AppText>
      </View>
      <AppText className="flex-1 text-base leading-7" style={{ color: "#DFEBE7" }}>
        {zh ? "点亮去过的国家，记录在中国各地居住、工作、上学和旅行的经历。"
          : "Mark the countries you’ve visited and the places you’ve lived, worked, studied and travelled in China."}
      </AppText>
      <View className="flex-row items-center gap-2 self-start rounded-full px-4 py-2" style={{ backgroundColor: "#DFEBE7" }}>
        <AppText className="text-sm font-semibold" style={{ color: "#2E4E52" }}>{zh ? "打开足迹地图" : "Open travel map"}</AppText>
        <View style={{ transform: [{ rotate: "180deg" }] }}><AppIcon name="arrow" size={16} color="#2E4E52" /></View>
      </View>
    </Pressable>
  </Link>;
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
