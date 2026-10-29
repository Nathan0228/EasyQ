import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { AppText } from "@/components/app-text";
import { Markdown } from "@/components/markdown";
import { Eyebrow, Loading, Notice, PortalScreen, TextLink } from "@/components/portal-ui";
import { useApp } from "@/context/app-context";
import { blogAPI, siteAuthor } from "@/lib/blog-api";
import type { BlogPost } from "@/types/blog";

export default function Article() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <ArticleContent key={slug} slug={slug} />;
}

function ArticleContent({ slug }: { slug: string }) {
  const { colors, language } = useApp();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const load = useCallback(async () => {
    setBusy(true); setError(""); setPost(null);
    try { setPost(await blogAPI.article(slug)); } catch (e) { setError(e instanceof Error ? e.message : "加载失败"); } finally { setBusy(false); }
  }, [slug]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  return <PortalScreen>
    <TextLink href="/blog" label={language === "zh" ? "← 所有文章" : "← All stories"} />
    {busy && <Loading />}
    {Boolean(error) && <Notice message={error} retry={() => void load()} />}
    {post && <View className="pt-7">
      <Eyebrow>{post.category || "JOURNAL"}</Eyebrow>
      <AppText accessibilityRole="header" className="text-[34px] font-semibold leading-[46px]">{post.title}</AppText>
      <AppText className="mb-9 mt-5 text-xs leading-6" style={{ color: colors.secondary }}>{siteAuthor}  /  {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}  /  {Math.max(1, Math.ceil((post.content?.length || 0) / 500))} {language === "zh" ? "分钟阅读" : "min read"}</AppText>
      {Boolean(post.excerpt) && <AppText className="mb-8 border-l-2 pl-5 text-base leading-8" style={{ borderColor: colors.accent, color: colors.secondary }}>{post.excerpt}</AppText>}
      <Markdown content={post.content || ""} />
      <AppText className="mt-10 text-xs tracking-[3px]" style={{ color: colors.secondary }}>— END —</AppText>
    </View>}
  </PortalScreen>;
}

