import ArrowIcon from "@/assets/svg/easyq/arrow.svg";
import BookIcon from "@/assets/svg/easyq/book.svg";
import CheckIcon from "@/assets/svg/easyq/check.svg";
import CloseIcon from "@/assets/svg/easyq/close.svg";
import DownloadIcon from "@/assets/svg/easyq/download.svg";
import HistoryIcon from "@/assets/svg/easyq/history.svg";
import HomeIcon from "@/assets/svg/easyq/home.svg";
import LockIcon from "@/assets/svg/easyq/lock.svg";
import MessageIcon from "@/assets/svg/easyq/message.svg";
import MoonIcon from "@/assets/svg/easyq/moon.svg";
import SunIcon from "@/assets/svg/easyq/sun.svg";
import ToolsIcon from "@/assets/svg/easyq/tools.svg";
import TrashIcon from "@/assets/svg/easyq/trash.svg";
import UploadIcon from "@/assets/svg/easyq/upload.svg";
import EditIcon from "@/assets/svg/easyq/edit.svg";
import EyeIcon from "@/assets/svg/easyq/eye.svg";
import LogoutIcon from "@/assets/svg/easyq/logout.svg";
import PlusIcon from "@/assets/svg/easyq/plus.svg";
import RefreshIcon from "@/assets/svg/easyq/refresh.svg";
import SaveIcon from "@/assets/svg/easyq/save.svg";
import ShareIcon from "@/assets/svg/easyq/share.svg";

const icons = {
  edit: EditIcon,
  eye: EyeIcon,
  logout: LogoutIcon,
  plus: PlusIcon,
  refresh: RefreshIcon,
  save: SaveIcon,
  share: ShareIcon,
  arrow: ArrowIcon,
  book: BookIcon,
  check: CheckIcon,
  close: CloseIcon,
  download: DownloadIcon,
  history: HistoryIcon,
  home: HomeIcon,
  lock: LockIcon,
  message: MessageIcon,
  moon: MoonIcon,
  sun: SunIcon,
  tools: ToolsIcon,
  trash: TrashIcon,
  upload: UploadIcon,
};

export type IconName = keyof typeof icons;

export function AppIcon({ name, size = 20, color = "currentColor" }: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const Icon = icons[name];
  return <Icon width={size} height={size} color={color} accessible={false} focusable={false} />;
}
