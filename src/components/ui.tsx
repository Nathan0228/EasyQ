import { Link } from "expo-router";
import { Image, Platform, Pressable, ScrollView, TextInput, useWindowDimensions, View, type TextInputProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppIcon } from "@/components/app-icon";
import { AppText } from "@/components/app-text";
import { useApp } from "@/context/app-context";
import { copy } from "@/i18n/copy";

export function Screen({ children, inNativeTab = false, maxWidth = 650 }: { children: React.ReactNode; inNativeTab?: boolean; maxWidth?: number }) {
  const { colors } = useApp();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compactWebTab = inNativeTab && Platform.OS === "web" && width < 768;
  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: "center",
        paddingTop: inNativeTab && Platform.OS === "ios" ? 14 : Platform.OS === "web" ? 26 : insets.top + 14,
        paddingBottom: compactWebTab ? insets.bottom + 128 : inNativeTab && Platform.OS === "ios" ? 36 : insets.bottom + 36,
      }}
    >
      <View className="page-enter w-full px-5 sm:px-7" style={{ maxWidth }}>
        {children}
      </View>
    </ScrollView>
  );
}

export function BrandHeader({ right, showPreferences = true, subtitle }: { right?: React.ReactNode; showPreferences?: boolean; subtitle?: string }) {
  const { colors, language, theme, setLanguage, setTheme } = useApp();
  const t = copy[language];
  return (
    <View className="mb-8 flex-row items-center justify-between">
      <View className="flex-row items-center gap-2.5">
        <Image source={require("../../assets/images/easyq-logo-earth.png")} style={{ width: 44, height: 44, borderRadius: 16 }} />
        <View>
          {showPreferences ? <Link href="/" accessibilityLabel="EasyQ 首页"><AppText className="text-xl font-bold tracking-tight">EasyQ.</AppText></Link> : <AppText className="text-xl font-bold tracking-tight">EasyQ.</AppText>}
          <AppText className="text-[11px]" style={{ color: colors.secondary }}>{subtitle ?? t.localOnly}</AppText>
        </View>
      </View>
      {showPreferences && (
        <View className="flex-row items-center gap-2">
          {right}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={theme === "light" ? t.themeDark : t.themeLight}
            onPress={() => void setTheme(theme === "light" ? "dark" : "light")}
            className="ui-pressable h-10 w-10 items-center justify-center rounded-full active:opacity-80"
            style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
          >
            <AppIcon name={theme === "light" ? "moon" : "sun"} color={colors.text} size={19} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={language === "zh" ? "Switch to English" : "切换为中文"}
            onPress={() => void setLanguage(language === "zh" ? "en" : "zh")}
            className="ui-pressable h-10 min-w-10 items-center justify-center rounded-full px-2 active:opacity-80"
            style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
          >
            <AppText className="text-xs font-bold">{t.language}</AppText>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { colors } = useApp();
  return (
    <View className={`rounded-[28px] p-6 ${className}`} style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
      {children}
    </View>
  );
}

export function AppButton({ label, onPress, variant = "primary", disabled = false, icon }: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  const { colors } = useApp();
  const backgroundColor = variant === "primary" ? colors.accent : variant === "danger" ? colors.dangerButton : colors.surfaceSoft;
  const foregroundColor = variant === "primary" ? colors.accentText : variant === "danger" ? "#FFFFFF" : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className="ui-pressable min-h-[54px] flex-row items-center justify-center gap-2 rounded-2xl px-5 active:opacity-80"
      style={{ backgroundColor, opacity: disabled ? 0.55 : undefined }}
    >
      {icon}
      <AppText className="text-[15px] font-semibold" style={{ color: foregroundColor }}>{label}</AppText>
    </Pressable>
  );
}

export function AppInput({ multiline, style, ...props }: TextInputProps) {
  const { colors, language } = useApp();
  return (
    <TextInput
      {...props}
      multiline={multiline}
      placeholderTextColor={colors.secondary}
      selectionColor={colors.accent}
      className={`rounded-2xl px-4 py-3.5 text-base ${multiline ? "min-h-28" : "min-h-[54px]"}`}
      style={[{
        color: colors.text,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        textAlignVertical: multiline ? "top" : "center",
        fontFamily: Platform.select({ ios: language === "zh" ? "PingFang SC" : "Avenir Next", android: "sans-serif" }),
      }, style]}
    />
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  const { colors } = useApp();
  return <AppText className="mb-2.5 text-[13px] font-semibold" style={{ color: colors.secondary }}>{children}</AppText>;
}
