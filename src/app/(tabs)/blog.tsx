import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { AppText } from "@/components/app-text";
import { BlogTimeline } from "@/components/blog-timeline";
import { Eyebrow, Loading, Notice, PortalScreen } from "@/components/portal-ui";
import { AppButton } from "@/components/ui";
import { useApp } from "@/context/app-context";
import { apiConfigured, blogAPI, cachedPostPage } from "@/lib/blog-api";
import type { BlogPost, PostPage } from "@/types/blog";

export default function Blog() {
  const { colors, language } = useApp();
  const zh = language === "zh";
  const [posts, setPosts] = useState<BlogPost[]>(() => cachedPostPage()?.posts ?? []);
  const [busy, setBusy] = useState(() => !cachedPostPage());
  const [error, setError] = useState("");
  const [more, setMore] = useState(() => cachedPostPage()?.hasMore ?? false);
  const [retryOffset, setRetryOffset] = useState(0);
  const requestID = useRef(0);
  const firstPage = useRef<PostPage | undefined>(cachedPostPage());
  const load = useCallback(async (offset = 0) => {
    const id = ++requestID.current;
    const cached = cachedPostPage(offset);
    setBusy(offset > 0 || !cached); setError(""); setRetryOffset(offset);
    if (offset && cached) {
      setPosts(old => [...old.slice(0, offset), ...cached.posts]);
      setMore(cached.hasMore);
    }
    try {
      const page = await blogAPI.list(offset);
      if (id !== requestID.current) return;
      // A warm return must not discard pages the reader already loaded.
      if (!offset && firstPage.current === page) return;
      if (!offset) firstPage.current = page;
      setPosts((old) => offset ? [...old.slice(0, offset), ...page.posts] : page.posts); setMore(page.hasMore);
    }
    catch (e) { if (id === requestID.current) setError(e instanceof Error ? e.message : "加载失败"); }
    finally { if (id === requestID.current) setBusy(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); return () => { requestID.current++; }; }, [load]));
  return <PortalScreen tabs>
    <Eyebrow>THE JOURNAL</Eyebrow>
    <AppText accessibilityRole="header" className="text-[40px] font-semibold leading-[52px]">{zh ? "字里行间。" : "Notes along the way."}</AppText>
    <AppText className="mb-10 mt-5 text-base leading-7" style={{ color: colors.secondary }}>{zh ? "一些实践，一些观察，还有生活留下的小注脚。" : "Experiments, observations, and small footnotes from life."}</AppText>
    {Boolean(error) && <Notice message={!apiConfigured ? (zh ? "博客正在准备中，文章将在这里与你见面。" : "The journal is getting ready. Stories will appear here soon.") : posts.length ? (zh ? "更新失败，正在显示已有文章，请稍后重试。" : "Could not refresh. Showing saved stories; please try again later.") : error} retry={apiConfigured ? () => void load(retryOffset) : undefined} />}
    {!busy && !error && !posts.length && <Notice message={zh ? "第一篇文章还在酝酿，欢迎稍后再来。" : "The first story is on its way. Come back soon."} />}
    <BlogTimeline posts={posts} />
    {busy && <Loading />}
    {more && !busy && <AppButton iconName="book" label={zh ? "阅读更多" : "More stories"} variant="secondary" onPress={() => void load(posts.length)} />}
  </PortalScreen>;
}

