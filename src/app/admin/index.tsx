import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { AdminLogin } from "@/components/admin-login";
import { AppText } from "@/components/app-text";
import { Eyebrow, Loading, Notice, PortalScreen, PostRow } from "@/components/portal-ui";
import { AppButton } from "@/components/ui";
import { useBlogSession } from "@/context/blog-session";
import { ApiError, blogAPI } from "@/lib/blog-api";
import type { BlogPost } from "@/types/blog";

export default function Studio() {
  const { token, setToken } = useBlogSession();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [more, setMore] = useState(false);
  const load = useCallback(async (offset = 0) => {
    if (!token) return;
    setBusy(true); setError("");
    try { const page = await blogAPI.drafts(token, offset); setPosts(old => offset ? [...old, ...page.posts] : page.posts); setMore(page.hasMore); }
    catch (e) { if (e instanceof ApiError && e.status === 401) setToken(null); setError(e instanceof Error ? e.message : "加载失败"); }
    finally { setBusy(false); }
  }, [token, setToken]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  async function logout() {
    if (!token) return;
    try { await blogAPI.logout(token); setToken(null); setPosts([]); }
    catch (e) { setError(e instanceof Error ? e.message : "退出失败，请重试"); }
  }
  if (!token) return <AdminLogin />;
  return <PortalScreen>
    <Eyebrow>WRITING STUDIO</Eyebrow>
    <AppText accessibilityRole="header" className="mb-4 text-[34px] font-semibold">把想法写下来。</AppText>
    <AppText className="mb-8 text-sm leading-6">草稿仅你可见。发布后的文章会出现在公开博客中。</AppText>
    <View className="mb-5 gap-3 sm:flex-row"><View className="flex-1"><AppButton label="写一篇新文章" onPress={() => router.push("/admin/editor")} /></View><AppButton label="退出登录" variant="secondary" onPress={() => void logout()} /></View>
    {Boolean(error) && <Notice message={error} retry={() => void load()} />}
    {posts.map(post => <PostRow key={post.id} post={post} admin />)}
    {busy && <Loading />}
    {!busy && !error && !posts.length && <Notice message="写作台还是空的。从第一篇文章开始吧。" />}
    {more && !busy && <AppButton label="加载更多" variant="secondary" onPress={() => void load(posts.length)} />}
  </PortalScreen>;
}

