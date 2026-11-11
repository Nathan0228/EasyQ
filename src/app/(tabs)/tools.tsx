import { useFocusEffect, type Href } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { View } from "react-native";
import { AppText } from "@/components/app-text";
import { Eyebrow, Loading, Notice, PortalScreen } from "@/components/portal-ui";
import { ToolCard } from "@/components/tool-card";
import { useApp } from "@/context/app-context";
import { apiConfigured, blogAPI, cachedTools } from "@/lib/blog-api";
import type { ExternalTool } from "@/types/tool";

export default function Tools() {
  const { colors, language } = useApp();
  const zh = language === "zh";
  const [tools, setTools] = useState<ExternalTool[]>(() => cachedTools()?.tools ?? []);
  const [busy, setBusy] = useState(() => apiConfigured && !cachedTools());
  const [error, setError] = useState("");
  const requestID = useRef(0);
  const load = useCallback(async () => {
    if (!apiConfigured) return;
    const id = ++requestID.current;
    setBusy(!cachedTools()); setError("");
    try { const page = await blogAPI.tools(); if (id === requestID.current) setTools(page.tools); }
    catch (e) { if (id === requestID.current) setError(e instanceof Error ? e.message : "加载失败"); }
    finally { if (id === requestID.current) setBusy(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); return () => { requestID.current++; }; }, [load]));
  return <PortalScreen tabs>
    <View className="pb-9 pt-6">
      <Eyebrow>THE TOOLBOX</Eyebrow>
      <AppText accessibilityRole="header" className="text-[40px] font-semibold leading-[52px]">{zh ? "让日常，顺手一点。" : "Small tools, easier days."}</AppText>
      <AppText className="mt-5 text-base leading-7" style={{ color: colors.secondary }}>{zh ? "一些自己做的工具，也有值得收藏的网站。需要的时候，从这里出发。" : "Tools made here, and useful places elsewhere. Start here whenever you need a hand."}</AppText>
    </View>
    <View className="-mx-2 flex-row flex-wrap">
      <View className="mb-4 w-full px-2 sm:w-1/2"><ToolCard href="/ask" name={zh ? "安静提问" : "Quiet questions"} description={zh ? "写下问题，把手机递给对方。在需要安静的时候，也能好好交流。历史记录保存在当前设备。" : "Write a question and pass your phone. A quiet conversation, with history kept on your device."} /></View>
      {tools.map(tool => <View key={tool.id} className="mb-4 w-full px-2 sm:w-1/2"><ToolCard name={tool.name} description={tool.description} href={tool.url as Href} iconUrl={tool.iconUrl} external /></View>)}
    </View>
    {busy && <Loading />}
    {Boolean(error) && <Notice message={tools.length ? (zh ? "更新失败，正在显示已缓存的工具列表，请稍后重试。" : "Could not refresh. Showing the saved tools; please try again later.") : (zh ? "站外工具暂时无法加载，安静提问仍可使用。" : "External tools are unavailable. Quiet questions still works.")} retry={() => void load()} />}
    <AppText className="mt-6 text-xs leading-5" style={{ color: colors.secondary }}>{zh ? "站外网站会在新标签页打开。更多工具将陆续加入。" : "External websites open in a new tab. More tools are on the way."}</AppText>
  </PortalScreen>;
}
