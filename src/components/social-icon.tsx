import DiscordIcon from "@/assets/svg/social/discord.svg";
import FacebookIcon from "@/assets/svg/social/facebook.svg";
import GithubIcon from "@/assets/svg/social/github.svg";
import InstagramIcon from "@/assets/svg/social/instagram.svg";
import LinkedinIcon from "@/assets/svg/social/linkedin.svg";
import MediumIcon from "@/assets/svg/social/medium.svg";
import QqIcon from "@/assets/svg/social/qq.svg";
import RedditIcon from "@/assets/svg/social/reddit.svg";
import TelegramIcon from "@/assets/svg/social/telegram.svg";
import TiktokIcon from "@/assets/svg/social/tiktok.svg";
import TwitterIcon from "@/assets/svg/social/twitter.svg";
import WechatIcon from "@/assets/svg/social/wechat.svg";
import WhatsappIcon from "@/assets/svg/social/whatsapp.svg";
import YoutubeIcon from "@/assets/svg/social/youtube.svg";

const icons = {
  github: GithubIcon,
  wechat: WechatIcon,
  qq: QqIcon,
  telegram: TelegramIcon,
  discord: DiscordIcon,
  youtube: YoutubeIcon,
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  linkedin: LinkedinIcon,
  twitter: TwitterIcon,
  tiktok: TiktokIcon,
  whatsapp: WhatsappIcon,
  reddit: RedditIcon,
  medium: MediumIcon,
};

export type SocialIconName = keyof typeof icons;

// The containing link or button supplies its accessible label.
export function SocialIcon({ name, size = 20, color = "currentColor" }: {
  name: SocialIconName;
  size?: number;
  color?: string;
}) {
  const Icon = icons[name];
  return <Icon width={size} height={size} color={color} accessible={false} focusable={false} />;
}
