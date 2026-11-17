import { useApp } from "@/context/app-context";
import type { MarkdownVideo } from "@/lib/markdown-video";

export function VideoEmbed({ video }: { video: MarkdownVideo }) {
  const { colors, language } = useApp();
  return <div style={{ margin: "20px 0" }}>
    {video.embedUrl ? <iframe
      src={video.embedUrl}
      title={video.title}
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
      style={{ display: "block", width: "100%", aspectRatio: "16 / 9", border: 0, borderRadius: 12, backgroundColor: colors.surfaceSoft }}
    /> : video.file ? <video
      src={video.url}
      controls
      preload="metadata"
      playsInline
      style={{ display: "block", width: "100%", aspectRatio: "16 / 9", borderRadius: 12, backgroundColor: colors.surfaceSoft }}
    /> : null}
    <a href={video.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 8, color: colors.accent, fontSize: 14 }}>
      {video.title} ↗ {video.embedUrl || video.file ? "" : language === "zh" ? "打开视频" : "Open video"}
    </a>
  </div>;
}
