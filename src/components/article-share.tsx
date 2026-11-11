import { useEffect, useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { AppIcon } from "@/components/app-icon";
import { AppText } from "@/components/app-text";
import { useApp } from "@/context/app-context";
import { articleShareURL, shareArticle } from "@/lib/article-share";

export function ArticleShare({ slug, title }: { slug: string; title: string }) {
  const { colors, language, theme } = useApp();
  const zh = language === "zh";
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<"copied" | "error" | null>(null);
  const url = articleShareURL(slug);

  useEffect(() => {
    if (feedback !== "copied") return;
    const timer = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timer);
  }, [feedback]);

  async function handleShare() {
    if (busy) return;
    setBusy(true);
    setFeedback(null);
    try {
      const result = await shareArticle(title, url);
      if (result === "copied") setFeedback("copied");
    } catch {
      setFeedback("error");
    } finally {
      setBusy(false);
    }
  }

  return <View className="mt-5 items-end gap-3">
    <View className="flex-row items-center gap-3">
      {feedback === "copied" && <AppText accessibilityLiveRegion="polite" className="text-xs" style={{ color: colors.accent }}>{zh ? "链接已复制" : "Link copied"}</AppText>}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={zh ? "分享文章" : "Share article"}
        accessibilityHint={zh ? "分享或复制这篇文章的链接" : "Share or copy the link to this article"}
        accessibilityState={{ disabled: busy, busy }}
        disabled={busy}
        onPress={() => void handleShare()}
        className={`glass-button glass-button--${theme} ui-pressable h-11 w-11 items-center justify-center rounded-xl border`}
        style={{ opacity: busy ? 0.5 : 1, ...(Platform.OS === "web" ? {} : { backgroundColor: colors.surface, borderColor: colors.border }) }}
      >
        <AppIcon name="share" size={20} color={colors.text} />
      </Pressable>
    </View>
    {feedback === "error" && <View className="w-full gap-2">
      <AppText accessibilityLiveRegion="polite" className="text-xs leading-5" style={{ color: colors.secondary }}>{zh ? "暂时无法分享，请长按或选中下方链接复制。" : "Sharing is unavailable. Select or long-press the link below to copy it."}</AppText>
      <AppText selectable className="text-xs leading-5" style={{ color: colors.accent }}>{url}</AppText>
    </View>}
  </View>;
}
