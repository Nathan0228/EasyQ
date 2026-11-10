import { Link, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { AppText } from "@/components/app-text";
import { Loading, Notice, PostRow } from "@/components/portal-ui";
import { useApp } from "@/context/app-context";
import { blogAPI, prefetchArticle } from "@/lib/blog-api";
import type { ArticleReading, BlogPost } from "@/types/blog";

function Neighbor({ post, next = false }: { post: BlogPost | null; next?: boolean }) {
  const { colors, language } = useApp();
  const zh = language === "zh";
  const label = next ? (zh ? "下一篇 →" : "Next →") : (zh ? "← 上一篇" : "← Previous");
  const content = <>
    <AppText className="mb-3 text-xs font-semibold" style={{ color: post ? colors.accent : colors.secondary }}>{label}</AppText>
    <AppText numberOfLines={3} className="text-base font-semibold leading-6" style={{ color: post ? colors.text : colors.secondary }}>{post?.title || (next ? (zh ? "已是最新文章" : "This is the newest story") : (zh ? "已是最早文章" : "This is the first story"))}</AppText>
  </>;
  return <View className="flex-1">
    {post ? <Link href={{ pathname: "/blog/[slug]", params: { slug: post.slug } }} asChild>
      <Pressable onHoverIn={() => prefetchArticle(post.slug)} onPressIn={() => prefetchArticle(post.slug)} accessibilityRole="link" accessibilityLabel={`${label} ${post.title}`} className="feature-card ui-pressable min-h-[120px] flex-1 rounded-2xl border p-5" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>{content}</Pressable>
    </Link> : <View className="min-h-[120px] flex-1 rounded-2xl border p-5" style={{ borderColor: colors.border }}>{content}</View>}
  </View>;
}

export function ArticleMore({ slug, category }: { slug: string; category: string }) {
  const { colors, language } = useApp();
  const zh = language === "zh";
  const [data, setData] = useState<ArticleReading | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const requestID = useRef(0);
  const load = useCallback(async () => {
    const id = ++requestID.current;
    setBusy(true); setError("");
    try {
      const result = await blogAPI.reading(slug);
      if (id === requestID.current) setData(result);
    } catch {
      if (id === requestID.current) setError(zh ? "暂时无法加载更多文章，请稍后重试。" : "More stories could not be loaded. Please try again.");
    } finally { if (id === requestID.current) setBusy(false); }
  }, [slug, zh]);
  useFocusEffect(useCallback(() => {
    void load();
    return () => { requestID.current++; };
  }, [load]));

  return <View className="mt-12 border-t pt-8" style={{ borderColor: colors.border }}>
    <AppText accessibilityRole="header" className="mb-5 text-xl font-semibold">{zh ? "继续阅读" : "Keep reading"}</AppText>
    {busy && <Loading />}
    {Boolean(error) && <Notice message={error} retry={() => void load()} />}
    {!busy && !error && data && <>
      <View className="gap-3 sm:flex-row"><Neighbor post={data.previous} /><Neighbor post={data.next} next /></View>
      <View className="mt-10">
        <AppText accessibilityRole="header" className="text-[25px] font-semibold">{zh ? "推荐阅读" : "Recommended reading"}</AppText>
        <AppText className="mb-2 mt-3 text-sm leading-6" style={{ color: colors.secondary }}>{category ? (zh ? `继续探索「${category}」中的其他文章。` : `More stories in “${category}”.`) : (zh ? "这篇文章尚未设置标签。" : "This story has no category yet.")}</AppText>
        {data.recommended.map(post => <PostRow key={post.id} post={post} />)}
        {data.recommended.length === 0 && <AppText className="mt-4 text-sm leading-6" style={{ color: colors.secondary }}>{zh ? "暂无同标签的其他文章，可以通过上方导航继续阅读。" : "No other stories in this category yet. Explore with the links above."}</AppText>}
      </View>
    </>}
  </View>;
}
