import { AppText } from "@/components/app-text";
import { InternalToolsCarousel, internalToolCount } from "@/components/internal-tools-carousel";
import { Loading, Notice, PortalScreen } from "@/components/portal-ui";
import { ExternalToolCard } from "@/components/tool-card";
import { useApp } from "@/context/app-context";
import { apiConfigured, blogAPI, cachedTools } from "@/lib/blog-api";
import type { ExternalTool } from "@/types/tool";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { View } from "react-native";

function ToolSectionTitle({ title, count }: { title: string; count?: number }) {
  const { colors } = useApp();
  return (
    <View className="flex-row items-start gap-1.5">
      <AppText
        accessibilityRole="header"
        accessibilityLabel={count === undefined ? title : `${title} ${count}`}
        className="text-lg font-semibold"
      >
        {title}
      </AppText>
      {count !== undefined && (
        <AppText aria-hidden className="text-xs font-semibold leading-4" style={{ color: colors.accent }}>{count}</AppText>
      )}
    </View>
  );
}

export default function Tools() {
  const { colors, language } = useApp();
  const zh = language === "zh";
  const [tools, setTools] = useState<ExternalTool[]>(
    () => cachedTools()?.tools ?? [],
  );
  const [busy, setBusy] = useState(() => apiConfigured && !cachedTools());
  const [error, setError] = useState("");
  const requestID = useRef(0);
  const load = useCallback(async () => {
    if (!apiConfigured) return;
    const id = ++requestID.current;
    setBusy(!cachedTools());
    setError("");
    try {
      const page = await blogAPI.tools();
      if (id === requestID.current) setTools(page.tools);
    } catch (e) {
      if (id === requestID.current)
        setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      if (id === requestID.current) setBusy(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        requestID.current++;
      };
    }, [load]),
  );
  return (
    <PortalScreen tabs>
      <AppText
        accessibilityRole="header"
        className="mb-8 mt-6 text-[38px] font-semibold leading-[48px]"
      >
        {zh ? "工具箱" : "Toolbox"}
      </AppText>
      <View className="mb-3">
        <ToolSectionTitle title={zh ? "站内工具" : "EasyQ tools"} count={internalToolCount} />
      </View>
      <InternalToolsCarousel />
      <View className="mb-4 mt-9 flex-row items-center gap-4">
        <ToolSectionTitle
          title={zh ? "站外工具" : "External tools"}
          count={tools.length > 0 || (!busy && !error) ? tools.length : undefined}
        />
        <View
          className="h-px flex-1"
          style={{ backgroundColor: colors.border }}
        />
      </View>
      <View className="-mx-2 flex-row flex-wrap">
        {tools.map((tool) => (
          <View key={tool.id} className="mb-4 w-full px-2 sm:w-1/2">
            <ExternalToolCard tool={tool} />
          </View>
        ))}
      </View>
      {busy && <Loading />}
      {Boolean(error) && (
        <Notice
          message={
            tools.length
              ? zh
                ? "更新失败，正在显示已缓存的工具列表，请稍后重试。"
                : "Could not refresh. Showing the saved tools; please try again later."
              : zh
                ? "站外工具暂时无法加载，站内工具仍可使用。"
                : "External tools are unavailable. EasyQ tools are still available."
          }
          retry={() => void load()}
        />
      )}
      {!busy && !error && tools.length === 0 && (
        <AppText className="py-3 text-sm" style={{ color: colors.secondary }}>
          {zh ? "暂无站外工具。" : "No external tools yet."}
        </AppText>
      )}
    </PortalScreen>
  );
}
