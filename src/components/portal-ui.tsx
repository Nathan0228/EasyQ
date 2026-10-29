import { Link, type Href } from "expo-router";
import { ActivityIndicator, Pressable, View } from "react-native";
import { AppText } from "@/components/app-text";
import { BrandHeader, Screen } from "@/components/ui";
import { useApp } from "@/context/app-context";
import type { BlogPost } from "@/types/blog";

export function PortalScreen({ children, tabs = false }: { children: React.ReactNode; tabs?: boolean }) {
  const { colors, language } = useApp();
  return <Screen inNativeTab={tabs} maxWidth={780}>
    <BrandHeader subtitle={language === "zh" ? "一个人的数字花园" : "A personal digital garden"} />
    {children}
    <View className="mt-16 flex-row flex-wrap items-center justify-between gap-3 border-t pt-6" style={{ borderColor: colors.border }}>
      <AppText className="text-xs" style={{ color: colors.secondary }}>EasyQ · {new Date().getFullYear()}</AppText>
      <View className="flex-row gap-5"><TextLink href="/" label={language === "zh" ? "功能入口" : "Explore"} /><TextLink href="/admin" label={language === "zh" ? "写作台" : "Studio"} /></View>
    </View>
  </Screen>;
}
export function TextLink({ href, label }: { href: Href; label: string }) {
  const { colors } = useApp();
  return <Link href={href} asChild><Pressable className="ui-pressable min-h-11 justify-center"><AppText className="text-sm font-medium" style={{ color: colors.accent }}>{label}</AppText></Pressable></Link>;
}
export function Eyebrow({ children }: { children: React.ReactNode }) {
  const { colors } = useApp();
  return <AppText className="mb-4 text-xs font-semibold tracking-[2px]" style={{ color: colors.secondary }}>{children}</AppText>;
}
export function Notice({ message, retry }: { message: string; retry?: () => void }) {
  const { colors } = useApp();
  return <View className="my-6 rounded-2xl p-5" style={{ backgroundColor: colors.surfaceSoft }}><AppText accessibilityLiveRegion="polite" className="text-sm leading-6">{message}</AppText>{retry && <Pressable onPress={retry} className="mt-2 min-h-11 justify-center"><AppText style={{ color: colors.accent }}>重试 / Retry →</AppText></Pressable>}</View>;
}
export function Loading() { const { colors } = useApp(); return <ActivityIndicator className="my-10" color={colors.accent} />; }
export function PostRow({ post, admin = false }: { post: BlogPost; admin?: boolean }) {
  const { colors, language } = useApp();
  const date = new Date(post.publishedAt || post.updatedAt).toLocaleDateString(language === "zh" ? "zh-CN" : "en-US", { year: "numeric", month: "short", day: "numeric" });
  return <Link href={admin ? { pathname: "/admin/editor", params: { id: post.id } } : { pathname: "/blog/[slug]", params: { slug: post.slug } }} asChild>
    <Pressable className="editorial-row ui-pressable border-b py-7" style={{ borderColor: colors.border }}>
      <View className="mb-3 flex-row flex-wrap gap-3"><AppText className="text-xs" style={{ color: colors.secondary }}>{date}</AppText>{Boolean(post.category) && <AppText className="text-xs" style={{ color: colors.accent }}>{post.category}</AppText>}{admin && <AppText className="text-xs" style={{ color: colors.accent }}>{post.status === "published" ? "已发布 / Published" : "草稿 / Draft"}</AppText>}</View>
      <View className="flex-row items-center gap-5"><AppText accessibilityRole="header" className="flex-1 text-[23px] font-semibold leading-8">{post.title}</AppText><AppText style={{ color: colors.secondary }}>↗</AppText></View>
      {Boolean(post.excerpt) && <AppText numberOfLines={2} className="mt-3 text-sm leading-6" style={{ color: colors.secondary }}>{post.excerpt}</AppText>}
    </Pressable>
  </Link>;
}
