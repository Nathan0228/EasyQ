import { Linking, Pressable, View } from "react-native";
import { AppText } from "@/components/app-text";
import { useApp } from "@/context/app-context";
import type { MarkdownVideo } from "@/lib/markdown-video";

export function VideoEmbed({ video }: { video: MarkdownVideo }) {
  const { colors, language } = useApp();
  return <Pressable
    accessibilityRole="link"
    accessibilityLabel={`${language === "zh" ? "打开视频" : "Open video"}: ${video.title}`}
    onPress={() => void Linking.openURL(video.url).catch(() => {})}
    className="my-5 rounded-xl border p-5"
    style={{ borderColor: colors.border, backgroundColor: colors.surfaceSoft }}
  >
    <View className="flex-row items-center gap-3">
      <AppText className="text-2xl" style={{ color: colors.accent }}>▶</AppText>
      <View className="flex-1">
        <AppText className="text-base font-semibold">{video.title}</AppText>
        <AppText className="mt-1 text-xs" style={{ color: colors.secondary }}>{language === "zh" ? "打开视频链接" : "Open video link"}</AppText>
      </View>
      <AppText style={{ color: colors.accent }}>↗</AppText>
    </View>
  </Pressable>;
}
