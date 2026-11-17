import { Link, usePathname } from "expo-router";
import { useEffect, useRef, useState, type ComponentRef, type RefObject } from "react";
import {
  AccessibilityInfo,
  Image,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  useWindowDimensions,
  View,
  type ScrollViewProps,
  type TextInputProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppIcon, type IconName } from "@/components/app-icon";
import { AppText } from "@/components/app-text";
import { TextLink } from "@/components/text-link";
import { useApp } from "@/context/app-context";
import { copy } from "@/i18n/copy";

const mobileBreakpoint = 768;
const headerControlGap = 8;

export type ScreenScrollProps = Pick<ScrollViewProps, "onScroll" | "onContentSizeChange" | "onLayout"> & {
  scrollRef?: RefObject<ComponentRef<typeof ScrollView> | null>;
};

export function Screen({
  children,
  inNativeTab = false,
  maxWidth = 650,
  backToTop = false,
  scrollRef,
  onScroll,
  onContentSizeChange,
  onLayout,
}: {
  children: React.ReactNode;
  inNativeTab?: boolean;
  maxWidth?: number;
  backToTop?: boolean;
} & ScreenScrollProps) {
  const { colors, language, theme } = useApp();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const internalScrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const activeScrollRef = scrollRef ?? internalScrollRef;
  const [showTop, setShowTop] = useState(false);
  const compactWebTab =
    inNativeTab && Platform.OS === "web" && width < mobileBreakpoint;
  async function scrollToTop() {
    const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled().catch(
      () => true,
    );
    activeScrollRef.current?.scrollTo({ y: 0, animated: !reduceMotion });
  }
  const content = (
    <ScrollView
      ref={activeScrollRef}
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      keyboardShouldPersistTaps="handled"
      onScroll={backToTop || onScroll ? (event) => {
        if (backToTop) setShowTop(event.nativeEvent.contentOffset.y > 320);
        onScroll?.(event);
      } : undefined}
      onContentSizeChange={onContentSizeChange}
      onLayout={onLayout}
      scrollEventThrottle={64}
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: "center",
        paddingTop:
          inNativeTab && Platform.OS === "ios"
            ? 14
            : Platform.OS === "web"
              ? 26
              : insets.top + 14,
        paddingBottom:
          (compactWebTab
            ? insets.bottom + 128
            : inNativeTab && Platform.OS === "ios"
              ? 36
              : insets.bottom + 36) + (backToTop ? 44 : 0),
      }}
    >
      <View className="page-enter w-full px-5 sm:px-7" style={{ maxWidth }}>
        {children}
      </View>
    </ScrollView>
  );
  if (!backToTop) return content;
  return (
    <View className="min-h-0 flex-1">
      {content}
      {showTop && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            language === "zh" ? "返回文章顶部" : "Back to article top"
          }
          onPress={() => void scrollToTop()}
          className={`glass-button glass-button--${theme} ui-pressable absolute h-11 w-11 items-center justify-center rounded-xl border`}
          style={{
            right: Math.max(20, (width - maxWidth) / 2 + 20),
            bottom: insets.bottom + (compactWebTab ? 100 : 20),
            ...(Platform.OS === "web"
              ? {}
              : {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }),
          }}
        >
          <View
            pointerEvents="none"
            style={{ transform: [{ rotate: "90deg" }] }}
          >
            <AppIcon name="arrow" size={20} color={colors.text} />
          </View>
        </Pressable>
      )}
    </View>
  );
}

type BrandHeaderProps = {
  right?: React.ReactNode;
  showPreferences?: boolean;
  showSubtitle?: boolean;
};

const headerLinks = [
  { href: "/blog", icon: "book", zh: "博客", en: "Blog" },
  { href: "/tools", icon: "tools", zh: "工具", en: "Tools" },
  { href: "/admin", icon: "lock", zh: "管理", en: "Admin" },
] as const;

// Web keeps the shared brand/preferences in SiteFrame. Page-specific actions
// (history access, locking history) remain in the page toolbar.
export function BrandHeader(props: BrandHeaderProps) {
  if (Platform.OS === "web") {
    return props.showPreferences !== false && props.right ? (
      <View className="mb-6 flex-row justify-end">{props.right}</View>
    ) : null;
  }
  return <BrandHeaderContent {...props} />;
}

export function BrandHeaderContent({
  right,
  showPreferences = true,
  showSubtitle = true,
  compact = false,
}: BrandHeaderProps & { compact?: boolean }) {
  const { colors, language, theme, setLanguage, setTheme } = useApp();
  const t = copy[language];
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const showMenu = showPreferences && width >= mobileBreakpoint;
  const web = Platform.OS === "web";
  const [menu, setMenu] = useState({ pathname, open: false });
  const [trailingControlsWidth, setTrailingControlsWidth] = useState(0);
  const menuButton = useRef<ComponentRef<typeof Pressable>>(null);
  const menuOpen = showMenu && menu.pathname === pathname && menu.open;
  if (menu.pathname !== pathname || (menu.open && !showMenu)) {
    setMenu({ pathname, open: false });
  }

  useEffect(() => {
    if (!menuOpen || Platform.OS !== "web" || typeof document === "undefined")
      return;

    function closeOutside(event: Event) {
      if (
        event.target instanceof Element &&
        !event.target.closest(".brand-menu-trigger, .brand-menu-panel")
      ) {
        setMenu({ pathname, open: false });
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenu({ pathname, open: false });
        menuButton.current?.focus();
      }
    }

    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("focusin", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("focusin", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen, pathname]);

  const menuPanel = menuOpen && (
    <View
      accessibilityRole="navigation"
      accessibilityLabel={language === "zh" ? "网站导航" : "Site navigation"}
      className={`brand-menu-panel z-10 mt-2 min-w-24 gap-1 rounded-xl border p-1.5 ${web ? "absolute left-1/2 top-full w-max -translate-x-1/2" : "self-end"}`}
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        marginRight: web ? undefined : trailingControlsWidth + headerControlGap,
      }}
    >
      {headerLinks.map(({ href, icon, ...labels }) => (
        <TextLink
          key={href}
          href={href}
          label={labels[language]}
          iconName={icon}
          current={pathname === href || pathname.startsWith(`${href}/`)}
        />
      ))}
    </View>
  );

  return (
    <View className={compact ? "relative" : "relative mb-8"}>
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
          <Image
            source={require("../../public/melogo.png")}
            resizeMode="contain"
            style={{
              width: 44,
              height: 44,
              borderRadius: 16,
              tintColor: theme === "dark" ? colors.text : undefined,
            }}
          />
          <View className="min-w-0 flex-1">
            {showPreferences ? (
              <Link href="/" accessibilityLabel="EasyQ 首页">
                <AppText className="text-xl font-bold tracking-tight">
                  EasyQ.
                </AppText>
              </Link>
            ) : (
              <AppText className="text-xl font-bold tracking-tight">
                EasyQ.
              </AppText>
            )}
            {showSubtitle && (
              <AppText
                numberOfLines={1}
                className="text-[11px]"
                style={{ color: colors.secondary }}
              >
                {t.localOnly}
              </AppText>
            )}
          </View>
        </View>
        {showPreferences && (
          <View
            className="shrink-0 flex-row items-center"
            style={{ gap: headerControlGap }}
          >
            {right}
            {showMenu && (
              <View className="relative">
                <Pressable
                  ref={menuButton}
                  accessibilityRole="button"
                  accessibilityLabel={
                    language === "zh" ? "网站导航" : "Site navigation"
                  }
                  accessibilityState={{ expanded: menuOpen }}
                  onPress={() => setMenu({ pathname, open: !menuOpen })}
                  className={`brand-menu-trigger glass-button glass-button--${theme} ui-pressable h-11 w-11 items-center justify-center rounded-xl`}
                  style={{
                    borderWidth: 1,
                    ...(web
                      ? {}
                      : {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        }),
                  }}
                >
                  <AppIcon name="more" color={colors.text} size={21} />
                </Pressable>
                {web && menuPanel}
              </View>
            )}
            <View
              className="shrink-0 flex-row items-center"
              style={{ gap: headerControlGap }}
              onLayout={
                !web && showMenu
                  ? (event) => setTrailingControlsWidth(event.nativeEvent.layout.width)
                  : undefined
              }
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  theme === "light" ? t.themeDark : t.themeLight
                }
                onPress={() =>
                  void setTheme(theme === "light" ? "dark" : "light")
                }
                className={`glass-button glass-button--${theme} ui-pressable h-11 w-11 items-center justify-center rounded-xl`}
                style={{
                  borderWidth: 1,
                  ...(Platform.OS === "web"
                    ? {}
                    : {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      }),
                }}
              >
                <AppIcon
                  name={theme === "light" ? "moon" : "sun"}
                  color={colors.text}
                  size={19}
                />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  language === "zh" ? "Switch to English" : "切换为中文"
                }
                onPress={() => void setLanguage(language === "zh" ? "en" : "zh")}
                className={`glass-button glass-button--${theme} ui-pressable h-11 min-w-11 items-center justify-center rounded-xl px-2`}
                style={{
                  borderWidth: 1,
                  ...(Platform.OS === "web"
                    ? {}
                    : {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      }),
                }}
              >
                <AppText className="text-xs font-bold">{t.language}</AppText>
              </Pressable>
            </View>
          </View>
        )}
      </View>
      {!web && menuPanel}
    </View>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { colors } = useApp();
  return (
    <View
      className={`rounded-[28px] p-6 ${className}`}
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {children}
    </View>
  );
}

export function AppButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  icon,
  iconName,
  compact = false,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  icon?: React.ReactNode;
  iconName?: IconName;
  compact?: boolean;
}) {
  const { colors, theme } = useApp();
  const foregroundColor =
    variant === "danger"
      ? theme === "dark"
        ? colors.danger
        : colors.dangerButton
      : variant === "primary"
        ? colors.accent
        : colors.text;
  const backgroundColor =
    variant === "danger"
      ? theme === "dark"
        ? "rgba(158,64,57,0.2)"
        : "rgba(167,62,56,0.08)"
      : theme === "dark"
        ? "rgba(65,79,68,0.65)"
        : "rgba(255,254,250,0.7)";
  const resolvedIcon = iconName ?? (variant === "danger" ? "trash" : undefined);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`glass-button glass-button--${theme} glass-button--${variant} ui-pressable flex-row items-center justify-center gap-2 px-4 py-2.5`}
      style={{
        minHeight: compact ? 44 : 48,
        borderRadius: 12,
        borderWidth: 1,
        opacity: disabled ? 0.42 : 1,
        ...(Platform.OS === "web"
          ? {}
          : { backgroundColor, borderColor: colors.border }),
      }}
    >
      {icon ??
        (resolvedIcon ? (
          <AppIcon name={resolvedIcon} color={foregroundColor} size={17} />
        ) : null)}
      <AppText
        className="shrink text-center text-[14px] font-medium leading-5"
        style={{ color: foregroundColor }}
      >
        {label}
      </AppText>
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
      style={[
        {
          color: colors.text,
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
          textAlignVertical: multiline ? "top" : "center",
          fontFamily: Platform.select({
            ios: language === "zh" ? "PingFang SC" : "Avenir Next",
            android: "sans-serif",
          }),
        },
        style,
      ]}
    />
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  const { colors } = useApp();
  return (
    <AppText
      className="mb-2.5 text-[13px] font-semibold"
      style={{ color: colors.secondary }}
    >
      {children}
    </AppText>
  );
}
