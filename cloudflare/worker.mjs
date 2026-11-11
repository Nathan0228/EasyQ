const methods = new Set(["GET", "HEAD", "POST", "PUT", "DELETE", "OPTIONS"]);

function failure(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/api" && !url.pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }
    if (!methods.has(request.method)) return failure("不支持的请求方法", 405);

    // This proxy is for this site's clients. Authentication remains in Go.
    const origin = request.headers.get("Origin");
    if (origin && origin !== url.origin) return failure("请求来源不被允许", 403);

    let upstream;
    try {
      upstream = new URL(env.API_ORIGIN);
      if (upstream.protocol !== "https:" || upstream.username || upstream.password
        || upstream.pathname !== "/" || upstream.search || upstream.hash || upstream.origin === url.origin) {
        throw new Error("invalid API origin");
      }
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
    const timer = setTimeout(() => controller.abort(), 12000);
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
