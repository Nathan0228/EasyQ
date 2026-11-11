import { useState } from "react";
import { Image, Linking, Platform, Pressable, ScrollView, View } from "react-native";
import { AppText } from "@/components/app-text";
import { ImagePreview, type PreviewImage } from "@/components/image-preview";
import { useApp } from "@/context/app-context";

// Render a deliberately small Markdown subset as native elements, never executable HTML.
function Inline({ text }: { text: string }) {
  const { colors } = useApp();
  return <>{text.split(/(\*\*[^*]+\*\*|\x60[^\x60]+\x60|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g).map((part, i) => {
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (link) return <AppText key={i} accessibilityRole="link" style={{ color: colors.accent, textDecorationLine: "underline" }} onPress={() => void Linking.openURL(link[2]).catch(() => {})}>{link[1]}</AppText>;
    if (part.startsWith("**") && part.endsWith("**")) return <AppText key={i} style={{ fontWeight: "700" }}>{part.slice(2, -2)}</AppText>;
    if (part.charCodeAt(0) === 96) return <AppText key={i} style={{ backgroundColor: colors.surfaceSoft, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" }}>{part.slice(1, -1)}</AppText>;
    return part;
  })}</>;
}
export function Markdown({ content }: { content: string }) {
  const { colors, language, theme } = useApp();
  const [preview, setPreview] = useState<PreviewImage | null>(null);
  const lines = content.replace(/\r/g, "").split("\n");
  const blocks: React.ReactNode[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    if (line.startsWith("```")) {
      const code = [];
      while (++i < lines.length && !lines[i].startsWith("```")) code.push(lines[i]);
      blocks.push(<ScrollView key={i} horizontal className="my-4 rounded-xl p-5" style={{ backgroundColor: colors.surfaceSoft }}><AppText selectable style={{ fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 13, lineHeight: 22 }}>{code.join("\n")}</AppText></ScrollView>);
      continue;
    }
    const image = line.match(/^!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)$/);
    if (image) {
      const [, description, url] = image;
      blocks.push(<View key={i} className="my-5">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={description ? `${language === "zh" ? "查看大图" : "View image"}: ${description}` : (language === "zh" ? "查看大图" : "View image")}
          accessibilityHint={language === "zh" ? "打开图片预览" : "Open image preview"}
          onPress={() => setPreview({ url, description })}
          className={`article-image article-image--${theme} ui-pressable rounded-xl`}
        >
          <Image accessible={false} source={{ uri: url }} style={{ width: "100%", aspectRatio: 1.6, borderRadius: 12 }} resizeMode="contain" />
        </Pressable>
        {Boolean(description) && <AppText className="mt-2 text-center text-xs" style={{ color: colors.secondary }}>{description}</AppText>}
      </View>);
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) { blocks.push(<AppText key={i} accessibilityRole="header" className="mb-3 mt-8 font-semibold" style={{ fontSize: heading[1].length === 1 ? 28 : heading[1].length === 2 ? 23 : 19, lineHeight: 34 }}><Inline text={heading[2]} /></AppText>); continue; }
    if (/^---+$/.test(line)) { blocks.push(<View key={i} className="my-7 border-t" style={{ borderColor: colors.border }} />); continue; }
    const quote = line.startsWith("> ");
    const bullet = line.match(/^[-*]\s+(.+)/);
    blocks.push(<AppText key={i} selectable className="mb-3 text-base leading-8" style={quote ? { borderLeftWidth: 3, borderLeftColor: colors.accent, paddingLeft: 18, color: colors.secondary } : undefined}><Inline text={quote ? line.slice(2) : bullet ? "•  " + bullet[1] : line} /></AppText>);
  }
  return <View>{blocks}{preview && <ImagePreview key={preview.url} image={preview} onClose={() => setPreview(null)} />}</View>;
}

