import { Link, type Href } from "expo-router";
import { Pressable } from "react-native";
import { AppIcon, type IconName } from "@/components/app-icon";
import { AppText } from "@/components/app-text";
import { useApp } from "@/context/app-context";

type TextLinkProps = {
  href: Href;
  label: string;
  iconName?: IconName;
  current?: boolean;
};

export function TextLink({ href, label, iconName, current }: TextLinkProps) {
  const { colors } = useApp();
  const color = iconName && !current ? colors.text : colors.accent;
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="link"
        aria-current={current ? "page" : undefined}
        className={iconName
          ? "feature-card ui-pressable min-h-11 flex-row items-center gap-2.5 rounded-lg px-3"
          : "ui-pressable min-h-11 justify-center"}
        style={current ? { backgroundColor: colors.surfaceSoft } : undefined}
      >
        {iconName && <AppIcon name={iconName} size={16} color={color} />}
        <AppText className="text-sm font-medium" style={{ color }}>{label}</AppText>
      </Pressable>
    </Link>
  );
}
