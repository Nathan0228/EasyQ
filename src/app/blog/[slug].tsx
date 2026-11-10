import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { View } from "react-native";
import { AppText } from "@/components/app-text";
import { ArticleMore } from "@/components/article-more";
import { Markdown } from "@/components/markdown";
import { Eyebrow, Loading, Notice, PortalScreen, TextLink } from "@/components/portal-ui";
import { useApp } from "@/context/app-context";
import { blogAPI, cachedArticle, siteAuthor } from "@/lib/blog-api";
import type { BlogPost } from "@/types/blog";

export default function Article() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <ArticleContent key={slug} slug={slug} />;
}

function ArticleContent({ slug }: { slug: string }) {
  const { colors, language } = useApp();
  const [post, setPost] = useState<BlogPost | null>(() => cachedArticle(slug) ?? null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(() => !cachedArticle(slug));
  const requestID = useRef(0);
  const load = useCallback(async () => {
    const id = ++requestID.current;
    setBusy(!cachedArticle(slug)); setError("");
    // Recommendations and body are independent; do not wait for the body first.
    void blogAPI.reading(slug).catch(() => {});
    try {
      const result = await blogAPI.article(slug);
      if (id === requestID.current) setPost(result);
    } catch (e) {
      if (id === requestID.current) { setPost(null); setError(e instanceof Error ? e.message : "加载失败"); }
    } finally { if (id === requestID.current) setBusy(false); }
  }, [slug]);
  useFocusEffect(useCallback(() => { void load(); return () => { requestID.current++; }; }, [load]));
  return <PortalScreen backToTop={Boolean(post)}>
    <TextLink href="/blog" label={language === "zh" ? "← 所有文章" : "← All stories"} />
    {busy && <Loading />}
    {Boolean(error) && <Notice message={error} retry={() => void load()} />}
    {post && <View className="pt-7">
      <Eyebrow>{post.category || "JOURNAL"}</Eyebrow>
      <AppText accessibilityRole="header" className="text-[34px] font-semibold leading-[46px]">{post.title}</AppText>
      <View className="mb-9 mt-5">
        <AppText className="text-xs leading-6" style={{ color: colors.secondary }}>{siteAuthor}  /  {new Date(post.publishedAt || post.createdAt).toLocaleDateString(language === "zh" ? "zh-CN" : "en-US")}  /  {Math.max(1, Math.ceil((post.content?.length || 0) / 500))} {language === "zh" ? "分钟阅读" : "min read"}</AppText>
        {Number.isFinite(Date.parse(post.updatedAt)) && <AppText className="mt-1 text-xs leading-6" style={{ color: colors.secondary }}>
          {language === "zh" ? "更新于 " : "Updated "}{new Date(post.updatedAt).toLocaleString(language === "zh" ? "zh-CN" : "en-US", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })}
        </AppText>}
      </View>
      {Boolean(post.excerpt) && <AppText className="mb-8 border-l-2 pl-5 text-base leading-8" style={{ borderColor: colors.accent, color: colors.secondary }}>{post.excerpt}</AppText>}
      <Markdown content={post.content || ""} />
      <AppText className="mt-10 text-xs tracking-[3px]" style={{ color: colors.secondary }}>— END —</AppText>
      <ArticleMore key={post.slug} slug={post.slug} category={post.category} />
    </View>}
  </PortalScreen>;
}

