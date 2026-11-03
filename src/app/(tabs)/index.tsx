import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { AppText } from "@/components/app-text";
import { Eyebrow, Loading, Notice, PortalScreen, PostRow, TextLink } from "@/components/portal-ui";
import { useApp } from "@/context/app-context";
import { apiConfigured, blogAPI } from "@/lib/blog-api";
import type { BlogPost } from "@/types/blog";

export default function Home() {
  const { colors, language } = useApp();
  const zh = language === "zh";
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setBusy(true); setError("");
    try { const page = await blogAPI.list(0, 3); setPosts(page.posts.slice(0, 3)); }
    catch (e) { setError(e instanceof Error ? e.message : "加载失败"); }
    finally { setBusy(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  return <PortalScreen tabs>
    <View className="pb-10 pt-6 sm:pt-12">
      <Eyebrow>WELCOME TO EASYQ</Eyebrow>
      <AppText accessibilityRole="header" className="text-[40px] font-semibold leading-[53px] tracking-tight sm:text-[52px] sm:leading-[66px]">{zh ? "留一点空间，\n给想法和日常。" : "A little space for\nideas and everyday life."}</AppText>
      <AppText className="mt-6 max-w-[540px] text-base leading-7" style={{ color: colors.secondary }}>{zh ? "EasyQ 是一个慢慢生长的个人网站。在这里记录实践与生活，也把日常用得上的小工具收在一起。" : "EasyQ is a growing personal website. A place for stories from everyday life and small tools that make it easier."}</AppText>
      <View className="mt-6 flex-row flex-wrap gap-6"><TextLink href="/blog" label={zh ? "读一些文字 →" : "Read the journal →"} /><TextLink href="/tools" label={zh ? "看看工具箱 →" : "Explore the tools →"} /></View>
    </View>
    <View className="mb-12 gap-6 border-y py-7 sm:flex-row" style={{ borderColor: colors.border }}>
      {[
        [zh ? "认真记录" : "Thoughtful writing", zh ? "技术、观察与生活，留下值得回看的文字。" : "Technology, observations, and stories to revisit."],
        [zh ? "简单实用" : "Useful by design", zh ? "从安静提问开始，逐步收集顺手的小工具。" : "Starting with quiet questions, a collection that grows."],
        [zh ? "自在阅读" : "Room to read", zh ? "无需登录即可阅读，手机与桌面都舒适。" : "Read without an account, on your phone or desktop."],
      ].map(([title, description]) => <View key={title} className="flex-1"><AppText className="mb-2 text-base font-semibold">{title}</AppText><AppText className="text-sm leading-6" style={{ color: colors.secondary }}>{description}</AppText></View>)}
    </View>
    <Eyebrow>RECENT STORIES</Eyebrow>
    <View className="flex-row items-center justify-between gap-4"><AppText accessibilityRole="header" className="text-[28px] font-semibold">{zh ? "最近写下的" : "Latest stories"}</AppText><TextLink href="/blog" label={zh ? "全部文章 →" : "All stories →"} /></View>
    {busy && <Loading />}
    {Boolean(error) && <Notice message={apiConfigured ? error : (zh ? "博客正在准备中，欢迎稍后再来。" : "The journal is getting ready.")} retry={apiConfigured ? () => void load() : undefined} />}
    {!busy && !error && posts.length === 0 && <Notice message={zh ? "第一篇文章还在酝酿中。" : "The first story is on its way."} />}
    {posts.map(post => <PostRow key={post.id} post={post} />)}
  </PortalScreen>;
}
