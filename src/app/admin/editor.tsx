import { useFocusEffect, useLocalSearchParams, usePreventRemove } from "expo-router";
import { useCallback, useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { AdminLogin } from "@/components/admin-login";
import { AppText } from "@/components/app-text";
import { Markdown } from "@/components/markdown";
import { Eyebrow, Loading, Notice, PortalScreen, TextLink } from "@/components/portal-ui";
import { AppButton, AppInput, SectionLabel } from "@/components/ui";
import { useApp } from "@/context/app-context";
import { useBlogSession } from "@/context/blog-session";
import { ApiError, blogAPI } from "@/lib/blog-api";
import type { BlogPost, PostInput } from "@/types/blog";

const empty: PostInput = { title: "", slug: "", excerpt: "", category: "", content: "", status: "draft", version: 0 };
function fields(post: BlogPost): PostInput { return { title: post.title, slug: post.slug, excerpt: post.excerpt, category: post.category, content: post.content || "", status: post.status, version: post.version }; }

export default function Editor() {
  const { id: routeID } = useLocalSearchParams<{ id?: string }>();
  return <EditorContent key={routeID || "new"} routeID={routeID} />;
}

function EditorContent({ routeID }: { routeID?: string }) {
  const { token, setToken } = useBlogSession();
  const { colors } = useApp();
  const [id, setID] = useState(routeID);
  const [form, setForm] = useState<PostInput>(empty);
  const [baseline, setBaseline] = useState(JSON.stringify(empty));
  const [loaded, setLoaded] = useState(!routeID);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [message, setMessage] = useState("");
  const [leave, setLeave] = useState<null | (() => void)>(null);
  const dirty = JSON.stringify(form) !== baseline;
  usePreventRemove(dirty || busy, ({ repeat }) => { if (!busy) setLeave(() => repeat); });
  const load = useCallback(async () => {
    if (!token || !routeID || loaded) return;
    setBusy(true); setMessage("");
    try { const post = await blogAPI.draft(token, routeID); const value = fields(post); setForm(value); setBaseline(JSON.stringify(value)); setLoaded(true); }
    catch (e) { if (e instanceof ApiError && e.status === 401) setToken(null); setMessage(e instanceof Error ? e.message : "读取失败"); }
    finally { setBusy(false); }
  }, [token, routeID, loaded, setToken]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  function update(key: keyof PostInput, value: string) { setForm(old => ({ ...old, [key]: value })); setMessage(""); }
  async function save(status: "draft" | "published") {
    if (!token || busy) return;
    if (!form.title.trim()) { setMessage("先为文章起个标题。"); return; }
    if (status === "published" && !form.content.trim()) { setMessage("请填写正文后再发布。"); return; }
    setBusy(true); setMessage("");
    const slug = form.slug.trim() || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120).replace(/-$/g, "") || "note-" + Date.now().toString(36);
    try {
      const post = await blogAPI.save(token, { ...form, slug, status }, id);
      const value = fields(post); setID(post.id); setForm(value); setBaseline(JSON.stringify(value));
      setMessage(status === "published" ? "已发布，读者现在可以在博客中阅读。" : "草稿已保存，仅你可见。");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setToken(null);
      setMessage(e instanceof Error ? e.message : "保存失败，正文仍保留在编辑器中。");
    } finally { setBusy(false); }
  }
  if (!token) return <AdminLogin />;
  return <PortalScreen>
    <TextLink href="/admin" label="← 写作台" />
    <View className="mt-6"><Eyebrow>{form.status === "published" ? "PUBLISHED STORY" : "WORK IN PROGRESS"}</Eyebrow></View>
    <View className="mb-6 flex-row items-center justify-between"><AppText accessibilityRole="header" className="text-[30px] font-semibold">{id ? "继续写作" : "新的篇章"}</AppText><AppText className="text-xs" style={{ color: colors.secondary }}>{dirty ? "尚未保存" : "已同步"}</AppText></View>
    {!loaded ? <>{busy ? <Loading /> : <Notice message={message || "无法读取文章"} retry={() => void load()} />}</> : <>
      {Boolean(message) && <Notice message={message} />}
      <View className="mb-6 flex-row gap-5"><Pressable accessibilityRole="tab" accessibilityState={{ selected: !preview }} onPress={() => setPreview(false)} className="min-h-11 justify-center"><AppText style={{ color: !preview ? colors.accent : colors.secondary }}>编辑</AppText></Pressable><Pressable accessibilityRole="tab" accessibilityState={{ selected: preview }} onPress={() => setPreview(true)} className="min-h-11 justify-center"><AppText style={{ color: preview ? colors.accent : colors.secondary }}>阅读预览</AppText></Pressable></View>
      {preview ? <View className="min-h-[320px]"><AppText className="mb-5 text-[32px] font-semibold leading-[44px]">{form.title || "文章标题"}</AppText><AppText className="mb-7 text-base leading-7" style={{ color: colors.secondary }}>{form.excerpt}</AppText><Markdown content={form.content || "正文会在这里呈现。"} /></View> : <View className="gap-5">
        <View><SectionLabel>标题</SectionLabel><AppInput accessibilityLabel="文章标题" editable={!busy} value={form.title} onChangeText={v => update("title", v)} maxLength={200} placeholder="想写些什么？" /></View>
        <View><SectionLabel>文章地址 · 小写英文、数字、连字符（留空自动生成）</SectionLabel><AppInput accessibilityLabel="文章地址" editable={!busy} value={form.slug} onChangeText={v => update("slug", v)} autoCapitalize="none" maxLength={160} placeholder="a-small-beginning" /></View>
        <View><SectionLabel>分类</SectionLabel><AppInput accessibilityLabel="文章分类" editable={!busy} value={form.category} onChangeText={v => update("category", v)} maxLength={60} placeholder="技术 / 随笔 / 生活" /></View>
        <View><SectionLabel>摘要</SectionLabel><AppInput accessibilityLabel="文章摘要" editable={!busy} value={form.excerpt} onChangeText={v => update("excerpt", v)} multiline maxLength={600} placeholder="用一两句话介绍这篇文章。" /></View>
        <View><SectionLabel>正文 · Markdown</SectionLabel><AppInput accessibilityLabel="文章正文" editable={!busy} value={form.content} onChangeText={v => update("content", v)} multiline style={{ minHeight: 420, lineHeight: 27 }} placeholder={"## 从这里开始\n\n写下你的第一段文字。"} /></View>
        <AppText className="text-xs leading-6" style={{ color: colors.secondary }}>支持标题、粗体、行内代码、代码块、列表、引用、链接和图片。图片可使用 ![说明](https://图片地址)。不会执行 HTML 或脚本。</AppText>
      </View>}
      <View className="mt-8 gap-3 sm:flex-row"><View className="flex-1"><AppButton label={busy ? "保存中…" : form.status === "published" ? "保存更新" : "保存草稿"} disabled={busy} variant="secondary" onPress={() => void save(form.status)} /></View><View className="flex-1"><AppButton label={form.status === "published" ? "撤回为草稿" : "发布文章"} disabled={busy} onPress={() => void save(form.status === "published" ? "draft" : "published")} /></View></View>
      {form.status === "published" && <TextLink href={{ pathname: "/blog/[slug]", params: { slug: form.slug } }} label="查看公开文章 ↗" />}
    </>}
    <Modal transparent visible={Boolean(leave)} animationType="fade" onRequestClose={() => setLeave(null)}>
      <View className="flex-1 items-center justify-center p-6" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}><View className="w-full max-w-[420px] gap-4 rounded-3xl p-6" style={{ backgroundColor: colors.surface }}>
        <AppText className="text-xl font-semibold">还有未保存的文字</AppText><AppText className="text-sm leading-6">离开会丢失本次修改。可以留下来先保存草稿。</AppText>
        <AppButton label="继续写作" onPress={() => setLeave(null)} /><AppButton label="放弃修改并离开" variant="secondary" onPress={() => { setBaseline(JSON.stringify(form)); const repeat = leave; setLeave(null); repeat?.(); }} />
      </View></View>
    </Modal>
  </PortalScreen>;
}

