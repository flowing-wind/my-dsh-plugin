# Flowing Wind Harness 插件

为 DeepSeek Harness 提供通用工具、全局技能和服务器网页功能。所有发行包适配官方 **0.2.1-rc.2**，源码固定为 [687f282e8625c6b8d11ff58211a90524be2e4317](https://github.com/deepseek-ai/deepseek-harness/commit/687f282e8625c6b8d11ff58211a90524be2e4317)。每个插件都可以从同一仓库单独安装、启停和更新。

## 安装与更新

推荐在官方插件页启用“自定义插件市场”，添加下面的索引地址，再在“发现”中按需安装。如果还没有“发现”页，在“添加插件”中先安装官方包 `@deepseek-ai/dsh-experimental-plugin-market-bundle@0.2.1-rc.2`。

```text
https://raw.githubusercontent.com/flowing-wind/my-dsh-plugin/main/market/index.json
```

索引采用官方 format 1，将每个版本固定到完整 Git 提交和包子目录。仓库首页代表整个源码集合；在“添加插件”中安装单个插件时，需要使用完整子目录地址。例如：

```text
git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.4&path:/dist/plugins/skills-remotion
```

详细步骤、每个插件的完整安装地址和升级方式见[安装说明](INSTALL.md)。插件保存在当前用户的全局 Harness profile，对该 profile 打开的所有工作区生效。Web 与 Desktop 分别管理 profile。Git 缓存和安装后的依赖是正常运行所需文件，后续更新源仍是远程仓库。

<a id="plugins"></a>
## 插件索引

“官方宿主”适用于匹配版本的官方 Web 和 Desktop。“配套宿主”需要先应用本仓库固定版本的兼容补丁，主要用于自托管服务器和 WSL Web。官方桌面客户端安装“官方宿主”插件。

| 插件目录 | 功能 | 宿主 |
|---|---|---|
| `account-balance` | API Key 余额 | 官方宿主 |
| `compact-layout` | 紧凑右侧面板与官方标识 | 官方宿主 |
| `interactive-results` | 交互表格、图表与表单 | 官方宿主 |
| `mobile-layout` | 手机导航与触控布局 | 配套宿主 |
| `page-login` | 服务器页面登录 | 配套宿主 |
| `personal-instructions` | 全局个性化说明 | 官方宿主 |
| `skills-diagram-design` | Diagram Design 图表设计 | 官方宿主 |
| `skills-hyperframes` | HyperFrames HTML 视频工作流 | 官方宿主 |
| `skills-no-negative-echo` | No Negative Echo 交付检查 | 官方宿主 |
| `skills-ponytail` | Ponytail 开发与审阅 | 官方宿主 |
| `skills-remotion` | Remotion 视频创作与渲染 | 官方宿主 |
| `skills-ui-ux-pro-max` | UI/UX 设计与检索 | 官方宿主 |
| `wolfram` | Wolfram 计算与知识 | 官方宿主 |
| `workspace-download` | 文件下载与 ZIP | 配套宿主 |
| `workspace-editor` | 工作区文本编辑 | 配套宿主 |
| `workspace-management` | 会话与工作区管理 | 配套宿主 |
| `workspace-pages` | 文件与网页预览 | 配套宿主 |

工作区插件提供文件下载与 ZIP、UTF-8 编辑及版本冲突检查、新标签页预览，以及分别确认的会话永久删除、工作区注销和文件删除。登录插件保护网页、HTTP API 与实时连接。手机布局提供触控导航、全宽面板与设置分类布局；紧凑布局设置右面板初始宽度为 300px，支持拖动和收起后保持。个性化说明默认保存在 `~/.dsh/agent.md`。交互结果支持表格搜索、柱状图和明确提交的表单。

外观沿用官方浅色、深色和跟随系统选项，部署时可在设置中选择深色。自动化任务、模型配置、会话归档和插件管理使用 Harness 官方实现。

## 全局技能与 Wolfram

技能包调用官方 `@deepseek-ai/dsh-skill-filesystem` 加载包内 `SKILL.md` 和资源，安装、启停和更新直接使用官方插件管理器。每个包的 `SOURCE.json` 和 [skill-sources.json](skill-sources.json) 固定原始仓库及提交，并保留相应许可证。Remotion 包含 12 项技能，HyperFrames 包含 21 项技能，Ponytail 包含 6 项技能；Ponytail 的 Codex 专用 hook 由 Codex 原生插件管理。

Remotion 与 HyperFrames 的运行库、浏览器及项目依赖在使用时安装到视频项目。UI/UX 检索脚本使用 Python 标准库；Python 项目使用项目自己的 uv 虚拟环境。Diagram Design 的品牌设置按技能说明在具体项目中选择。

Wolfram 包配置 Harness 官方 MCP 客户端，连接 `https://agenttools.wolfram.com/mcp`，服务由 Wolfram 提供。Codex 可继续使用已有 Wolfram 连接器。

## 宿主适配与维护

紧凑布局通过官方插槽共享当前版本的根布局状态，并复用官方侧栏标识，适用于官方 Web 和 Desktop。配套补丁提供手机布局区域标记、服务器认证、永久删除和文件操作入口；具体功能由独立插件贡献。每个发行包使用精确的 `engines.dsh` 兼容声明，升级 Harness 时先核对接口并重新构建验证，再发布新版本。

维护源码位于 `plugins/`，独立运行包位于 `dist/plugins/`。发行包依赖官方发布版本，安装后使用远程提交。配套宿主构建和服务器配置见[部署说明](deploy/README.md)，发布步骤见[维护说明](MAINTAINING.md)。

## 验证范围

发行检查包含官方索引解析、独立包入口、远程依赖声明，以及受影响的布局、认证和会话删除测试。部署时继续验证登录、文件操作、手机布局及官方插件管理器的 Git 子目录安装。完整 CI 与其他 Harness 版本需另行验证。

Remotion 技能在首次启用时通过 Git 获取官方固定提交，缓存于用户 Harness 数据目录；后续加载复用该版本。运行此插件需要 Git。
