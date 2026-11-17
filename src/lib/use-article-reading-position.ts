import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, type ComponentRef } from "react";
import { AppState, Platform, ScrollView, type ScrollViewProps } from "react-native";
import { getStored, removeStored, setStored } from "@/lib/storage";
import type { BlogPost } from "@/types/blog";

type ArticleIdentity = Pick<BlogPost, "id" | "updatedAt">;
type SavedPosition = { revision: string; y: number };

function positionKey(id: string) {
  return `easyq.blog.position.v1:${id}`;
}

function savedOffset(raw: string | null, revision: string): number | null {
  if (!raw) return null;
  try {
    const saved: SavedPosition = JSON.parse(raw);
    return saved.revision === revision && Number.isFinite(saved.y) && saved.y >= 80 ? saved.y : null;
  } catch {
    return null;
  }
}

export function useArticleReadingPosition(post: ArticleIdentity | null) {
  const postId = post?.id;
  const revision = post?.updatedAt;
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const y = useRef(0);
  const contentHeight = useRef(0);
  const viewportHeight = useRef(0);
  const target = useRef<number | null>(null);
  const loaded = useRef(false);
  const pending = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const restore = useCallback(() => {
    if (!pending.current || !loaded.current) return;
    if (target.current === null) {
      pending.current = false;
      return;
    }
    if (!scrollRef.current || contentHeight.current <= viewportHeight.current || viewportHeight.current <= 0) return;
    const offset = Math.min(target.current, contentHeight.current - viewportHeight.current);
    y.current = offset;
    pending.current = false;
    scrollRef.current.scrollTo({ y: offset, animated: false });
  }, []);

  const save = useCallback(() => {
    if (!postId || !revision || pending.current) return;
    const key = positionKey(postId);
    const atEnd = contentHeight.current > viewportHeight.current &&
      y.current + viewportHeight.current >= contentHeight.current - 80;
    const operation = y.current < 80 || atEnd
      ? removeStored(key)
      : setStored(key, JSON.stringify({ revision, y: Math.round(y.current) } satisfies SavedPosition));
    void operation.catch(() => {});
  }, [postId, revision]);

  useEffect(() => {
    if (!postId || !revision) return;
    pending.current = true;
    loaded.current = false;
    target.current = null;
    y.current = 0;
    let active = true;
    void getStored(positionKey(postId)).then(raw => {
      if (!active) return;
      target.current = savedOffset(raw, revision);
      loaded.current = true;
      restore();
    }).catch(() => {
      if (!active) return;
      loaded.current = true;
      restore();
    });
    return () => {
      active = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [postId, revision, restore]);

  useFocusEffect(useCallback(() => () => {
    if (timer.current) clearTimeout(timer.current);
    save();
  }, [save]));

  useEffect(() => {
    if (Platform.OS === "web") {
      const onHide = () => save();
      const onVisibility = () => { if (document.visibilityState === "hidden") save(); };
      window.addEventListener("pagehide", onHide);
      document.addEventListener("visibilitychange", onVisibility);
      return () => {
        window.removeEventListener("pagehide", onHide);
        document.removeEventListener("visibilitychange", onVisibility);
      };
    }
    const subscription = AppState.addEventListener("change", state => {
      if (state !== "active") save();
    });
    return () => subscription.remove();
  }, [save]);

  const onScroll: NonNullable<ScrollViewProps["onScroll"]> = useCallback(event => {
    const offset = Math.max(0, event.nativeEvent.contentOffset.y);
    if (pending.current) {
      if (offset < 24) return;
      // A reader who starts scrolling before storage loads keeps their chosen position.
      pending.current = false;
    }
    y.current = offset;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, 700);
  }, [save]);

  const onContentSizeChange: NonNullable<ScrollViewProps["onContentSizeChange"]> = useCallback((_width, height) => {
    contentHeight.current = height;
    restore();
  }, [restore]);

  const onLayout: NonNullable<ScrollViewProps["onLayout"]> = useCallback(event => {
    viewportHeight.current = event.nativeEvent.layout.height;
    restore();
  }, [restore]);

  return { scrollRef, onScroll, onContentSizeChange, onLayout };
}
