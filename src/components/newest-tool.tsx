import { Link, useFocusEffect, type Href } from "expo-router";
import { useCallback, useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { AppText } from "@/components/app-text";
import { Eyebrow } from "@/components/portal-ui";
import { useApp } from "@/context/app-context";
import { apiConfigured, blogAPI, cachedTools } from "@/lib/blog-api";
import { internalTools } from "@/lib/internal-tools";
import type { ExternalTool } from "@/types/tool";

type ToolPreview = {
  name: string;
  description: string;
  href: Href;
  createdAt: string;
  external?: boolean;
};

export function NewestTool() {
  const { colors, language } = useApp();
  const [tools, setTools] = useState<ExternalTool[]>(() => cachedTools()?.tools ?? []);

  useFocusEffect(useCallback(() => {
    if (!apiConfigured) return;
    let focused = true;
    void blogAPI.tools().then(result => {
      if (focused) setTools(result.tools);
    }).catch(() => { /* The local tools and any cached tools are still available. */ });
    return () => { focused = false; };
  }, []));

  const builtIn = Object.values(internalTools).map(tool => ({
    ...tool[language], href: tool.href, createdAt: tool.createdAt,
  }));
  const candidates: ToolPreview[] = [
    ...builtIn,
    ...tools.filter(tool => /^https?:\/\//.test(tool.url)).map(tool => ({
      name: tool.name, description: tool.description, href: tool.url as Href, createdAt: tool.createdAt, external: true,
    })),
  ];
  const newest = candidates.reduce((latest, tool) =>
    Date.parse(tool.createdAt) >= Date.parse(latest.createdAt) ? tool : latest,
  );
  const external = newest.external && Platform.OS === "web";
  const hrefAttrs = external ? { target: "_blank", rel: "noopener noreferrer" } as const : undefined;

  return (
    <View className="mb-9">
      <Eyebrow>NEWEST TOOLS</Eyebrow>
      <Link href={newest.href} target={hrefAttrs?.target} rel={hrefAttrs?.rel} asChild>
        <Pressable
          {...(hrefAttrs ? { hrefAttrs } : {})}
          accessibilityRole="link"
          accessibilityHint={external ? (language === "zh" ? "在新标签页打开" : "Opens in a new tab") : undefined}
          className="editorial-row ui-pressable gap-2 border-b pb-5"
          style={{ borderColor: colors.border }}
        >
          <AppText className="text-xl font-semibold leading-7">{newest.name}</AppText>
          <AppText className="text-sm leading-6" style={{ color: colors.secondary }}>{newest.description}</AppText>
        </Pressable>
      </Link>
    </View>
  );
}
