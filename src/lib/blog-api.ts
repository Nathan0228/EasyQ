import type { ArticleReading, BlogPost, PostInput, PostPage } from "@/types/blog";
import type { ExternalTool, ToolInput } from "@/types/tool";
import { createReadCache } from "@/lib/read-cache";
import { Platform } from "react-native";

const articles = createReadCache<BlogPost>();
const reading = createReadCache<ArticleReading>();
export const cachedArticle = (slug: string) => articles.peek(slug);
export function prefetchArticle(slug: string) {
  void blogAPI.article(slug).catch(() => { /* Opening the page offers retry on failure. */ });
}

// Deployed web builds use the Cloudflare proxy, including when an older API URL
// is still set in the dashboard. Local development and native apps stay direct.
const sameOrigin = Platform.OS === "web" && !__DEV__ && process.env.EXPO_PUBLIC_API_MODE !== "direct";
const baseURL = sameOrigin ? "" : process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
export const apiConfigured = sameOrigin || Boolean(baseURL);
export const siteAuthor = process.env.EXPO_PUBLIC_SITE_AUTHOR || "EasyQ";
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
  list: (offset = 0, limit = 12) => request<PostPage>(`/api/posts?offset=${offset}&limit=${limit}`),
  article: (slug: string) => articles.get(slug, () => request<BlogPost>(`/api/posts/${encodeURIComponent(slug)}`)),
  reading: (slug: string) => reading.get(slug, () => request<ArticleReading>(`/api/posts/${encodeURIComponent(slug)}/reading`)),
  login: (username: string, password: string) => request<{ token: string; expiresAt: string }>("/api/admin/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  logout: (token: string) => request<void>("/api/admin/logout", { method: "POST" }, token),
  drafts: (token: string, offset = 0) => request<PostPage>(`/api/admin/posts?offset=${offset}`, {}, token),
  draft: (token: string, id: string) => request<BlogPost>(`/api/admin/posts/${encodeURIComponent(id)}`, {}, token),
  save: async (token: string, data: PostInput, id?: string) => {
    const post = await request<BlogPost>(id ? `/api/admin/posts/${encodeURIComponent(id)}` : "/api/admin/posts", { method: id ? "PUT" : "POST", body: JSON.stringify(data) }, token);
    articles.clear(); reading.clear();
    return post;
  },
  tools: async () => {
    const data = await request<{ tools: ExternalTool[] }>("/api/tools");
    if (!Array.isArray(data.tools)) throw new ApiError("工具接口返回格式不正确，请检查 API 域名是否指向 EasyQ 后端。", 502);
    return data;
  },
  saveTool: (token: string, data: ToolInput, id?: string) => request<ExternalTool>(id ? `/api/admin/tools/${encodeURIComponent(id)}` : "/api/admin/tools", { method: id ? "PUT" : "POST", body: JSON.stringify(data) }, token),
  deleteTool: (token: string, tool: ExternalTool) => request<void>(`/api/admin/tools/${encodeURIComponent(tool.id)}?version=${tool.version}`, { method: "DELETE" }, token),
};
