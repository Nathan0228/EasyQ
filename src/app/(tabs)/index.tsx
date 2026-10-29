import { Link } from "expo-router";
import { Pressable, View } from "react-native";
import { AppText } from "@/components/app-text";
import { Eyebrow, PortalScreen } from "@/components/portal-ui";
import { useApp } from "@/context/app-context";

export default function Portal() {
  const { colors, language } = useApp();
  const zh = language === "zh";
  const features = [
    { href: "/blog" as const, number: "01", label: zh ? "博客" : "Writing", en: "NOTES & STORIES", description: zh ? "记录想法、技术与生活。让值得留下的文字，有一个自己的地方。" : "A home for thoughts, technology, and stories worth keeping.", action: zh ? "翻开看看" : "Start reading", mark: "Aa", color: colors.warm },
    { href: "/ask" as const, number: "02", label: zh ? "安静提问" : "Quiet questions", en: "ASK WITHOUT A SOUND", description: zh ? "写下问题，把手机递给对方。在需要安静的时候，也能好好交流。" : "Write a question and hand over your phone. Keep the conversation quiet.", action: zh ? "开始提问" : "Ask a question", mark: "Q?", color: colors.surfaceSoft },
  ];
  return <PortalScreen tabs>
    <View className="pb-10 pt-6 sm:pt-12">
      <Eyebrow>WELCOME TO EASYQ</Eyebrow>
      <AppText accessibilityRole="header" className="text-[40px] font-semibold leading-[53px] tracking-tight sm:text-[52px] sm:leading-[66px]">{zh ? "留一点空间，\n给想法和日常。" : "A little space for\nideas and everyday life."}</AppText>
      <AppText className="mt-6 max-w-[500px] text-base leading-7" style={{ color: colors.secondary }}>{zh ? "这里是 EasyQ。一个慢慢生长的个人门户，收下文字，也放进一些好用的小工具。" : "This is EasyQ. A growing personal space for writing and small, useful tools."}</AppText>
    </View>
    <View className="mb-5 flex-row items-center justify-between border-t pt-6" style={{ borderColor: colors.border }}><AppText className="text-sm font-semibold">{zh ? "从这里开始" : "Explore"}</AppText><AppText className="text-xs" style={{ color: colors.secondary }}>02 / SPACES</AppText></View>
    <View className="gap-4 sm:flex-row">
      {features.map((feature) => <Link key={feature.href} href={feature.href} asChild><Pressable className="feature-card ui-pressable flex-1 rounded-[26px] border p-6" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <View className="mb-8 flex-row items-start justify-between"><View className="h-[76px] w-[76px] items-center justify-center rounded-[20px]" style={{ backgroundColor: feature.color }}><AppText className="text-[30px] font-semibold" style={{ color: feature.href === "/blog" ? colors.warmText : colors.accent }}>{feature.mark}</AppText></View><AppText className="text-xs" style={{ color: colors.secondary }}>{feature.number}</AppText></View>
        <AppText className="mb-2 text-[25px] font-semibold">{feature.label}</AppText><AppText className="mb-4 text-[10px] tracking-[1px]" style={{ color: colors.secondary }}>{feature.en}</AppText><AppText className="min-h-[72px] text-sm leading-6" style={{ color: colors.secondary }}>{feature.description}</AppText><AppText className="mt-6 text-sm font-semibold" style={{ color: colors.accent }}>{feature.action} →</AppText>
      </Pressable></Link>)}
    </View>
    <AppText className="mt-8 text-center text-xs" style={{ color: colors.secondary }}>{zh ? "更多想法，会在这里慢慢发生。" : "More ideas will find a home here."}</AppText>
  </PortalScreen>;
}
