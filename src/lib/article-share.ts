import { Platform, Share } from "react-native";

export function articleShareURL(slug: string) {
  const origin = Platform.OS === "web" && typeof window !== "undefined"
    ? window.location.origin
    : "https://easyq.findingai.top";
  return `${origin}/blog/${encodeURIComponent(slug)}`;
}

export async function shareArticle(title: string, url: string): Promise<"shared" | "copied" | "dismissed"> {
  if (Platform.OS === "web") {
    const data = { title, url };
    if (typeof navigator.share === "function" && (!navigator.canShare || navigator.canShare(data))) {
      try {
        // Call directly from the click handler to preserve Safari's user activation.
        await navigator.share(data);
        return "shared";
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return "dismissed";
        // Unsupported or blocked system sharing can still fall back to copying.
      }
    }
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(url);
    return "copied";
  }

  const result = await Share.share({
    title,
    url,
    // Android ignores the url property, so include the link in its message.
    message: Platform.OS === "ios" ? title : `${title}\n${url}`,
  });
  return result.action === Share.dismissedAction ? "dismissed" : "shared";
}
