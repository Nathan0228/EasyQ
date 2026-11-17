import { useIsFocused } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useBlogSession } from "@/context/blog-session";
import { ApiError, blogAPI } from "@/lib/blog-api";
import { useAdminRefresh } from "@/lib/use-admin-refresh";
import type { BlogPost, PostInput } from "@/types/blog";

const empty: PostInput = { title: "", slug: "", excerpt: "", category: "", content: "", status: "draft", version: 0 };
const editableFields = ["title", "slug", "excerpt", "category", "content"] as const;
type EditableField = typeof editableFields[number];

function fields(post: BlogPost): PostInput {
  const { title, slug, excerpt, category, status, version } = post;
  return { title, slug, excerpt, category, content: post.content ?? "", status, version };
}

function sameContent(a: PostInput, b: PostInput) {
  return editableFields.every(key => a[key] === b[key]);
}

function generatedSlug(title: string) {
  const stem = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100).replace(/-$/g, "");
  const suffix = Math.floor(Math.random() * 36 ** 6).toString(36).padStart(6, "0");
  return `${stem || "note"}-${Date.now().toString(36)}-${suffix}`;
}

type EditorState = {
  id?: string;
  form: PostInput;
  baseline: PostInput;
  loaded: boolean;
  loading: boolean;
  saving: boolean;
  conflict: BlogPost | null;
  message: string;
  saveError: "" | "retry" | "blocked";
};

export function useDraftEditor(routeID: string | undefined, onCreated: (id: string) => void) {
  const { token, setToken } = useBlogSession();
  const focused = useIsFocused();
  const [editor, setEditor] = useState<EditorState>(() => ({
    id: routeID, form: empty, baseline: empty, loaded: !routeID, loading: false,
    saving: false, conflict: null, message: "", saveError: "",
  }));
  const current = useRef(editor);
  const activeToken = useRef(token);
  const mounted = useRef(false);
  const read = useRef<symbol | null>(null);
  const generated = useRef("");

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    activeToken.current = token;
    return () => { activeToken.current = null; read.current = null; };
  }, [token]);

  const apply = useCallback((patch: Partial<EditorState>) => {
    const value = { ...current.current, ...patch };
    current.current = value;
    setEditor(value);
  }, []);

  const accept = useCallback((post: BlogPost) => {
    const form = fields(post);
    apply({ id: post.id, form, baseline: form, loaded: true, conflict: null, saveError: "", message: "" });
  }, [apply]);

  const refresh = useCallback(async () => {
    const before = current.current;
    if (!token || !before.id || read.current || before.saving) return;
    const request = Symbol();
    read.current = request;
    if (!before.loaded) apply({ loading: true, message: "" });
    try {
      const remote = await blogAPI.draft(token, before.id);
      const now = current.current;
      if (read.current !== request || now.id !== remote.id || now.saving) return;
      if (!now.loaded) {
        accept(remote);
      } else if (remote.version > now.baseline.version) {
        const cloud = fields(remote);
        if (sameContent(now.form, now.baseline)
          || (now.form.status === cloud.status && sameContent(now.form, cloud))) {
          accept(remote);
        } else if (remote.version !== now.conflict?.version) {
          apply({ conflict: remote, message: "", saveError: "" });
        }
      }
    } catch (e) {
      if (read.current !== request) return;
      if (e instanceof ApiError && e.status === 401) setToken(null);
      if (!current.current.loaded) apply({ message: e instanceof Error ? e.message : "读取失败" });
    } finally {
      if (read.current === request) {
        read.current = null;
        if (current.current.loading) apply({ loading: false });
      }
    }
  }, [token, accept, apply, setToken]);
  const poll = useCallback(() => { void refresh(); }, [refresh]);
  useAdminRefresh(Boolean(token), poll);

  const save = useCallback(async (status: PostInput["status"], auto = false, copy = false) => {
    const { form, baseline, id, saving, loaded, conflict } = current.current;
    if (!token || saving || !loaded || (conflict && !copy)) return;
    if (auto && (form.status !== "draft" || sameContent(form, baseline))) return;
    if (!form.title.trim()) {
      if (!auto) apply({ message: "先为文章起个标题。" });
      return;
    }
    if (status === "published" && !form.content.trim()) {
      apply({ message: "请填写正文后再发布。" });
      return;
    }
    const targetID = copy ? undefined : id;
    const fallback = () => generated.current || (generated.current = generatedSlug(form.title));
    const slug = copy ? generatedSlug(form.title) : form.slug.trim() || fallback();
    const input = { ...form, slug, status, version: targetID ? form.version : 0 };
    read.current = null;
    apply({ saving: true, message: "", saveError: "" });
    let checkConflict = false;
    try {
      const post = await blogAPI.save(token, input, targetID);
      if (activeToken.current !== token) return;
      if (post.version !== input.version + 1) {
        apply({ conflict: post });
        return;
      }
      const saved = fields(post);
      const latest = current.current.form;
      const merged = { ...saved };
      // Edits made while the request was running belong to the next save.
      for (const key of editableFields) {
        if (latest[key] !== form[key]) merged[key] = latest[key];
      }
      apply({
        id: post.id, form: merged, baseline: saved, conflict: null,
        message: auto ? "" : copy ? "本机修改已另存为新草稿。"
          : status === "published" ? "文章已发布。" : "草稿已同步到云端。",
      });
      if (!targetID) onCreated(post.id);
    } catch (e) {
      if (activeToken.current !== token) return;
      const code = e instanceof ApiError ? e.status : 0;
      if (code === 401) setToken(null);
      checkConflict = code === 409 && Boolean(targetID);
      const changedDuringSave = !sameContent(current.current.form, form);
      apply({
        message: e instanceof Error ? e.message : "保存失败，修改仍在编辑器中。",
        saveError: !copy && (code === 0 || code === 401 || code >= 500) ? "retry"
          : changedDuringSave && (code === 409 || code === 422) ? "" : "blocked",
      });
    } finally {
      if (mounted.current) apply({ saving: false });
      if (activeToken.current === token && checkConflict) void refresh();
    }
  }, [token, apply, onCreated, refresh, setToken]);

  const dirty = !sameContent(editor.form, editor.baseline);
  useEffect(() => {
    if (!focused || !token || !editor.loaded || !dirty || editor.saving || editor.conflict
      || editor.saveError === "blocked" || editor.form.status !== "draft" || !editor.form.title.trim()) return;
    const timer = setTimeout(() => { void save("draft", true); }, editor.saveError === "retry" ? 5_000 : 1_200);
    return () => clearTimeout(timer);
  }, [focused, token, dirty, editor.loaded, editor.form, editor.saving, editor.conflict, editor.saveError, save]);

  function update(key: EditableField, value: string) {
    apply({ form: { ...current.current.form, [key]: value }, message: "", saveError: "" });
  }

  function loadCloudVersion() {
    const remote = current.current.conflict;
    if (remote) accept(remote);
  }

  return { ...editor, dirty, update, save, refresh, loadCloudVersion };
}
