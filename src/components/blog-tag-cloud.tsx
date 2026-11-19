import { Link } from "expo-router";
import { useMemo } from "react";
import { Pressable, View, useWindowDimensions } from "react-native";
import { AppText } from "@/components/app-text";
import { Loading, Notice } from "@/components/portal-ui";
import { useApp } from "@/context/app-context";
import { usePostArchive } from "@/lib/use-post-archive";
import type { BlogPost } from "@/types/blog";

type Tag = { name: string; count: number; hue: number };

function tagsFromPosts(posts: BlogPost[] = []): Tag[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    const name = post.category.trim();
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b))
    .map(([name, count], index) => ({ name, count, hue: (154 + index * 137.508) % 360 }))
    .sort((a, b) => b.count - a.count);
}

function TagLink({ tag, largest }: { tag: Tag; largest: number }) {
  const { theme, language } = useApp();
  const dark = theme === "dark";
  const weight = Math.sqrt((tag.count - 1) / Math.max(1, largest - 1));
  const color = `hsl(${tag.hue}, 52%, ${dark ? 78 : 29}%)`;
  const label = language === "zh" ? `${tag.name}，${tag.count} 篇` : `${tag.name}, ${tag.count} ${tag.count === 1 ? "story" : "stories"}`;
  return (
    <Link href={{ pathname: "/tags", params: { tag: tag.name } }} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={label}
        className="blog-tag ui-pressable min-h-11 min-w-11 max-w-full flex-row items-center justify-center gap-1 rounded-lg px-2"
      >
        <AppText numberOfLines={1} className="shrink font-semibold" style={{ color, fontSize: 12 + 7 * weight }}>
          {tag.name}
        </AppText>
        <AppText className="text-[10px]" style={{ color }}>{tag.count}</AppText>
      </Pressable>
    </Link>
  );
}

export function BlogTagCloud() {
  const { language } = useApp();
  const { width, fontScale } = useWindowDimensions();
  const zh = language === "zh";
  const { posts, loading, failed, reload } = usePostArchive();
  const tags = useMemo(() => tagsFromPosts(posts), [posts]);
  const [largest, ...others] = tags;
  const sideBySide = others.length >= 2 && width / fontScale >= 540;
  const [left, right] = others;
  const outer = sideBySide ? others.slice(2) : others;
  const above = outer.filter((_, index) => index % 2 === 1);
  const below = outer.filter((_, index) => index % 2 === 0);

  if (!largest && !loading && !failed) return null;

  return (
    <View className="mb-8">
      {largest && (
        <View>
          {above.length > 0 && <View className="flex-row flex-wrap justify-center gap-2">
            {above.map(tag => <TagLink key={tag.name} tag={tag} largest={largest.count} />)}
          </View>}
          <View className="flex-row items-center justify-center gap-2">
            {sideBySide && <View className="min-w-0 flex-1 items-end"><TagLink tag={left} largest={largest.count} /></View>}
            <View style={{ maxWidth: sideBySide ? "48%" : "100%" }}><TagLink tag={largest} largest={largest.count} /></View>
            {sideBySide && <View className="min-w-0 flex-1 items-start"><TagLink tag={right} largest={largest.count} /></View>}
          </View>
          {below.length > 0 && <View className="flex-row flex-wrap justify-center gap-2">
            {below.map(tag => <TagLink key={tag.name} tag={tag} largest={largest.count} />)}
          </View>}
        </View>
      )}
      {loading && <Loading />}
      {failed && <Notice message={zh ? "暂时无法更新文章标签。" : "Could not refresh tags."} retry={() => void reload()} />}
    </View>
  );
}
