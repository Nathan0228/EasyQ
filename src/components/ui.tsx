import { Link } from "expo-router";
import { Image, Platform, Pressable, ScrollView, TextInput, useWindowDimensions, View, type TextInputProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppIcon, type IconName } from "@/components/app-icon";
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

type BrandHeaderProps = { right?: React.ReactNode; showPreferences?: boolean; subtitle?: string };

// Web keeps the shared brand/preferences in SiteFrame. Page-specific actions
// (history access, locking history) remain in the page toolbar.
export function BrandHeader(props: BrandHeaderProps) {
  if (Platform.OS === "web") {
    return props.showPreferences !== false && props.right
      ? <View className="mb-6 flex-row justify-end">{props.right}</View>
      : null;
  }
  return <BrandHeaderContent {...props} />;
}

export function BrandHeaderContent({ right, showPreferences = true, subtitle, compact = false }: BrandHeaderProps & { compact?: boolean }) {
  const { colors, language, theme, setLanguage, setTheme } = useApp();
  const t = copy[language];
  return (
    <View className={`${compact ? "" : "mb-8 "}flex-row items-center justify-between gap-3`}>
      <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
        <Image source={require("../../assets/images/easyq-logo-earth.png")} style={{ width: 44, height: 44, borderRadius: 16 }} />
        <View className="min-w-0 flex-1">
          {showPreferences ? <Link href="/" accessibilityLabel="EasyQ 首页"><AppText className="text-xl font-bold tracking-tight">EasyQ.</AppText></Link> : <AppText className="text-xl font-bold tracking-tight">EasyQ.</AppText>}
          <AppText numberOfLines={1} className="text-[11px]" style={{ color: colors.secondary }}>{subtitle ?? t.localOnly}</AppText>
        </View>
      </View>
      {showPreferences && (
        <View className="shrink-0 flex-row items-center gap-2">
          {right}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={theme === "light" ? t.themeDark : t.themeLight}
            onPress={() => void setTheme(theme === "light" ? "dark" : "light")}
            className={`glass-button glass-button--${theme} ui-pressable h-11 w-11 items-center justify-center rounded-xl`}
            style={{ borderWidth: 1, ...(Platform.OS === "web" ? {} : { backgroundColor: colors.surface, borderColor: colors.border }) }}
          >
            <AppIcon name={theme === "light" ? "moon" : "sun"} color={colors.text} size={19} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={language === "zh" ? "Switch to English" : "切换为中文"}
            onPress={() => void setLanguage(language === "zh" ? "en" : "zh")}
            className={`glass-button glass-button--${theme} ui-pressable h-11 min-w-11 items-center justify-center rounded-xl px-2`}
            style={{ borderWidth: 1, ...(Platform.OS === "web" ? {} : { backgroundColor: colors.surface, borderColor: colors.border }) }}
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

export function AppButton({ label, onPress, variant = "primary", disabled = false, icon, iconName, compact = false }: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  icon?: React.ReactNode;
  iconName?: IconName;
  compact?: boolean;
}) {
  const { colors, theme } = useApp();
  const foregroundColor = variant === "danger" ? (theme === "dark" ? colors.danger : colors.dangerButton) : variant === "primary" ? colors.accent : colors.text;
  const backgroundColor = variant === "danger" ? (theme === "dark" ? "rgba(158,64,57,0.2)" : "rgba(167,62,56,0.08)") : theme === "dark" ? "rgba(65,79,68,0.65)" : "rgba(255,254,250,0.7)";
  const resolvedIcon = iconName ?? (variant === "danger" ? "trash" : undefined);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`glass-button glass-button--${theme} glass-button--${variant} ui-pressable flex-row items-center justify-center gap-2 px-4 py-2.5`}
      style={{ minHeight: compact ? 44 : 48, borderRadius: 12, borderWidth: 1, opacity: disabled ? 0.42 : 1, ...(Platform.OS === "web" ? {} : { backgroundColor, borderColor: colors.border }) }}
    >
      {icon ?? (resolvedIcon ? <AppIcon name={resolvedIcon} color={foregroundColor} size={17} /> : null)}
      <AppText className="shrink text-center text-[14px] font-medium leading-5" style={{ color: foregroundColor }}>{label}</AppText>
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
