import type { BlogPost } from "@/types/blog";

// A single site timezone keeps year/month boundaries identical for all readers.
export const BLOG_TIME_ZONE = "Asia/Hong_Kong";
const calendar = new Intl.DateTimeFormat("en-CA", {
  timeZone: BLOG_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
});
export type TimelineEntry = { post: BlogPost; day: number; timestamp: number };
export type TimelineMonth = { key: string; month: number; entries: TimelineEntry[] };
export type TimelineYear = { key: string; year: number; count: number; months: TimelineMonth[] };

export function groupBlogTimeline(posts: BlogPost[]): TimelineYear[] {
  const unique = new Map(posts.map(post => [post.id, post]));
  const entries = [...unique.values()].map(post => {
    const published = Date.parse(post.publishedAt || "");
    const created = Date.parse(post.createdAt);
    const timestamp = Number.isFinite(published) ? published : Number.isFinite(created) ? created : null;
    const parts = timestamp === null ? [] : calendar.formatToParts(new Date(timestamp));
    const part = (type: string) => Number(parts.find(item => item.type === type)?.value || 0);
    return { post, timestamp: timestamp ?? -Infinity, year: part("year"), month: part("month"), day: part("day") };
  }).sort((a, b) => b.timestamp - a.timestamp || (a.post.id < b.post.id ? 1 : a.post.id > b.post.id ? -1 : 0));
  const years: TimelineYear[] = [];
  for (const entry of entries) {
    const yearKey = String(entry.year);
    let year = years.find(item => item.key === yearKey);
    if (!year) { year = { key: yearKey, year: entry.year, count: 0, months: [] }; years.push(year); }
    const monthKey = `${yearKey}-${entry.month}`;
    let month = year.months.find(item => item.key === monthKey);
    if (!month) { month = { key: monthKey, month: entry.month, entries: [] }; year.months.push(month); }
    month.entries.push(entry);
    year.count++;
  }
  return years;
}
