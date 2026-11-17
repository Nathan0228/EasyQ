import { useLocalSearchParams, useNavigation, usePreventRemove, type NativeStackNavigationProp } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { AdminLogin } from "@/components/admin-login";
import { AppIcon } from "@/components/app-icon";
import { AppText } from "@/components/app-text";
import { Markdown } from "@/components/markdown";
import { Eyebrow, Loading, Notice, PortalScreen, TextLink } from "@/components/portal-ui";
import { AppButton, AppInput, SectionLabel } from "@/components/ui";
import { useApp } from "@/context/app-context";
import { useBlogSession } from "@/context/blog-session";
import { useDraftEditor } from "@/lib/use-draft-editor";

type EditorNavigation = NativeStackNavigationProp<{ "admin/editor": { id?: string } }, "admin/editor">;

export default function Editor() {
  const { id: routeID } = useLocalSearchParams<{ id?: string }>();
  const navigation = useNavigation<EditorNavigation>();
  const [adopted, setAdopted] = useState<{ from?: string; id: string; editorKey: string }>();
  const editorKey = adopted && adopted.id === routeID ? adopted.editorKey : routeID || "new";
  const onCreated = useCallback((id: string) => {
    setAdopted({ from: routeID, id, editorKey });
  }, [routeID, editorKey]);
  useEffect(() => {
    if (adopted && adopted.from === routeID) navigation.setParams({ id: adopted.id });
  }, [adopted, routeID, navigation]);
  return <EditorContent key={editorKey} routeID={routeID} onCreated={onCreated} />;
}

function EditorContent({ routeID, onCreated }: { routeID?: string; onCreated: (id: string) => void }) {
  const { token } = useBlogSession();
  const { colors, theme } = useApp();
  const { id, form, loaded, loading, saving, dirty, message, saveError, conflict, update, save, refresh, loadCloudVersion } = useDraftEditor(routeID, onCreated);
  const [preview, setPreview] = useState(false);
  const [leave, setLeave] = useState<null | (() => void)>(null);
  usePreventRemove(dirty || saving, ({ repeat }) => setLeave(() => repeat));
  useEffect(() => {
    if ((!dirty && !saving) || typeof window === "undefined" || typeof window.addEventListener !== "function") return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = true; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, saving]);
  const syncLabel = conflict ? "有版本冲突"
    : saving ? "同步中…"
    : saveError ? "尚未同步"
    : dirty && !form.title.trim() ? "填写标题后可同步"
    : dirty ? "尚未保存"
    : id && loaded ? "已同步" : "";
  if (!token) return <AdminLogin />;
  return <PortalScreen>
    <TextLink href="/admin" label="← 写作台" />
    <View className="mt-6"><Eyebrow>{form.status === "published" ? "PUBLISHED STORY" : "WORK IN PROGRESS"}</Eyebrow></View>
    <View className="mb-6 flex-row items-center justify-between"><AppText accessibilityRole="header" className="text-[30px] font-semibold">{id ? "继续写作" : "新的篇章"}</AppText><AppText accessibilityLiveRegion="polite" className="text-xs" style={{ color: colors.secondary }}>{syncLabel}</AppText></View>
    {!loaded ? <>{loading || !message ? <Loading /> : <Notice message={message} retry={() => void refresh()} />}</> : <>
      {Boolean(message) && <Notice message={message} />}
      {conflict && <View className="mb-6 gap-3 rounded-2xl border p-4" style={{ borderColor: colors.border }}>
        <AppText accessibilityLiveRegion="polite" className="text-sm leading-6">另一台设备更新了这篇文章。当前文字仍保留，自动保存已暂停。</AppText>
        <AppButton iconName="save" label="将本机修改另存为草稿" onPress={() => void save("draft", false, true)} disabled={saving} />
        <AppButton iconName="download" label="放弃本机修改并载入云端版本" variant="secondary" onPress={loadCloudVersion} disabled={saving} />
      </View>}
      <View className="mb-6 flex-row gap-5"><Pressable accessibilityRole="tab" accessibilityState={{ selected: !preview }} onPress={() => setPreview(false)} className={`glass-button glass-button--${theme} ui-pressable min-h-11 flex-row items-center justify-center gap-2 rounded-xl border px-4`}><AppIcon name="edit" size={16} color={!preview ? colors.accent : colors.secondary} /><AppText style={{ color: !preview ? colors.accent : colors.secondary }}>编辑</AppText></Pressable><Pressable accessibilityRole="tab" accessibilityState={{ selected: preview }} onPress={() => setPreview(true)} className={`glass-button glass-button--${theme} ui-pressable min-h-11 flex-row items-center justify-center gap-2 rounded-xl border px-4`}><AppIcon name="eye" size={16} color={preview ? colors.accent : colors.secondary} /><AppText style={{ color: preview ? colors.accent : colors.secondary }}>阅读预览</AppText></Pressable></View>
      {preview ? <View className="min-h-[320px]"><AppText className="mb-5 text-[32px] font-semibold leading-[44px]">{form.title || "文章标题"}</AppText><AppText className="mb-7 text-base leading-7" style={{ color: colors.secondary }}>{form.excerpt}</AppText><Markdown content={form.content || "正文会在这里呈现。"} /></View> : <View className="gap-5">
        <View><SectionLabel>标题</SectionLabel><AppInput accessibilityLabel="文章标题" value={form.title} onChangeText={v => update("title", v)} maxLength={200} placeholder="想写些什么？" /></View>
        <View><SectionLabel>文章地址 · 小写英文、数字、连字符（留空自动生成）</SectionLabel><AppInput accessibilityLabel="文章地址" value={form.slug} onChangeText={v => update("slug", v)} autoCapitalize="none" maxLength={160} placeholder="a-small-beginning" /></View>
        <View><SectionLabel>分类</SectionLabel><AppInput accessibilityLabel="文章分类" value={form.category} onChangeText={v => update("category", v)} maxLength={60} placeholder="技术 / 随笔 / 生活" /></View>
        <View><SectionLabel>摘要</SectionLabel><AppInput accessibilityLabel="文章摘要" value={form.excerpt} onChangeText={v => update("excerpt", v)} multiline maxLength={600} placeholder="用一两句话介绍这篇文章。" /></View>
        <View><SectionLabel>正文 · Markdown</SectionLabel><AppInput accessibilityLabel="文章正文" value={form.content} onChangeText={v => update("content", v)} multiline style={{ minHeight: 420, lineHeight: 27 }} placeholder={"## 从这里开始\n\n写下你的第一段文字。"} /></View>
        <AppText className="text-xs leading-6" style={{ color: colors.secondary }}>{"支持标题、粗体、代码、列表、待办列表、引用、链接、图片、视频和公式。代码块开头可写 ```ts 或 ```python 来显示语言，读者可复制代码。待办项用 - [ ] 或 - [x]；视频可单独放一行 [标题](视频链接)、直接粘贴视频网址，或粘贴 iframe 嵌入代码。其他视频平台可用 [视频: 标题](链接) 显示外部链接。行内公式用 $...$ 或 \\(...\\)，独立公式用 $$...$$ 或 \\[...\\]。除视频 iframe 的地址外，不会执行 HTML 或脚本。"}</AppText>
      </View>}
      <View className="mt-8 gap-3 sm:flex-row">
        <View className="flex-1"><AppButton iconName="save" label={form.status === "published" ? "保存更新" : "保存草稿"} disabled={saving || Boolean(conflict)} variant="secondary" onPress={() => void save(form.status)} /></View>
        <View className="flex-1"><AppButton iconName={form.status === "published" ? "book" : "upload"} label={form.status === "published" ? "撤回为草稿" : "发布文章"} disabled={saving || Boolean(conflict)} onPress={() => void save(form.status === "published" ? "draft" : "published")} /></View>
      </View>
      {form.status === "published" && <TextLink href={{ pathname: "/blog/[slug]", params: { slug: form.slug } }} label="查看公开文章 ↗" />}
    </>}
    <Modal transparent visible={Boolean(leave)} animationType="fade" onRequestClose={() => setLeave(null)}>
      <View className="flex-1 items-center justify-center p-6" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}><View className="w-full max-w-[420px] gap-4 rounded-3xl p-6" style={{ backgroundColor: colors.surface }}>
        <AppText accessibilityRole="header" className="text-xl font-semibold">{saving ? "正在保存文章" : dirty ? "还有未保存的文字" : "文章已保存"}</AppText>
        {dirty && <AppText className="text-sm leading-6">离开会丢失尚未同步的修改。</AppText>}
        <AppButton iconName="edit" label="继续写作" onPress={() => setLeave(null)} />
        <AppButton iconName="close" label={dirty ? "放弃修改并离开" : "离开"} variant="secondary" disabled={saving} onPress={() => { const repeat = leave; setLeave(null); repeat?.(); }} />
      </View></View>
    </Modal>
  </PortalScreen>;
}

