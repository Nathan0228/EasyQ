import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { AppText } from "@/components/app-text";
import { useApp } from "@/context/app-context";
import { groupBlogTimeline, type TimelineEntry } from "@/lib/blog-timeline";
import { prefetchArticle } from "@/lib/blog-api";
import type { BlogPost } from "@/types/blog";

const monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function toggle(setter: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) {
  setter(current => {
    const next = new Set(current);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
}
function TimelineArticle({ entry, month }: { entry: TimelineEntry; month: number }) {
  const { colors, language } = useApp();
  const { post, day } = entry;
  const date = month ? (language === "zh" ? `${month}月${day}日` : `${monthNames[month]} ${day}`) : (language === "zh" ? "日期未注明" : "Undated");
  return <View className="relative pl-10">
    <View pointerEvents="none" style={{ position: "absolute", left: 6, top: 28, width: 9, height: 9, borderRadius: 5, borderWidth: 2, borderColor: colors.accent, backgroundColor: colors.background }} />
    <Link href={{ pathname: "/blog/[slug]", params: { slug: post.slug } }} asChild>
      <Pressable onHoverIn={() => prefetchArticle(post.slug)} onPressIn={() => prefetchArticle(post.slug)} accessibilityRole="link" className="editorial-row ui-pressable border-b pb-6 pt-5" style={{ borderColor: colors.border }}>
        <View className="mb-3 flex-row flex-wrap items-center gap-3">
          <AppText className="text-xs" style={{ color: colors.secondary }}>{date}</AppText>
          {Boolean(post.category) && <AppText className="text-xs" style={{ color: colors.accent }}>{post.category}</AppText>}
        </View>
        <View className="flex-row items-start gap-4"><AppText accessibilityRole="header" className="flex-1 text-[21px] font-semibold leading-8">{post.title}</AppText><AppText className="pt-1" style={{ color: colors.secondary }}>↗</AppText></View>
        {Boolean(post.excerpt) && <AppText numberOfLines={2} className="mt-3 text-sm leading-6" style={{ color: colors.secondary }}>{post.excerpt}</AppText>}
      </Pressable>
    </Link>
  </View>;
}

export function BlogTimeline({ posts }: { posts: BlogPost[] }) {
  const { colors, language } = useApp();
  const zh = language === "zh";
  const years = useMemo(() => groupBlogTimeline(posts), [posts]);
  const [collapsedYears, setCollapsedYears] = useState<Set<string>>(() => new Set());
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(() => new Set());
  if (years.length === 0) return null;
  const count = years.reduce((sum, year) => sum + year.count, 0);

  return <View className="mb-6">
    <View className="mb-5 flex-row flex-wrap items-center justify-between gap-x-4">
      <AppText className="text-xs leading-6" style={{ color: colors.secondary }}>{zh ? `按发布时间 · 已加载 ${count} 篇` : `By publication date · ${count} loaded`}</AppText>
      <View className="flex-row gap-5">
        <Pressable accessibilityRole="button" className="ui-pressable min-h-11 justify-center" onPress={() => { setCollapsedYears(new Set()); setCollapsedMonths(new Set()); }}><AppText className="text-xs font-medium" style={{ color: colors.accent }}>{zh ? "全部展开" : "Expand all"}</AppText></Pressable>
        <Pressable accessibilityRole="button" className="ui-pressable min-h-11 justify-center" onPress={() => { setCollapsedYears(new Set(years.map(year => year.key))); setCollapsedMonths(new Set(years.flatMap(year => year.months.map(month => month.key)))); }}><AppText className="text-xs font-medium" style={{ color: colors.accent }}>{zh ? "全部折叠" : "Collapse all"}</AppText></Pressable>
      </View>
    </View>
    <View className="relative">
      <View pointerEvents="none" style={{ position: "absolute", left: 10, top: 28, bottom: 0, width: 1, backgroundColor: colors.border }} />
      {years.map(year => {
        const expanded = !collapsedYears.has(year.key);
        const label = year.year ? (zh ? `${year.year} 年` : String(year.year)) : (zh ? "日期未注明" : "Undated");
        return <View key={year.key} className="mb-5">
          <Pressable accessibilityRole="button" accessibilityLabel={`${expanded ? (zh ? "折叠" : "Collapse") : (zh ? "展开" : "Expand")} ${label}`} accessibilityState={{ expanded }} onPress={() => toggle(setCollapsedYears, year.key)} className="ui-pressable min-h-14 flex-row items-center gap-3 pl-10">
            <View pointerEvents="none" style={{ position: "absolute", left: 3, top: 21, width: 15, height: 15, borderRadius: 8, backgroundColor: colors.accent, borderWidth: 3, borderColor: colors.background }} />
            <AppText accessibilityRole="header" className="text-[27px] font-semibold">{label}</AppText>
            <AppText className="flex-1 text-xs" style={{ color: colors.secondary }}>{zh ? `${year.count} 篇` : `${year.count} stories`}</AppText>
            <AppText className="px-2 text-xl" style={{ color: colors.secondary }}>{expanded ? "−" : "+"}</AppText>
          </Pressable>
          {expanded && year.months.map(month => {
            const open = !collapsedMonths.has(month.key);
            const monthLabel = month.month ? (zh ? `${month.month} 月` : monthNames[month.month]) : (zh ? "未分月" : "No month");
            return <View key={month.key} className="mb-5">
              <Pressable accessibilityRole="button" accessibilityLabel={`${open ? (zh ? "折叠" : "Collapse") : (zh ? "展开" : "Expand")} ${label} ${monthLabel}`} accessibilityState={{ expanded: open }} onPress={() => toggle(setCollapsedMonths, month.key)} className="ui-pressable min-h-12 flex-row items-center gap-3 pl-10">
                <View pointerEvents="none" style={{ position: "absolute", left: 7, top: 20, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.secondary }} />
                <AppText accessibilityRole="header" className="text-base font-semibold">{monthLabel}</AppText>
                <AppText className="flex-1 text-xs" style={{ color: colors.secondary }}>{zh ? `${month.entries.length} 篇` : `${month.entries.length} stories`}</AppText>
                <AppText className="px-2 text-lg" style={{ color: colors.secondary }}>{open ? "−" : "+"}</AppText>
              </Pressable>
              {open && month.entries.map(entry => <TimelineArticle key={entry.post.id} entry={entry} month={month.month} />)}
            </View>;
          })}
        </View>;
      })}
    </View>
  </View>;
}
