# EasyQ

EasyQ 是一款适合安静场合使用的轻量问答应用。提问者写好问题后，把手机交给对方；对方只看见当前问题，可以点选「是／否」或输入文字回答。提交后，页面展示当前问题与答案，提问者看完可自行关闭结果页。历史记录仍需密码查看。

项目使用 Expo Router、React Native 和 NativeWind，优先设计 iPhone 屏幕，同时支持 Android 与网页。网页可以从 iPhone Safari 添加到主屏幕。整个应用不需要账号、后端或数据库服务。

## 设计原则

- **问题优先：** 交接页面只突出当前问题和回答控件，减少分心内容。
- **快速交接：** 「是／否」只需点一下；提交后直接显示问题与答案，结果页由用户主动关闭。
- **本地管理：** 问题、备注、创建时间、答案和回答时间都存储在当前设备。网页使用 `localStorage`，原生应用使用 AsyncStorage。
- **避免误看：** 历史页需要密码。首次使用时设置本地密码，也可以在构建时配置密码。
- **可迁移：** 历史页支持 JSON 备份导出和导入；导入时按问题 ID 合并，不覆盖已有记录。
- **可读性：** 简洁的 iOS 风格布局、中英文切换、浅色／深色模式与系统字体。

## 开始使用

要求 Node.js 22.13 或更新版本。

```bash
npm install
npx expo start
```

在 Expo 终端按 `w` 打开网页，或运行 `npx expo start --web`。第一次进入应用时先设置至少 4 位的历史密码，再创建问题。创建后会进入适合交给对方的回答页；对方提交后可把手机交还提问者查看问题与答案，提问者自行关闭结果页。历史、备份及删除功能在密码解锁后可用。

开发检查：

```bash
npm run lint
npm run typecheck
npm run build:web
```

## 密码与隐私边界

部署时可设置环境变量 `EXPO_PUBLIC_HISTORY_PASSWORD`。未设置时，应用会在首次使用时让用户创建本地密码。参考 [.env.example](./.env.example)。设置或改变部署密码后需要重新构建。

**这是防止交接手机时误看历史的界面门槛，不是加密。** Expo 会把 `EXPO_PUBLIC_` 变量写入客户端代码，浏览器中的本地记录也能被拥有设备访问权的人查看。不要把敏感问题或真正的密钥存入此应用。如果需要抵御设备持有人查看数据，必须增加加密及更强的密钥管理设计。

数据不会在设备之间自动同步。清除浏览器网站数据或卸载应用可能丢失记录；请定期从历史页导出备份。备份 JSON 本身也包含明文问题和答案，请妥善保存。

## 部署到 Cloudflare Pages

项目使用 Expo 单页网页导出，以便 `/question/...` 等客户端路由在 Cloudflare Pages 上工作。构建产物在 `dist/`。

1. 在 Cloudflare Pages 中连接项目仓库。
2. 构建命令设为 `npm run build:web`，输出目录设为 `dist`。
3. 如果要统一使用部署密码，在 Pages 的构建环境变量中设置 `EXPO_PUBLIC_HISTORY_PASSWORD`，然后重新部署。这个值会出现在客户端代码中。
4. 部署完成后，在 iPhone Safari 打开 HTTPS 地址，使用分享菜单里的「添加到主屏幕」。

Pages 在没有顶层 `404.html` 时会自动为单页应用回退到根页面。本项目没有添加服务工作线程；添加到主屏幕不代表离线可用。

## 项目结构

```text
src/app/               Expo Router 页面
src/components/        通用界面组件
src/context/           本地状态、语言和主题
src/i18n/              中英文文案
src/lib/               存储、备份和交互工具
src/types/             问题与备份数据类型
assets/images/         EasyQ 标志
public/                网页主屏幕图标和 PWA 元数据
```

EasyQ 原标志由 ChatGPT Image 生成；松绿与暖棕配色版本保存在 `assets/images/easyq-logo-earth.png`。
