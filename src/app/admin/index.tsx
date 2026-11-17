import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { AdminLogin } from "@/components/admin-login";
import { AppText } from "@/components/app-text";
import { Eyebrow, Loading, Notice, PortalScreen, PostRow, TextLink } from "@/components/portal-ui";
import { AppButton } from "@/components/ui";
import { useBlogSession } from "@/context/blog-session";
import { ApiError, blogAPI } from "@/lib/blog-api";
import { useAdminRefresh } from "@/lib/use-admin-refresh";
import type { BlogPost } from "@/types/blog";

const pageSize = 12;

export default function Studio() {
  const { token, setToken } = useBlogSession();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [more, setMore] = useState(false);
  const shown = useRef(pageSize);
  const request = useRef<symbol | null>(null);
  const initial = useRef(true);
  useEffect(() => () => {
    request.current = null;
    shown.current = pageSize;
    initial.current = true;
  }, [token]);
  const load = useCallback(async (showMore = false) => {
    if (!token || (!showMore && request.current)) return;
    const ticket = Symbol();
    request.current = ticket;
    const visibleCount = shown.current + (showMore ? pageSize : 0);
    const foreground = initial.current || showMore;
    if (foreground) { setBusy(true); setError(""); }
    try {
      const items = new Map<string, BlogPost>();
      let hasMore = false;
      for (let offset = 0; offset < visibleCount;) {
        const page = await blogAPI.drafts(token, offset, Math.min(50, visibleCount - offset));
        if (request.current !== ticket) return;
        for (const post of page.posts) items.set(post.id, post);
        hasMore = page.hasMore;
        if (!hasMore || !page.posts.length) break;
        offset += page.posts.length;
      }
      shown.current = visibleCount;
      initial.current = false;
      setPosts([...items.values()]);
      setMore(hasMore);
      setError("");
    } catch (e) {
      if (request.current !== ticket) return;
      if (e instanceof ApiError && e.status === 401) setToken(null);
      if (foreground) setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      if (request.current === ticket) {
        request.current = null;
        if (foreground) setBusy(false);
      }
    }
  }, [token, setToken]);
  const refresh = useCallback(() => { void load(); }, [load]);
  useAdminRefresh(Boolean(token), refresh);
  async function logout() {
    if (!token) return;
    try { await blogAPI.logout(token); setToken(null); setPosts([]); }
    catch (e) { if (e instanceof ApiError && e.status === 401) { setToken(null); setPosts([]); } else setError(e instanceof Error ? e.message : "退出失败，请重试"); }
  }
  if (!token) return <AdminLogin />;
  return <PortalScreen>
    <Eyebrow>WRITING STUDIO</Eyebrow>
    <TextLink href="/admin/tools" label="管理工具入口 →" />
    <AppText accessibilityRole="header" className="mb-4 text-[34px] font-semibold">把想法写下来。</AppText>
    <AppText className="mb-8 text-sm leading-6">草稿会自动保存并同步到已登录的设备。发布后的文章会出现在公开博客中。</AppText>
    <View className="mb-5 gap-3 sm:flex-row"><View className="flex-1"><AppButton iconName="edit" label="写一篇新文章" onPress={() => router.push("/admin/editor")} /></View><AppButton iconName="logout" label="退出登录" variant="secondary" onPress={() => void logout()} /></View>
    {Boolean(error) && <Notice message={error} retry={() => void load()} />}
    {posts.map(post => <PostRow key={post.id} post={post} admin />)}
    {busy && <Loading />}
    {!busy && !error && !posts.length && <Notice message="写作台还是空的。从第一篇文章开始吧。" />}
    {more && !busy && <AppButton iconName="plus" label="加载更多" variant="secondary" onPress={() => void load(true)} />}
  </PortalScreen>;
}

