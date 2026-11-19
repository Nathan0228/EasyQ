import { Link, type Href } from "expo-router";
import { useState } from "react";
import { Image, Platform, Pressable, View } from "react-native";
import { AppText } from "@/components/app-text";
import { AppIcon } from "@/components/app-icon";
import { useApp } from "@/context/app-context";
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
