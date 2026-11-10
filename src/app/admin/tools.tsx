import { useFocusEffect, usePreventRemove } from "expo-router";
import { useCallback, useState } from "react";
import { Modal, View } from "react-native";
import { AdminLogin } from "@/components/admin-login";
import { AppText } from "@/components/app-text";
import { Eyebrow, Loading, Notice, PortalScreen, TextLink } from "@/components/portal-ui";
import { ToolIcon } from "@/components/tool-card";
import { AppButton, AppInput, Card, SectionLabel } from "@/components/ui";
import { useApp } from "@/context/app-context";
import { useBlogSession } from "@/context/blog-session";
import { ApiError, blogAPI } from "@/lib/blog-api";
import type { ExternalTool, ToolInput } from "@/types/tool";

const empty: ToolInput = { name: "", description: "", url: "", iconUrl: "", version: 0 };
type Editor = { id?: string; initial: ToolInput; form: ToolInput };

export default function ToolManager() {
  const { colors } = useApp();
  const { token, setToken } = useBlogSession();
  const [tools, setTools] = useState<ExternalTool[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [deleting, setDeleting] = useState<ExternalTool | null>(null);
  const [leave, setLeave] = useState<(() => void) | null>(null);
  const dirty = editor !== null && JSON.stringify(editor.form) !== JSON.stringify(editor.initial);
  usePreventRemove(dirty || busy, ({ repeat }) => { if (!busy) setLeave(() => repeat); });
  const load = useCallback(async (refresh = false) => {
    if (!token) return;
    setLoading(true); setError("");
    try { setTools((await blogAPI.tools(refresh)).tools); }
    catch (e) { setError(e instanceof Error ? e.message : "加载失败"); }
    finally { setLoading(false); }
  }, [token]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  function handleError(e: unknown) {
    if (e instanceof ApiError && e.status === 401) setToken(null);
    setError(e instanceof Error ? e.message : "操作失败，请重试");
  }
  function edit(tool?: ExternalTool) {
    const form: ToolInput = tool ? { name: tool.name, description: tool.description, url: tool.url, iconUrl: tool.iconUrl, version: tool.version } : { ...empty };
    setEditor({ id: tool?.id, initial: form, form }); setError(""); setMessage("");
  }
  function update(field: keyof ToolInput, value: string) {
    setEditor(current => current ? { ...current, form: { ...current.form, [field]: value } } : null);
  }
  async function save() {
    if (!token || !editor || busy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const saved = await blogAPI.saveTool(token, editor.form, editor.id);
      setTools(current => editor.id ? current.map(tool => tool.id === saved.id ? saved : tool) : [...current, saved]);
      setEditor(null); setMessage("入口已保存，访客现在可以在工具页看到它。");
    } catch (e) { handleError(e); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!token || !deleting || busy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await blogAPI.deleteTool(token, deleting);
      setTools(current => current.filter(tool => tool.id !== deleting.id));
      setDeleting(null); setMessage("入口已删除。");
    } catch (e) { handleError(e); setDeleting(null); }
    finally { setBusy(false); }
  }
  if (!token) return <AdminLogin />;
  return <PortalScreen>
    <TextLink href="/admin" label="← 管理首页" />
    <Eyebrow>TOOL DIRECTORY</Eyebrow>
    <AppText accessibilityRole="header" className="mb-4 text-[32px] font-semibold">管理工具入口</AppText>
    <AppText className="mb-6 text-sm leading-6" style={{ color: colors.secondary }}>安静提问是固定的站内入口。这里管理站外网站，保存后对所有访客可见，并在新标签页打开。</AppText>
    {Boolean(error) && <Notice message={error} />}
    {Boolean(message) && <Notice message={message} />}
    {editor ? <Card>
      <AppText accessibilityRole="header" className="mb-5 text-xl font-semibold">{editor.id ? "编辑网站" : "添加网站"}</AppText>
      <View className="gap-4">
        <View><SectionLabel>网站名称</SectionLabel><AppInput accessibilityLabel="网站名称" value={editor.form.name} editable={!busy} onChangeText={v => update("name", v)} maxLength={80} placeholder="给网站一个好记的名字" /></View>
        <View><SectionLabel>网址 · HTTP / HTTPS</SectionLabel><AppInput accessibilityLabel="网站网址" value={editor.form.url} editable={!busy} onChangeText={v => update("url", v)} autoCapitalize="none" autoCorrect={false} keyboardType="url" maxLength={2048} placeholder="https://example.com" /></View>
        <View><SectionLabel>图标地址 · 公开 HTTPS 图片，可留空</SectionLabel><AppInput accessibilityLabel="图标地址" value={editor.form.iconUrl} editable={!busy} onChangeText={v => update("iconUrl", v)} autoCapitalize="none" autoCorrect={false} keyboardType="url" maxLength={2048} placeholder="https://example.com/icon.png" /></View>
        <View><SectionLabel>介绍</SectionLabel><AppInput accessibilityLabel="网站介绍" value={editor.form.description} editable={!busy} onChangeText={v => update("description", v)} multiline maxLength={400} placeholder="它能帮你做什么？" /></View>
        <View className="gap-3 sm:flex-row"><View className="flex-1"><AppButton iconName="save" label={busy ? "保存中…" : "保存入口"} disabled={busy} onPress={() => void save()} /></View><AppButton iconName="close" label="取消编辑" variant="secondary" disabled={busy} onPress={() => dirty ? setLeave(() => () => setEditor(null)) : setEditor(null)} /></View>
      </View>
    </Card> : <AppButton iconName="plus" label="添加站外网站" onPress={() => edit()} disabled={busy} />}
    <View className="mb-3 mt-8 flex-row flex-wrap items-center justify-between gap-3"><AppText className="text-lg font-semibold">已添加的网站</AppText><AppButton compact iconName="refresh" label="重新加载" variant="secondary" disabled={busy || loading || editor !== null} onPress={() => void load(true)} /></View>
    {loading && <Loading />}
    {!loading && !error && tools.length === 0 && <Notice message="还没有站外网站，可以从一个常用的网站开始。" />}
    {tools.map(tool => <View key={tool.id} className="gap-4 border-b py-6" style={{ borderColor: colors.border }}>
      <View className="flex-row items-center gap-4"><ToolIcon key={tool.iconUrl || "default"} uri={tool.iconUrl} name={tool.name} /><View className="flex-1"><AppText className="text-lg font-semibold">{tool.name}</AppText><AppText numberOfLines={2} className="mt-1 text-xs" style={{ color: colors.secondary }}>{tool.url}</AppText></View></View>
      <AppText className="text-sm leading-6" style={{ color: colors.secondary }}>{tool.description}</AppText>
      <View className="flex-row flex-wrap gap-2"><AppButton compact iconName="edit" label="编辑" variant="secondary" disabled={busy || editor !== null} onPress={() => edit(tool)} /><AppButton compact iconName="trash" label="删除" variant="danger" disabled={busy || editor !== null} onPress={() => setDeleting(tool)} /></View>
    </View>)}
    <TextLink href="/tools" label="查看公开工具页 →" />
    <Modal transparent visible={deleting !== null || leave !== null} animationType="fade" onRequestClose={() => { if (!busy) { setDeleting(null); setLeave(null); } }}>
      <View className="flex-1 items-center justify-center p-6" style={{ backgroundColor: "rgba(16,24,18,0.58)" }}><View className="w-full max-w-[430px] gap-4 rounded-3xl p-6" style={{ backgroundColor: colors.surface }}>
        <AppText accessibilityRole="header" className="text-xl font-semibold">{deleting ? "删除这个入口？" : "放弃未保存的修改？"}</AppText>
        <AppText className="text-sm leading-6">{deleting ? `“${deleting.name}”将从工具页移除，原网站不受影响。` : "离开后本次编辑内容将不会保存。"}</AppText>
        <AppButton iconName="close" label="取消" variant="secondary" disabled={busy} onPress={() => { setDeleting(null); setLeave(null); }} />
        <AppButton iconName={deleting ? "trash" : "close"} label={busy ? "处理中…" : deleting ? "确认删除" : "放弃修改"} variant="danger" disabled={busy} onPress={() => { if (deleting) void remove(); else { const next = leave; setLeave(null); setEditor(null); next?.(); } }} />
      </View></View>
    </Modal>
  </PortalScreen>;
}
