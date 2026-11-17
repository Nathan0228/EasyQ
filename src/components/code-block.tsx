import * as Clipboard from "expo-clipboard";
import { useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, View } from "react-native";
import { AppText } from "@/components/app-text";
import { useApp } from "@/context/app-context";

const languageNames: Record<string, string> = {
  js: "JavaScript",
  javascript: "JavaScript",
  ts: "TypeScript",
  typescript: "TypeScript",
  py: "Python",
  python: "Python",
  rb: "Ruby",
  sh: "Shell",
  shell: "Shell",
  yml: "YAML",
  yaml: "YAML",
};

export function CodeBlock({ code, info }: { code: string; info: string }) {
  const { colors, language } = useApp();
  const [feedback, setFeedback] = useState<"copied" | "error" | null>(null);
  const label = info ? languageNames[info.toLowerCase()] || info : language === "zh" ? "代码" : "Code";
  const copyLabel = feedback === "copied" ? language === "zh" ? "已复制" : "Copied"
    : feedback === "error" ? language === "zh" ? "复制失败" : "Copy failed"
    : language === "zh" ? "复制" : "Copy";

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 2500);
    return () => clearTimeout(timer);
  }, [feedback]);

  async function copyCode() {
    try {
      // Start the clipboard write directly from the press event for browser support.
      await Clipboard.setStringAsync(code);
      setFeedback("copied");
    } catch {
      setFeedback("error");
    }
  }

  return <View className="my-4 overflow-hidden rounded-xl" style={{ backgroundColor: colors.surfaceSoft }}>
    <View className="min-h-11 flex-row items-center justify-between border-b pl-5 pr-2" style={{ borderColor: colors.border }}>
      <AppText className="flex-1 text-xs font-semibold" numberOfLines={1} style={{ color: colors.secondary }}>{label}</AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={feedback ? copyLabel : language === "zh" ? info ? `复制${label}代码` : "复制代码" : `Copy ${label} code`}
        onPress={() => void copyCode()}
        className="min-h-11 min-w-16 items-center justify-center rounded-lg px-3"
      >
        <AppText accessibilityLiveRegion="polite" className="text-xs font-semibold" style={{ color: feedback === "error" ? colors.danger : colors.accent }}>{copyLabel}</AppText>
      </Pressable>
    </View>
    <ScrollView horizontal contentContainerStyle={{ padding: 20 }}>
      <AppText selectable style={{ fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 13, lineHeight: 22 }}>{code}</AppText>
    </ScrollView>
  </View>;
}
