# 本地 SVG 图标

- `easyq/`：14 个界面图标，统一使用 SVG Repo 收录的 [Feather Icons](https://www.svgrepo.com/collection/feather-icons/)，MIT 授权，作者 Cole Bemis。完整许可见 [easyq/LICENSE.txt](easyq/LICENSE.txt)。
- `social/`：14 个常见社交平台图标，包括 GitHub、微信、QQ、Telegram、Discord、YouTube、Instagram、Facebook、LinkedIn、Twitter、TikTok、WhatsApp、Reddit 和 Medium。来源及品牌许可见 [social/LICENSE.md](social/LICENSE.md)。

SVG Repo 下载端点本次返回 HTTP 429 / Vercel 验证页，因此资源从公开的 [nyuuzyou/svgrepo 镜像数据集](https://huggingface.co/datasets/nyuuzyou/svgrepo)提取。原站详情页、原下载地址、镜像地址、许可证元数据及修改前后 SHA-256 均记录在 [sources.json](sources.json)，没有将验证页面作为 SVG 保存。镜像中的许可信息与原作者许可一并保留。

所有文件保留原始 `viewBox="0 0 24 24"` 和图形数据。仅将默认宽高设为 24、黑色描边或填充（含 QQ 的近黑色 `#040000`）改成 `currentColor`、移除 Feather CSS 类并添加结尾换行。图标随应用打包，运行时不向 SVG Repo 或镜像请求资源。

## 使用

```tsx
import { AppIcon } from "@/components/app-icon";
import { SocialIcon } from "@/components/social-icon";

<AppIcon name="home" size={20} color={colors.text} />
<SocialIcon name="github" size={24} color={colors.text} />
```

组件默认作为装饰图标，由外层按钮或链接提供无障碍名称。`size` 按比例缩放图形和线宽，`color` 可直接传入现有主题颜色。社交图标不自动创建账号链接。

也可以直接导入单个 SVG，避免引入整个映射：

```tsx
import GithubIcon from "@/assets/svg/social/github.svg";

<GithubIcon width={24} height={24} color={colors.text} />
```

Metro 使用 `react-native-svg-transformer/expo` 将文件转换为 `react-native-svg` 组件，支持 Web、iOS 和 Android，并保留 NativeWind 配置。首次切换此配置需重启开发服务：`npx expo start --clear`。

如果 `AppIcon` 报错 `Element type is invalid ... got: object`，请先停止原来的 Expo 服务（终端按 `Ctrl+C`），再执行上述命令，并刷新浏览器。旧服务可能仍将 `.svg` 导出为含 `uri` 的图片资源对象，而不是 React 组件；修改 `metro.config.js` 后仅热刷新页面不会加载新配置。不要保留旧服务并在另一个端口启动后继续访问旧端口。

新增图标时，把实际 SVG 放入对应目录，保留来源与许可证记录，再在对应组件的映射中注册名称。界面图标优先从同一 Feather 集合选择，以保持视觉一致。
