# EasyQ

EasyQ 是一个个人门户网站，首页介绍网站特点并展示最新三篇已发布博客，工具页集中提供可扩展的功能入口。

- `/`：网站介绍与最新三篇博客。
- `/tools`：工具入口页，包含安静提问和管理员添加的站外网站。
- `/blog`：按发布时间倒序展示的文章时间线，左侧垂直线串联文章，支持按年、月折叠及全部展开／折叠。日期分组统一使用 UTC+8；加载更多会合并到已有月份并保留折叠状态，数量表示当前已加载文章。
- `/blog/[slug]`：文章阅读。
  文章底部提供上一篇（较早发布）和下一篇（较新发布），相同发布时间按 ID 稳定排序。推荐阅读使用现有分类字段作为标签，展示同分类最新的最多三篇已发布文章，排除当前文章；未设置分类时不推荐其他分类内容。
- `/admin`：单管理员写作台，支持 Markdown 编辑、预览、草稿、发布、更新和撤回。管理员凭据仅在后端配置。
- `/admin/tools`：使用同一管理员登录，新增、编辑或删除站外入口的名称、介绍、网址和图标。保存即公开，删除需二次确认。
- `/ask`：原有本地问答功能；`/history`：密码保护的本地历史。

博客后端使用 Go + MariaDB，部署到现有 VPS Docker Compose 网络，详见 [部署说明](server/DEPLOY.md)。前端使用 Cloudflare 静态资源托管，当前 Workers 项目采用根目录的 `wrangler.jsonc`。复制根目录 `.env.example` 中的公开 API 配置到构建环境即可连接服务。

项目使用 Expo Router、React Native 和 NativeWind，优先适配手机，同时支持 Android、iOS 与网页。问答功能仍独立保存在设备上，无需账号；博客公开阅读无需登录，写作发布由独立后端验证身份。

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

在 Expo 终端按 `w` 打开网页，或运行 `npx expo start --web`。从“工具”进入“安静提问”后，首次使用需设置至少 4 位的历史密码，再创建问题。创建后会进入适合交给对方的回答页；对方提交后可把手机交还提问者查看问题与答案，提问者自行关闭结果页。历史记录从提问页进入，历史、备份及删除功能在密码解锁后可用。主导航仅保留首页、博客和工具。

站内工具直接进入对应页面；站外入口使用完整 HTTP(S) 地址，在网页中以 `target="_blank"` 和 `rel="noopener noreferrer"` 打开，原生应用交给系统浏览器。图标使用公开 HTTPS 图片地址，留空或加载失败时显示网站首字。工具信息保存在 MariaDB 的 `easyq_tools` 表；已有部署需按 [升级步骤](server/DEPLOY.md#工具入口功能升级) 建表并更新 API，再部署前端。

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

## 部署到 Cloudflare

项目使用 Expo 单页网页导出，以便 `/question/...` 等客户端路由在 Cloudflare Pages 上工作。构建产物在 `dist/`。

Cloudflare Pages 运行的是网页版本，即使在 iPhone Safari 中打开也不会运行原生 iOS 组件。手机网页的底部导航使用 CSS 毛玻璃效果；原生 iOS 应用的底栏由系统绘制。修改网页代码后，需要将新提交推送到 Pages 连接的分支并等待重新部署；手动上传项目时则需重新上传最新的 `dist/`。

当前 Workers 项目的设置：

1. 构建命令：`npm run build:web`。
2. 部署命令：`npx wrangler deploy --config wrangler.jsonc`。
3. 提交时包含 `cloudflare/worker.mjs` 与 `wrangler.jsonc`；不能只上传 `dist/`，否则没有 API 代理。
4. `wrangler.jsonc` 的 `API_ORIGIN` 配置真实 Go 后端，当前为 `https://easyq-api.findingai.top`。无需在前端写数据库口令或管理员密码。
5. 若设置了 `EXPO_PUBLIC_API_MODE=direct`，删除该覆盖并重新构建。原有 `EXPO_PUBLIC_API_URL` 可以保留，默认生产网页会使用同源代理；本地 Expo 开发和原生端仍用该地址直连。

网页的博客、工具与管理员接口统一请求当前网站的 `/api/...`，由 Worker 转发到固定后端。代理保留方法、查询参数、JSON 正文、Bearer 令牌及后端状态码，返回 `Cache-Control: no-store`。代理不转发浏览器 Cookie，也不会跟随后端跳转。首次切换后重新登录管理员以验证会话。

部署后先在 Safari 直接打开 `https://easyq.findingai.top/api/posts?limit=1`，应得到含 `posts` 的 JSON；响应头 `X-EasyQ-API: same-origin` 表示代理生效。若出现 HTML 或 404，说明 Worker 未随前端部署；若为 JSON 502/504，则检查 Worker 到 Go 的连接。浏览器网络面板中的 API 请求应只指向网站主域名。

Expo 的 `web.output: "single"` 只生成一个 `index.html`，`/blog` 和 `/blog/文章-slug` 由客户端路由处理。刷新或分享链接时，Cloudflare 必须返回入口页，保持请求 URL 不变，之后由 Expo Router 加载对应文章。将路径用 301/302 跳转到首页会丢失文章地址。

当前使用 `wrangler deploy` 部署的是 **Workers 静态资源项目**。根目录 `wrangler.jsonc` 是默认配置文件，其中 `assets.directory` 指向 `dist`，`assets.not_found_handling` 设置为 `single-page-application`。Cloudflare 中构建命令设为 `npm run build:web`，部署命令设为 `npx wrangler deploy --config wrangler.jsonc`（默认的 `npx wrangler deploy` 也会读取此文件）。原来的 `wrangler.workers.jsonc` 已重命名；若控制台部署命令还引用旧文件名，需要同步修改。配置不包含自定义构建步骤，不会在部署阶段重复构建。已有 Worker 名称不是 `easyq` 时，先改为现有名称；保留现有自定义域名绑定。

不要重新添加指向 `/index.html` 的 `/*` 或 `/blog/*` 重写规则：Workers 的 HTML 规范化可能将它们判为循环，导致部署失败。原生 SPA 回退已覆盖 `/blog`、文章、工具、后台和问答详情路径，并正常提供实际存在的 JS、CSS、图片资源。

如果实际创建的是 **Pages 项目**，构建命令仍为 `npm run build:web`、输出目录 `dist`，并设置 `EXPO_PUBLIC_API_MODE=direct` 和 `EXPO_PUBLIC_API_URL` 后重新构建；本仓库的 Worker 代理不会由 Pages 自动部署。没有顶层 `404.html` 时，Pages 默认提供 SPA 回退，无需 `_redirects`。相关说明：[Workers SPA](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/)、[Pages SPA](https://developers.cloudflare.com/pages/configuration/serving-pages/#single-page-application-spa-rendering)。

修改后需要重新部署前端；只更新 VPS 的 Go 服务无法修复网页路径的 404。部署后在新标签页直接打开 `/blog` 和一篇已发布文章的 `/blog/实际-slug`，刷新后应仍显示对应页面，地址不变。草稿不能公开分享；管理员会话在当前浏览器标签页的 sessionStorage 中保存，刷新会恢复登录；沿用后端返回的 12 小时有效期，不会因刷新续期。退出登录、过期或 API 返回 401 会清除当前会话。关闭标签页后通常需要重新登录；原生端仍仅保存在内存中。本项目没有添加服务工作线程；添加到主屏幕不代表离线可用。

## 项目结构

公开站外工具列表在当前应用会话内缓存 30 秒，合并并发请求，切回工具页时直接复用有效缓存。管理员添加、编辑或删除成功后清除当前会话缓存；“重新加载”会强制请求最新数据。其他访客的缓存最多保留 30 秒，刷新整个网页会清空内存缓存。

公开博客列表按分页参数在当前应用会话内缓存 30 秒（最多 20 页），同时合并并发请求。首页与博客列表共用首批 12 篇摘要，首页仍只展示最新 3 篇；从文章返回时，缓存有效期内保留已经加载的分页。管理员保存、发布或撤回后会清除当前会话的列表缓存，其他访客的缓存最多保留 30 秒。未缓存的首次访问仍需等待后端网络响应。

文章阅读会在当前应用会话内缓存正文及推荐结果 60 秒，各保留最多 20 条；不会写入浏览器持久存储。相同请求并发时合并，悬停或按下文章入口会预取正文，正文和推荐并行加载。重新聚焦文章时不再先清空正文。管理员保存、发布或撤回成功后清除当前应用的阅读缓存；其他访客最多在缓存有效期内看到旧版本。

界面图标存放于 `assets/svg/easyq/`，社交平台图标存放于 `assets/svg/social/`。通过 `AppIcon` / `SocialIcon` 引用本地 SVG，支持主题颜色和尺寸；来源、许可证及使用示例见 [SVG 图标说明](assets/svg/README.md)。修改 Metro 的 SVG 配置后，请使用 `npx expo start --clear` 重启开发服务。

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
