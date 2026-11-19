import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { apiConfigured, blogAPI, cachedPostArchive, cachedPostPage } from "@/lib/blog-api";

function cachedArchive() {
  const first = cachedPostPage();
  return cachedPostArchive() ?? (first && !first.hasMore ? first.posts : undefined);
}

export function usePostArchive() {
  const [posts, setPosts] = useState(cachedArchive);
  const [loading, setLoading] = useState(() => apiConfigured && !cachedArchive());
  const [failed, setFailed] = useState(false);
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    if (!apiConfigured) return;
    const id = ++requestId.current;
    setLoading(!cachedArchive());
    setFailed(false);
    try {
      const result = await blogAPI.archive();
      if (id === requestId.current) setPosts(result);
    } catch {
      if (id === requestId.current) setFailed(true);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void reload();
    return () => { requestId.current++; };
  }, [reload]));

  return { posts, loading, failed, reload };
}
