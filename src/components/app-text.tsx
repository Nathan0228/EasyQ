import { Platform, Text, type TextProps } from "react-native";

import { useApp } from "@/context/app-context";

type Props = TextProps & { className?: string };

export function AppText({ style, className, ...props }: Props) {
  const { language, colors } = useApp();
  const fontFamily = Platform.select({
    ios: language === "zh" ? "PingFang SC" : "Avenir Next",
    android: language === "zh" ? "sans-serif" : "sans-serif",
    web: language === "zh"
      ? '"PingFang SC", "Microsoft YaHei", system-ui, sans-serif'
      : '"Avenir Next", Inter, system-ui, sans-serif',
  });

  return (
    <Text
      {...props}
      className={className}
      style={[{ color: colors.text, fontFamily }, style]}
    />
  );
}
