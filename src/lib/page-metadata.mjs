export const siteOrigin = "https://easyq.findingai.top";

const publicPages = new Map([
  ["/", ["个人博客与实用工具 | EasyQ", "在 EasyQ 阅读生活与技术博客，使用 Traval 旅行足迹地图和安静提问等工具。"]],
  ["/blog", ["博客文章归档 | EasyQ", "按年份和月份浏览 EasyQ 的公开博客文章，阅读关于技术、学习和日常生活的记录。"]],
  ["/tools", ["旅行地图与实用工具 | EasyQ", "浏览 EasyQ 的工具目录，打开 Traval 旅行足迹地图、安静提问和精选站外工具。"]],
  ["/traval", ["旅行足迹地图：点亮去过的国家和中国省市 | EasyQ", "用 Traval 点亮去过的国家，记录在中国各地旅行、居住、工作和上学的经历。记录保存在当前设备，可导入或导出备份。"]],
  ["/ask", ["安静提问：把手机递给对方回答 | EasyQ", "在需要保持安静的场合，用手机写下问题并递给对方回答。问答记录保存在当前设备。"]],
  ["/tags", ["博客标签 | EasyQ", "按标签查找 EasyQ 的公开博客文章，浏览相同主题下的记录。"]],
]);

/** @param {string} pathname */
export function getPageMetadata(pathname) {
  const path = pathname.replace(/\/+$/, "") || "/";
  const page = publicPages.get(path);
  if (!page) return null;
  const [title, description] = page;
  return { title, description, canonical: siteOrigin + path };
}

/** @param {string} pathname */
export function getArticleSlug(pathname) {
  return /^\/blog\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/.exec(pathname)?.[1] ?? null;
}

/**
 * @param {{ status: string, slug: string, title: string, excerpt: string, category: string }} post
 * @param {string} slug
 */
export function getArticleMetadata(post, slug) {
  if (post?.status !== "published" || post.slug !== slug || typeof post.title !== "string") return null;
  const title = post.title.trim();
  if (!title) return null;
  const excerpt = typeof post.excerpt === "string" ? post.excerpt.replace(/\s+/g, " ").trim() : "";
  const category = typeof post.category === "string" ? post.category.trim() : "";
  return {
    title: `${title} | EasyQ`,
    description: excerpt || `阅读 EasyQ${category ? `「${category}」` : "博客"}中的《${title}》。`,
    canonical: `${siteOrigin}/blog/${slug}`,
  };
}

export const blogFallbackMetadata = {
  title: "阅读博客文章 | EasyQ",
  description: "阅读 EasyQ 的公开博客文章。",
  canonical: "",
};
