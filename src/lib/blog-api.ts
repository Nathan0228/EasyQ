import type { ArticleReading, BlogPost, PostInput, PostPage } from "@/types/blog";
import type { ExternalTool, ToolInput } from "@/types/tool";
import { createReadCache, type CacheStorage } from "@/lib/read-cache";
import { Platform } from "react-native";

// Deployed web builds use the Cloudflare proxy, including when an older API URL
// is still set in the dashboard. Local development and native apps stay direct.
const sameOrigin = Platform.OS === "web" && !__DEV__ && process.env.EXPO_PUBLIC_API_MODE !== "direct";
const baseURL = sameOrigin ? "" : process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
export const apiConfigured = sameOrigin || Boolean(baseURL);
export const siteAuthor = process.env.EXPO_PUBLIC_SITE_AUTHOR || "EasyQ";

function publicStorage(name: string): CacheStorage | undefined {
  if (Platform.OS !== "web" || typeof window === "undefined") return;
  const key = `easyq.public.${name}.v1:${sameOrigin ? "same-origin" : baseURL}`;
  return {
    read: () => window.localStorage.getItem(key),
    write: value => window.localStorage.setItem(key, value),
    remove: () => window.localStorage.removeItem(key),
  };
}
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null; }
function isPublicPost(value: unknown): value is BlogPost {
  return isRecord(value) && ["id", "slug", "title", "excerpt", "category", "createdAt", "updatedAt"].every(key => typeof value[key] === "string")
    && value.status === "published" && typeof value.version === "number"
    && (value.publishedAt === null || typeof value.publishedAt === "string")
    && (value.content === undefined || value.content === "");
}
function isPostPage(value: unknown): value is PostPage {
  return isRecord(value) && Array.isArray(value.posts) && value.posts.every(isPublicPost) && typeof value.hasMore === "boolean";
}
function isToolList(value: unknown): value is { tools: ExternalTool[] } {
  return isRecord(value) && Array.isArray(value.tools) && value.tools.every(tool => isRecord(tool)
    && ["id", "name", "description", "url", "iconUrl", "createdAt", "updatedAt"].every(key => typeof tool[key] === "string")
    && /^https?:\/\//.test(tool.url as string) && typeof tool.version === "number");
}
const articles = createReadCache<BlogPost>();
const reading = createReadCache<ArticleReading>();
// Only public metadata is persisted. Article bodies, drafts, and tokens stay out.
const postPages = createReadCache<PostPage>(60000, 20, { maxAge: 86400000, storage: publicStorage("posts"), validate: isPostPage });
const toolLists = createReadCache<{ tools: ExternalTool[] }>(60000, 1, { maxAge: 86400000, storage: publicStorage("tools"), validate: isToolList });
export const cachedTools = () => toolLists.peek("all");
const pageKey = (offset: number, limit: number) => `${offset}:${limit}`;
export const cachedPostPage = (offset = 0, limit = 12) => postPages.peek(pageKey(offset, limit));
export const cachedArticle = (slug: string) => articles.peek(slug);
export const cachedReading = (slug: string) => reading.peek(slug);
export function prefetchArticle(slug: string) {
  void blogAPI.article(slug).catch(() => { /* Opening the page offers retry on failure. */ });
}
export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  if (!apiConfigured) throw new ApiError("博客服务尚未连接，请配置 EXPO_PUBLIC_API_URL 后重新构建网站。", 503);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const headers = new Headers(options.headers);
    headers.set("Accept", "application/json");
    if (options.body != null && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const response = await fetch(`${baseURL}${path}`, {
      ...options, signal: controller.signal, credentials: "omit",
      headers,
    });
    if (response.status === 204) return undefined as T;
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new ApiError(data?.error || "服务暂不可用，请稍后重试。", response.status);
    if (!data) throw new ApiError("API 返回了无效响应，请检查服务地址。", 502);
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (controller.signal.aborted) throw new ApiError("连接博客服务超时，请检查网络后重试。", 0);
    throw new ApiError("无法连接博客服务，请检查网络后重试。", 0);
  } finally { clearTimeout(timer); }
}

export const blogAPI = {
  list: (offset = 0, limit = 12) => postPages.get(pageKey(offset, limit), async () => {
    const page = await request<PostPage>(`/api/posts?offset=${offset}&limit=${limit}`);
    if (!isPostPage(page)) throw new ApiError("文章列表返回格式不正确。", 502);
    const previous = cachedPostPage(0, limit);
    if (!offset && (!previous || JSON.stringify(previous) !== JSON.stringify(page))) {
      // Insertions/deletions shift offsets; old later pages cannot be reused.
      postPages.invalidate(key => key !== pageKey(0, limit));
    }
    return page;
  }),
  article: (slug: string) => articles.get(slug, () => request<BlogPost>(`/api/posts/${encodeURIComponent(slug)}`)),
  reading: (slug: string) => reading.get(slug, () => request<ArticleReading>(`/api/posts/${encodeURIComponent(slug)}/reading`)),
  login: (username: string, password: string) => request<{ token: string; expiresAt: string }>("/api/admin/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  logout: (token: string) => request<void>("/api/admin/logout", { method: "POST" }, token),
  drafts: (token: string, offset = 0) => request<PostPage>(`/api/admin/posts?offset=${offset}`, {}, token),
  draft: (token: string, id: string) => request<BlogPost>(`/api/admin/posts/${encodeURIComponent(id)}`, {}, token),
  save: async (token: string, data: PostInput, id?: string) => {
    const post = await request<BlogPost>(id ? `/api/admin/posts/${encodeURIComponent(id)}` : "/api/admin/posts", { method: id ? "PUT" : "POST", body: JSON.stringify(data) }, token);
    articles.clear(); reading.clear(); postPages.clear();
    return post;
  },
  tools: (refresh = false) => {
    if (refresh) toolLists.clear();
    return toolLists.get("all", async () => {
      const data = await request<{ tools: ExternalTool[] }>("/api/tools", refresh ? { headers: { "Cache-Control": "no-cache" } } : {});
      if (!Array.isArray(data.tools)) throw new ApiError("工具接口返回格式不正确，请检查 API 域名是否指向 EasyQ 后端。", 502);
      return data;
    });
  },
  saveTool: async (token: string, data: ToolInput, id?: string) => {
    const tool = await request<ExternalTool>(id ? `/api/admin/tools/${encodeURIComponent(id)}` : "/api/admin/tools", { method: id ? "PUT" : "POST", body: JSON.stringify(data) }, token);
    toolLists.clear();
    return tool;
  },
  deleteTool: async (token: string, tool: ExternalTool) => {
    await request<void>(`/api/admin/tools/${encodeURIComponent(tool.id)}?version=${tool.version}`, { method: "DELETE" }, token);
    toolLists.clear();
  },
};
