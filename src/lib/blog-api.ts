import type { BlogPost, PostInput, PostPage } from "@/types/blog";

const baseURL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
export const apiConfigured = Boolean(baseURL);
export const siteAuthor = process.env.EXPO_PUBLIC_SITE_AUTHOR || "EasyQ";
export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  if (!baseURL) throw new ApiError("博客服务尚未连接，请配置 EXPO_PUBLIC_API_URL 后重新构建网站。", 503);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${baseURL}${path}`, {
      ...options, signal: controller.signal,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    });
    if (response.status === 204) return undefined as T;
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new ApiError(data?.error || "服务暂不可用，请稍后重试。", response.status);
    if (!data) throw new ApiError("API 返回了无效响应，请检查服务地址。", 502);
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("无法连接博客服务，请检查网络后重试。", 0);
  } finally { clearTimeout(timer); }
}

export const blogAPI = {
  list: (offset = 0) => request<PostPage>(`/api/posts?offset=${offset}`),
  article: (slug: string) => request<BlogPost>(`/api/posts/${encodeURIComponent(slug)}`),
  login: (username: string, password: string) => request<{ token: string; expiresAt: string }>("/api/admin/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  logout: (token: string) => request<void>("/api/admin/logout", { method: "POST" }, token),
  drafts: (token: string, offset = 0) => request<PostPage>(`/api/admin/posts?offset=${offset}`, {}, token),
  draft: (token: string, id: string) => request<BlogPost>(`/api/admin/posts/${encodeURIComponent(id)}`, {}, token),
  save: (token: string, data: PostInput, id?: string) => request<BlogPost>(id ? `/api/admin/posts/${encodeURIComponent(id)}` : "/api/admin/posts", { method: id ? "PUT" : "POST", body: JSON.stringify(data) }, token),
};
