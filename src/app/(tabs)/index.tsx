import { AppText } from "@/components/app-text";
import {
  Eyebrow,
  Loading,
  Notice,
  PortalScreen,
  PostRow,
  TextLink,
} from "@/components/portal-ui";
import { useApp } from "@/context/app-context";
import { apiConfigured, blogAPI, cachedPostPage } from "@/lib/blog-api";
import type { BlogPost } from "@/types/blog";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Image, View } from "react-native";

export default function Home() {
  const { colors, language, theme } = useApp();
  const zh = language === "zh";
  const [posts, setPosts] = useState<BlogPost[]>(
    () => cachedPostPage()?.posts.slice(0, 3) ?? [],
  );
  const [busy, setBusy] = useState(() => !cachedPostPage());
  const [error, setError] = useState("");
  const requestID = useRef(0);
  const load = useCallback(async () => {
    const id = ++requestID.current;
    setBusy(!cachedPostPage());
    setError("");
    // Share the first directory page; the homepage still displays only three.
    try {
      const page = await blogAPI.list();
      if (id === requestID.current) setPosts(page.posts.slice(0, 3));
    } catch (e) {
      if (id === requestID.current)
        setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      if (id === requestID.current) setBusy(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        requestID.current++;
      };
    }, [load]),
  );
  return (
    <PortalScreen tabs>
      <View className="pb-10 pt-6 sm:pt-12">
        <Eyebrow>NATHAN の EASYQ</Eyebrow>
        <View className="flex-row items-center gap-5 py-2 sm:gap-9">
          <Image
            source={require("../../../public/melogo.png")}
            resizeMode="contain"
            style={{
              width: 256,
              height: 256,
              flexShrink: 0,
              tintColor: theme === "dark" ? colors.text : undefined,
            }}
          />
          <View
            className="min-w-0 max-w-[420px] shrink rounded-lg border px-4 py-3 sm:px-6 sm:py-4"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              transform: [{ rotate: "-10deg" }],
            }}
          >
            <AppText
              accessibilityRole="header"
              className="text-xl font-semibold leading-7 sm:text-[30px] sm:leading-10"
            >
              {zh
                ? "“点子王”的想法和实现"
                : "Ideas and projects by the “Idea Maker”"}
            </AppText>
          </View>
        </View>
        <View className="mt-6 flex-row flex-wrap gap-6">
          <TextLink
            href="/blog"
            label={zh ? "读一些文字 →" : "Read the journal →"}
          />
          <TextLink
            href="/tools"
            label={zh ? "看看工具箱 →" : "Explore the tools →"}
          />
        </View>
      </View>
      <View
        className="mb-12 gap-6 border-y py-7 sm:flex-row"
        style={{ borderColor: colors.border }}
      >
        {[
          [
            zh ? "认真记录" : "Thoughtful writing",
            zh
              ? "技术、观察与生活，留下值得回看的文字。"
              : "Technology, observations, and stories to revisit.",
          ],
          [
            zh ? "简单实用" : "Useful by design",
            zh
              ? "从安静提问开始，逐步收集顺手的小工具。"
              : "Starting with quiet questions, a collection that grows.",
          ],
          [
            zh ? "自在阅读" : "Room to read",
            zh
              ? "无需登录即可阅读，手机与桌面都舒适。"
              : "Read without an account, on your phone or desktop.",
          ],
        ].map(([title, description]) => (
          <View key={title} className="flex-1">
            <AppText className="mb-2 text-base font-semibold">{title}</AppText>
            <AppText
              className="text-sm leading-6"
              style={{ color: colors.secondary }}
            >
              {description}
            </AppText>
          </View>
        ))}
      </View>
      <Eyebrow>RECENT STORIES</Eyebrow>
      <View className="flex-row items-center justify-between gap-4">
        <AppText
          accessibilityRole="header"
          className="text-[28px] font-semibold"
        >
          {zh ? "最近写下的" : "Latest stories"}
        </AppText>
        <TextLink href="/blog" label={zh ? "全部文章 →" : "All stories →"} />
      </View>
      {busy && <Loading />}
      {Boolean(error) && (
        <Notice
          message={
            apiConfigured
              ? posts.length
                ? zh
                  ? "更新失败，正在显示已缓存的文章。"
                  : "Could not refresh. Showing saved stories."
                : error
              : zh
                ? "博客正在准备中，欢迎稍后再来。"
                : "The journal is getting ready."
          }
          retry={apiConfigured ? () => void load() : undefined}
        />
      )}
      {!busy && !error && posts.length === 0 && (
        <Notice
          message={
            zh ? "第一篇文章还在酝酿中。" : "The first story is on its way."
          }
        />
      )}
      {posts.map((post) => (
        <PostRow key={post.id} post={post} />
      ))}
    </PortalScreen>
  );
}
