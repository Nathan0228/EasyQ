import { useEffect } from "react";
import { blogFallbackMetadata, getArticleMetadata, getArticleSlug, getPageMetadata, siteOrigin } from "@/lib/page-metadata.mjs";
import type { BlogPost } from "@/types/blog";

type Metadata = typeof blogFallbackMetadata;

function updateDocument({ title, description, canonical }: Metadata) {
  document.title = title;
  const descriptionTag = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    ?? document.head.appendChild(document.createElement("meta"));
  descriptionTag.name = "description";
  descriptionTag.content = description;
  const canonicalTag = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonical) {
    const link = canonicalTag ?? document.head.appendChild(document.createElement("link"));
    link.rel = "canonical";
    link.href = canonical;
  } else {
    canonicalTag?.remove();
  }
}

export function updateArticleMetadata(slug: string, post: BlogPost) {
  if (typeof document === "undefined" || getArticleSlug(window.location.pathname) !== slug) return;
  updateDocument(getArticleMetadata(post, slug) ?? blogFallbackMetadata);
}

export function usePageMetadata(pathname: string) {
  useEffect(() => {
    const slug = getArticleSlug(pathname);
    if (!slug) {
      updateDocument(getPageMetadata(pathname) ?? {
        title: "EasyQ",
        description: "",
        canonical: "",
      });
      return;
    }

    // Keep the metadata sent by the Worker while the article loads.
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical?.href !== `${siteOrigin}/blog/${slug}`) updateDocument(blogFallbackMetadata);
  }, [pathname]);
}
