# my-dsh-plugin

DeepSeek Harness 云端网页扩展，适配官方 **0.2.1-rc.2**，固定提交 [`687f282e8625c6b8d11ff58211a90524be2e4317`](https://github.com/deepseek-ai/deepseek-harness/commit/687f282e8625c6b8d11ff58211a90524be2e4317)。提供背景外观、手机布局、网页文件操作、页面登录和个性化设置。

## 功能

| 插件 | 功能 |
|---|---|
| `glass-skin` | 默认原生深色、春物、Whiteout 和浏览器本地图片；壁纸面板不透明度可调；侧栏使用官方完整 Logo |
| `mobile-layout` | 手机导航、全宽面板和横向滚动的设置分类 |
| `account-balance` | 查询当前 API Key 的余额，链接到官方用量及充值页面 |
| `workspace-download` | 文件下载、文件夹 ZIP 打包，较大压缩包下载前确认 |
| `workspace-editor` | 网页内 UTF-8 文本编辑，保存前检查文件版本 |
| `workspace-pages` | 在新标签页预览 PDF、文件和隔离的静态 HTML 页面 |
| `workspace-management` | 永久删除会话；工作区注销、文件删除与会话删除分别确认 |
| `interactive-results` | 表格、柱状图、向当前会话提交的表单 |
| `page-login` | 单密码入口，每次刷新或打开新页面重新验证，保护 HTTP API 和实时连接 |
| `personal-instructions` | 设置中维护共享个性化说明，默认保存到服务账号 `~/.dsh/agent.md` |

自动化任务、模型配置、插件管理、会话归档和菜单使用官方实现。用量总览、Token 估算账本及网络统计不在加载清单中；升级保留数据目录中的既有记录。

文件交付卡片使用官方实现。下载、文本编辑和新标签页预览从右侧文件栏及预览标签进入。右侧栏默认宽度为 300px，比左侧栏最小宽度 264px 稍宽，支持拖动调整。

背景偏好保存在当前浏览器。首次访问使用原生界面，已有壁纸和本地图片偏好继续生效；选择“默认 · 原生深色”恢复官方深色界面。自定义图片仅在浏览器压缩并存入 IndexedDB，动画图片取单帧，不上传服务器。自带壁纸为部署者提供的资源，再分发时需确认使用权。

## 官方能力与云端适配

[官方 0.2.1-rc.2](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.1-rc.2) 支持 Flash-1017，模型 ID 仍为 `deepseek-flash`。在“插件 → 网页搜索”打开“启用新版 Web 搜索 API”可使用内置 DeepSeek Search/Fetch API；搜索服务的权限和计费由 DeepSeek 决定。

官方账号登录使用 HTTP loopback 回调，公网 HTTPS 反向代理地址不满足该登录方式的要求。云端使用模型 API Key，`account-balance` 只查询余额；充值与账单在官方平台完成。账号登录流程及其可用性以官方实现为准。

Harness 原生加载全局 `~/.dsh/skills/<名称>/SKILL.md` 和项目 `.agents/skills/<名称>/SKILL.md`，并读取全局及项目 `AGENTS.md`。Ponytail、UI UX Pro Max 等文件型 skill 可以按这个目录安装；带 Codex 专用工具的指令需要对应工具。Remotion skill 还需要工作区中的 Remotion、Node 和浏览器依赖。技能文件本身不需要另写 Cordis 插件，新增宿主工具或页面才需要插件。`personal-instructions` 与原生 `AGENTS.md` 分别加载。

## 安装

本仓库包含 **10 个插件及匹配官方源码的兼容补丁**。独立 `.tgz` 包也依赖该补丁，不能直接用于其他官方版本。补丁提供页面认证、永久删除、文件操作插槽、手机布局标记及紧凑的右侧栏默认宽度，并保留官方主体界面。

需要 Linux、Node 24 和上游固定的 pnpm 11.28.5，以及官方原生扩展的构建工具。

```bash
git clone https://github.com/deepseek-ai/deepseek-harness.git ~/deepseek-harness
git -C ~/deepseek-harness checkout 687f282e8625c6b8d11ff58211a90524be2e4317
node ~/my-dsh-plugin/install.mjs ~/deepseek-harness
cd ~/deepseek-harness
pnpm install
pnpm run build:artifacts
```

安装脚本先核对提交并检查补丁，再复制源码及测试并应用补丁。构建后将 [Web profile](deploy/profile.json) 的路径改为实际源码目录，安装为 `$DSH_HOME/profiles/web/package.json`，在该目录执行 `pnpm install`。通过 `dsh web --patch <私有部署配置>` 启动。各插件可在官方插件页面启停；源码兼容接口随构建保留。

## 目录与部署

- `plugins/`：插件源码、配置层及中英文说明。
- `patches/harness.patch`：固定上游版本的兼容补丁，包含对应调用方和测试调整。
- `extras/`：补丁新增的认证和会话删除测试。
- `dist/`：构建后的插件包与 SHA-256 清单。
- `upstream.json`：官方版本、提交和加载插件清单。
- `deploy/`：systemd、Apache、Web profile 和部署配置示例，参见[部署说明](deploy/README.md)。

升级前备份 `$DSH_HOME`、私有配置和个性化文件，并停止运行中的任务。数据备份包含凭据，应按私密文件保管。本仓库只包含公开源码和配置示例。

## 验证

WSL Linux 下受影响包构建通过，76 项官方文件交付界面测试、94 项布局测试、21 项文档快速检查和 43 项文档同步检查通过。已在干净的官方固定提交验证安装器及兼容补丁，并核对 10 个发行包的 SHA-256。云端网页验证右侧栏 300px 默认宽度、拖动与收起再展开、文件下载、ZIP、文本编辑、新标签页中文预览及 390px 手机布局。demo 工作区的三个真实对话验证 Ponytail、UI-UX Pro Max 检索和 Remotion MP4 渲染，个性化文件校验和保持一致。验证范围不包含完整 CI 或其他操作系统矩阵。
