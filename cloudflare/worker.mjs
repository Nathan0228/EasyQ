import { blogFallbackMetadata, getArticleMetadata, getArticleSlug, getPageMetadata, siteOrigin } from "../src/lib/page-metadata.mjs";

const methods = new Set(["GET", "HEAD", "POST", "PUT", "DELETE", "OPTIONS"]);
const sitemapPaths = ["/", "/blog", "/tools", "/traval", "/ask"];
const postPageSize = 50;
// The Workers Free plan allows 50 upstream requests per invocation.
const maxPostPages = 50;
const apiTimeout = 12000;

function failure(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function apiOrigin(env, requestOrigin) {
  const upstream = new URL(env.API_ORIGIN);
  if (upstream.protocol !== "https:" || upstream.username || upstream.password
    || upstream.pathname !== "/" || upstream.search || upstream.hash || upstream.origin === requestOrigin) {
    throw new Error("invalid API origin");
  }
  return upstream;
}

async function articleMetadata(slug, env, requestOrigin) {
  try {
    const upstream = apiOrigin(env, requestOrigin);
    upstream.pathname = `/api/posts/${slug}`;
    const response = await fetch(upstream, {
      headers: { Accept: "application/json" },
      redirect: "manual",
      signal: AbortSignal.timeout(2000),
      cf: { cacheTtl: 0, cacheEverything: false },
    });
    if (!response.ok) {
      await response.body?.cancel();
      return blogFallbackMetadata;
    }
    return getArticleMetadata(await response.json(), slug) ?? blogFallbackMetadata;
  } catch {
    // Let the SPA open normally if the metadata request cannot complete.
    return blogFallbackMetadata;
  }
}

function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function servePage(request, url, env) {
  const page = getPageMetadata(url.pathname);
  const slug = getArticleSlug(url.pathname);
  if (request.method !== "GET" || (!page && !slug)) return env.ASSETS.fetch(request);

  // The HTML template's validators do not account for changes to an article.
  const assetRequest = new Request(request);
  assetRequest.headers.delete("If-None-Match");
  assetRequest.headers.delete("If-Modified-Since");
  const asset = await env.ASSETS.fetch(assetRequest);
  if (asset.status !== 200 || !asset.headers.get("Content-Type")?.startsWith("text/html")) return asset;

  const { title, description, canonical } = slug ? await articleMetadata(slug, env, url.origin) : page;
  const body = new HTMLRewriter()
    .on("head > title", { element: (element) => element.setInnerContent(title) })
    .on('head > meta[name="description"]', {
      element: (element) => element.replace(`<meta name="description" content="${escapeHtml(description)}">`, { html: true }),
    })
    .on("head", {
      element(element) {
        if (canonical) element.append(`<link rel="canonical" href="${escapeHtml(canonical)}">`, { html: true });
      },
    })
    .transform(asset);
  const response = new Response(body.body, body);
  response.headers.delete("ETag");
  response.headers.delete("Last-Modified");
  response.headers.set("Cache-Control", "no-cache");
  return response;
}

async function sitemap(env, requestOrigin) {
  let upstream;
  try {
    upstream = apiOrigin(env, requestOrigin);
  } catch {
    return failure("API 代理地址配置错误", 503);
  }
  upstream.pathname = "/api/posts";
  upstream.searchParams.set("limit", String(postPageSize));

  const entries = new Map(sitemapPaths.map((path) => [path, ""]));
  const signal = AbortSignal.timeout(apiTimeout);
  try {
    for (let page = 0; page < maxPostPages; page++) {
      upstream.searchParams.set("offset", String(page * postPageSize));
      const response = await fetch(upstream, {
        headers: { Accept: "application/json" },
        redirect: "manual",
        signal,
        cf: { cacheTtl: 0, cacheEverything: false },
      });
      if (!response.ok) {
        await response.body?.cancel();
        return failure("暂时无法读取已发布文章", 502);
      }

      const data = await response.json();
      if (!Array.isArray(data?.posts) || typeof data.hasMore !== "boolean"
        || data.posts.length > postPageSize || (data.hasMore && data.posts.length !== postPageSize)) {
        return failure("文章列表格式错误", 502);
      }
      for (const post of data.posts) {
        if (post?.status !== "published") continue;
        // Match the public API's slug format so each loc contains a single XML-safe path segment.
        if (typeof post.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug)) {
          return failure("文章网址格式错误", 502);
        }
        const updated = Date.parse(post.updatedAt);
        entries.set(`/blog/${post.slug}`, Number.isFinite(updated) ? new Date(updated).toISOString() : "");
      }
      if (!data.hasMore) {
        const urls = Array.from(entries, ([path, updated]) =>
          `  <url><loc>${siteOrigin}${path}</loc>${updated ? `<lastmod>${updated}</lastmod>` : ""}</url>`,
        );
        return new Response([
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...urls,
          "</urlset>",
          "",
        ].join("\n"), {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=60",
          },
        });
      }
    }
    return failure("站点地图超过文章分页上限", 503);
  } catch {
    return signal.aborted
      ? failure("读取文章列表超时，请稍后重试", 504)
      : failure("暂时无法读取已发布文章", 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/sitemap.xml") {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
      }
      const response = await sitemap(env, url.origin);
      return request.method === "HEAD" ? new Response(null, response) : response;
    }
    if (url.pathname !== "/api" && !url.pathname.startsWith("/api/")) {
      return servePage(request, url, env);
    }
    if (!methods.has(request.method)) return failure("不支持的请求方法", 405);

    // This proxy is for this site's clients. Authentication remains in Go.
    const origin = request.headers.get("Origin");
    if (origin && origin !== url.origin) return failure("请求来源不被允许", 403);

    let upstream;
    try {
      upstream = apiOrigin(env, url.origin);
    } catch {
      return failure("API 代理地址配置错误", 503);
    }
    // Assigning pathname preserves the fixed host, even for encoded URL paths.
    upstream.pathname = url.pathname;
    upstream.search = url.search;

    const headers = new Headers();
    for (const name of ["Accept", "Accept-Language", "Content-Language", "Content-Type", "Authorization"]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    // Do not forward browser cookies or Origin: this is a server-to-server hop.
    // Preserve an explicit refresh for Go's application cache; the proxy itself
    // never caches API responses, including authenticated requests.
    headers.set("Cache-Control", /(?:^|,)\s*no-cache\s*(?:,|$)/i.test(request.headers.get("Cache-Control") || "") ? "no-cache" : "no-store");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), apiTimeout);
    try {
      const response = await fetch(upstream, {
        method: request.method,
        headers,
        body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
        redirect: "manual",
        signal: controller.signal,
        cf: { cacheTtl: 0, cacheEverything: false },
      });
      // API redirects must not send the browser back across origins or leak a token.
      if (response.status >= 300 && response.status < 400) {
        return failure("API 服务返回了跳转，请检查反向代理配置", 502);
      }
      const responseHeaders = new Headers(response.headers);
      for (const name of [...responseHeaders.keys()]) {
        if (name.toLowerCase().startsWith("access-control-") || name.toLowerCase() === "set-cookie") {
          responseHeaders.delete(name);
        }
      }
      responseHeaders.set("Cache-Control", "no-store");
      responseHeaders.set("X-EasyQ-API", "same-origin");
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers: responseHeaders });
    } catch {
      return failure(controller.signal.aborted ? "连接后端超时，请稍后重试" : "暂时无法连接后端，请稍后重试", controller.signal.aborted ? 504 : 502);
    } finally {
      clearTimeout(timer);
    }
  },
};
