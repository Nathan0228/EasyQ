export type MarkdownVideo = {
  title: string;
  url: string;
  embedUrl?: string;
  file?: boolean;
};

function videoSource(raw: string) {
  try {
    const source = raw.replace(/&amp;/g, "&");
    const url = new URL(source.startsWith("//") ? `https:${source}` : source);
    if (url.protocol !== "https:" && url.protocol !== "http:") return;
    const host = url.hostname.toLowerCase();
    const path = url.pathname;
    const youtubeId = host === "youtu.be" ? path.split("/")[1]
      : /^(?:www\.|m\.)?youtube\.com$/.test(host) || host === "www.youtube-nocookie.com"
        ? url.searchParams.get("v") || path.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1]
        : undefined;
    if (youtubeId && /^[\w-]{11}$/.test(youtubeId)) {
      return { url: url.href, embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}` };
    }
    if (host === "vimeo.com" || host === "www.vimeo.com" || host === "player.vimeo.com") {
      const id = path.match(/\/(?:video\/)?(\d+)(?:\/|$)/)?.[1];
      if (id) return { url: url.href, embedUrl: `https://player.vimeo.com/video/${id}` };
    }
    if (host === "www.bilibili.com" || host === "bilibili.com" || host === "player.bilibili.com") {
      const bvid = path.match(/\/video\/(BV[\w]+)/i)?.[1] || url.searchParams.get("bvid");
      if (bvid && /^BV[\w]+$/i.test(bvid)) {
        const page = url.searchParams.get("p") || url.searchParams.get("page");
        const params = new URLSearchParams({ bvid });
        if (page && /^\d+$/.test(page)) params.set("page", page);
        return { url: url.href, embedUrl: `https://player.bilibili.com/player.html?${params}` };
      }
    }
    if (/\.(?:mp4|webm|ogg)$/i.test(path)) return { url: url.href, file: true };
    return { url: url.href };
  } catch {
    return;
  }
}

export function readVideoLine(line: string): MarkdownVideo | undefined {
  const trimmed = line.trim();
  const iframe = trimmed.match(/^<iframe\b([^>]*)>(?:\s*<\/iframe>)?\s*$/i);
  if (iframe) {
    const source = iframe[1].match(/\bsrc\s*=\s*(["'])(.*?)\1/i)?.[2];
    const video = source ? videoSource(source) : undefined;
    return video && { ...video, title: "Video" };
  }
  if (/^https?:\/\/\S+$/.test(trimmed)) {
    const video = videoSource(trimmed);
    return video && (video.embedUrl || video.file) ? { ...video, title: "Video" } : undefined;
  }
  const link = trimmed.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
  if (!link) return;
  const video = videoSource(link[2]);
  if (!video) return;
  const explicit = /^(?:视频|video)\s*[:：]\s*/i.test(link[1]);
  if (!explicit && !video.embedUrl && !video.file) return;
  return { ...video, title: link[1].replace(/^(?:视频|video)\s*[:：]\s*/i, "") || "Video" };
}
