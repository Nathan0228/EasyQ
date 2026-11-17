import MailIcon from "@/assets/svg/easyq/mail.svg";
import GithubIcon from "@/assets/svg/social/github.svg";
import { AppText } from "@/components/app-text";
import { TextLink } from "@/components/text-link";
import { AppButton, BrandHeader, Screen, type ScreenScrollProps } from "@/components/ui";
import { useApp } from "@/context/app-context";
import { prefetchArticle } from "@/lib/blog-api";
import { decorativeSvgProps } from "@/lib/decorative-svg";
import type { BlogPost } from "@/types/blog";
import { Link, type Href } from "expo-router";
import { ActivityIndicator, Pressable, View } from "react-native";

export { TextLink };

export function PortalScreen({
  children,
  tabs = false,
  backToTop = false,
  scrollRef,
  onScroll,
  onContentSizeChange,
  onLayout,
}: {
  children: React.ReactNode;
  tabs?: boolean;
  backToTop?: boolean;
} & ScreenScrollProps) {
  const { colors, language } = useApp();
  return (
    <Screen inNativeTab={tabs} maxWidth={780} backToTop={backToTop} scrollRef={scrollRef} onScroll={onScroll} onContentSizeChange={onContentSizeChange} onLayout={onLayout}>
      <BrandHeader showSubtitle={false} />
      {children}
      <View
        className="mt-16 flex-row flex-wrap items-center justify-between gap-3 border-t pt-6"
        style={{ borderColor: colors.border }}
      >
        <AppText className="text-xs" style={{ color: colors.secondary }}>
          EasyQ · {new Date().getFullYear()}
        </AppText>
        <View className="flex-row flex-wrap items-center gap-x-5">
          <View className="flex-row items-center gap-5">
            <TextLink href="/" label={language === "zh" ? "首页" : "Home"} />
            <TextLink
              href="/tools"
              label={language === "zh" ? "工具" : "Tools"}
            />
            <TextLink
              href="/admin"
              label={language === "zh" ? "管理" : "Admin"}
            />
          </View>
          <View className="flex-row items-center">
            <FooterIconLink
              href="https://github.com/Nathan0228/EasyQ"
              label="GitHub"
            >
              <GithubIcon
                width={18}
                height={18}
                color={colors.text}
                {...decorativeSvgProps}
              />
            </FooterIconLink>
            <FooterIconLink
              href="mailto:chenmoliang2022@outlook.com"
              label={language === "zh" ? "发送电子邮件" : "Send an email"}
            >
              <MailIcon
                width={19}
                height={19}
                color={colors.text}
                {...decorativeSvgProps}
              />
            </FooterIconLink>
          </View>
        </View>
      </View>
    </Screen>
  );
}

function FooterIconLink({
  href,
  label,
  children,
}: {
  href: Href;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={label}
        className="ui-pressable h-11 w-11 items-center justify-center"
      >
        {children}
      </Pressable>
    </Link>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  const { colors } = useApp();
  return (
    <AppText
      className="mb-4 text-xs font-semibold tracking-[2px]"
      style={{ color: colors.secondary }}
    >
      {children}
    </AppText>
  );
}
export function Notice({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  const { colors } = useApp();
  return (
    <View
      className="my-6 rounded-2xl p-5"
      style={{ backgroundColor: colors.surfaceSoft }}
    >
      <AppText accessibilityLiveRegion="polite" className="text-sm leading-6">
        {message}
      </AppText>
      {retry && (
        <View className="mt-3 self-start">
          <AppButton
            compact
            iconName="refresh"
            label="重试 / Retry"
            variant="secondary"
            onPress={retry}
          />
        </View>
      )}
    </View>
  );
}
export function Loading() {
  const { colors } = useApp();
  return <ActivityIndicator className="my-10" color={colors.accent} />;
}
export function PostRow({
  post,
  admin = false,
}: {
  post: BlogPost;
  admin?: boolean;
}) {
  const { colors, language } = useApp();
  const date = new Date(post.publishedAt || post.updatedAt).toLocaleDateString(
    language === "zh" ? "zh-CN" : "en-US",
    { year: "numeric", month: "short", day: "numeric" },
  );
  return (
    <Link
      href={
        admin
          ? { pathname: "/admin/editor", params: { id: post.id } }
          : { pathname: "/blog/[slug]", params: { slug: post.slug } }
      }
      asChild
    >
      <Pressable
        onHoverIn={() => {
          if (!admin) prefetchArticle(post.slug);
        }}
        onPressIn={() => {
          if (!admin) prefetchArticle(post.slug);
        }}
        className="editorial-row ui-pressable border-b py-7"
        style={{ borderColor: colors.border }}
      >
        <View className="mb-3 flex-row flex-wrap gap-3">
          <AppText className="text-xs" style={{ color: colors.secondary }}>
            {date}
          </AppText>
          {Boolean(post.category) && (
            <AppText className="text-xs" style={{ color: colors.accent }}>
              {post.category}
            </AppText>
          )}
          {admin && (
            <AppText className="text-xs" style={{ color: colors.accent }}>
              {post.status === "published"
                ? "已发布 / Published"
                : "草稿 / Draft"}
            </AppText>
          )}
        </View>
        <View className="flex-row items-center gap-5">
          <AppText
            accessibilityRole="header"
            className="flex-1 text-[23px] font-semibold leading-8"
          >
            {post.title}
          </AppText>
          <AppText style={{ color: colors.secondary }}>↗</AppText>
        </View>
        {Boolean(post.excerpt) && (
          <AppText
            numberOfLines={2}
            className="mt-3 text-sm leading-6"
            style={{ color: colors.secondary }}
          >
            {post.excerpt}
          </AppText>
        )}
      </Pressable>
    </Link>
  );
}
