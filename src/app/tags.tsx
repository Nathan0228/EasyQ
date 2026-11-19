import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { View } from "react-native";
import { AppText } from "@/components/app-text";
import { BlogTimeline } from "@/components/blog-timeline";
import { Eyebrow, Loading, Notice, PortalScreen, TextLink } from "@/components/portal-ui";
import { useApp } from "@/context/app-context";
import { usePostArchive } from "@/lib/use-post-archive";

export default function TagArchive() {
  const { tag } = useLocalSearchParams<{ tag?: string }>();
  const name = typeof tag === "string" ? tag.trim() : "";
  const { colors, language } = useApp();
  const zh = language === "zh";
  const { posts, loading, failed, reload } = usePostArchive();
  const matches = useMemo(() => name && posts ? posts.filter(post => post.category.trim() === name) : [], [name, posts]);
  const total = matches.length;
  const count = zh ? `共 ${total} 篇文章` : `${total} ${total === 1 ? "story" : "stories"}`;

  return (
    <PortalScreen>
      <View className="-ml-3 mb-6 self-start">
        <TextLink href="/" iconName="arrow" label={zh ? "返回首页" : "Back to home"} />
      </View>
      <View className="mb-6 border-b pb-6" style={{ borderColor: colors.border }}>
        <Eyebrow>{zh ? "文章标签" : "STORY TAG"}</Eyebrow>
        <AppText accessibilityRole="header" className="text-[34px] font-semibold leading-[44px]">{name || (zh ? "标签" : "Tag")}</AppText>
        {posts && name && <AppText className="mt-2 text-sm" style={{ color: colors.secondary }}>{count}</AppText>}
      </View>
      {name && loading && <Loading />}
      {name && failed && <Notice message={zh ? "暂时无法更新标签文章。" : "Could not refresh stories for this tag."} retry={() => void reload()} />}
      {!name && <Notice message={zh ? "请从首页选择一个标签。" : "Choose a tag from the homepage."} />}
      {name && !loading && !failed && total === 0 && <Notice message={zh ? "这个标签下暂无文章。" : "There are no stories under this tag yet."} />}
      <BlogTimeline key={name} posts={matches} />
    </PortalScreen>
  );
}
