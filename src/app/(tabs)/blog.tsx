import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { AppText } from "@/components/app-text";
import { Eyebrow, Loading, Notice, PortalScreen, PostRow } from "@/components/portal-ui";
import { AppButton } from "@/components/ui";
import { useApp } from "@/context/app-context";
import { apiConfigured, blogAPI } from "@/lib/blog-api";
import type { BlogPost } from "@/types/blog";

export default function Blog() {
  const { colors, language } = useApp();
  const zh = language === "zh";
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [more, setMore] = useState(false);
  const load = useCallback(async (offset = 0) => {
    setBusy(true); setError("");
    try { const page = await blogAPI.list(offset); setPosts((old) => offset ? [...old, ...page.posts] : page.posts); setMore(page.hasMore); }
    catch (e) { setError(e instanceof Error ? e.message : "加载失败"); }
    finally { setBusy(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  return <PortalScreen tabs>
    <Eyebrow>THE JOURNAL</Eyebrow>
    <AppText accessibilityRole="header" className="text-[40px] font-semibold leading-[52px]">{zh ? "字里行间。" : "Notes along the way."}</AppText>
    <AppText className="mb-10 mt-5 text-base leading-7" style={{ color: colors.secondary }}>{zh ? "一些实践，一些观察，还有生活留下的小注脚。" : "Experiments, observations, and small footnotes from life."}</AppText>
    {error && <Notice message={!apiConfigured ? (zh ? "博客正在准备中，文章将在这里与你见面。" : "The journal is getting ready. Stories will appear here soon.") : error} retry={apiConfigured ? () => void load() : undefined} />}
    {!busy && !error && !posts.length && <Notice message={zh ? "第一篇文章还在酝酿，欢迎稍后再来。" : "The first story is on its way. Come back soon."} />}
    {posts.map((post) => <PostRow key={post.id} post={post} />)}
    {busy && <Loading />}
    {more && !busy && <AppButton label={zh ? "阅读更多" : "More stories"} variant="secondary" onPress={() => void load(posts.length)} />}
  </PortalScreen>;
}

