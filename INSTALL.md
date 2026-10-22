# 安装插件

在官方插件页中添加[仓库索引](https://raw.githubusercontent.com/flowing-wind/my-dsh-plugin/main/market/index.json)，即可浏览每个插件的说明、版本及兼容范围。服务器管理员先确认配套宿主已构建，再安装服务器功能。Windows 官方客户端可安装通用工具和全部技能包。

## 在另一台客户端上安装

1. 安装 Harness `0.2.1-rc.2`，打开侧栏“插件”。如果没有“发现”页，点击“添加插件”，输入 `@deepseek-ai/dsh-experimental-plugin-market-bundle@0.2.1-rc.2` 并安装，按界面提示重启。
2. 在“发现”中打开“添加索引源”或“管理索引源…”，添加 `https://raw.githubusercontent.com/flowing-wind/my-dsh-plugin/main/market/index.json` 并刷新。
3. 选择标记“官方宿主”的插件，查看说明并分别安装。六个 `skills-*` 包提供全局技能，Wolfram 提供 MCP 工具，通用功能包提供余额、个性化说明和交互结果；紧凑布局包为 Web 和桌面端提供 300px 初始右栏宽度及官方侧栏标识；工作区管理 `1.0.5` 同时支持 Windows 客户端和 Linux Web。按界面提示完成重启。

也可以跳过市场，在“添加插件”中粘贴下表任一完整地址。仓库根目录是多个插件的源码集合，安装单个插件需要保留地址中的 `&path:/dist/plugins/...`。每台机器的安装操作在该机器的当前用户下执行一次，技能即可供该 profile 的全部工作区使用。

## 在“添加插件”中单独安装

复制所需插件的完整地址。`plugins-v1.0.4` 与 `workspace-management-v1.0.5` 为各包的发行标签，索引内部使用不可变的完整提交。所有包声明适配 Harness `0.2.1-rc.2`。

| 插件 | 可粘贴的安装地址 |
|---|---|
| API Key 余额 | `git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.4&path:/dist/plugins/account-balance` |
| 紧凑右侧面板 | `git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.4&path:/dist/plugins/compact-layout` |
| 交互表格、图表与表单 | `git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.4&path:/dist/plugins/interactive-results` |
| 手机导航与触控布局 | `git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.4&path:/dist/plugins/mobile-layout` |
| 服务器页面登录 | `git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.4&path:/dist/plugins/page-login` |
| 全局个性化说明 | `git+https://github.com/flowing-wind/my-dsh-plugin.git#personal-instructions-v1.0.5&path:/dist/plugins/personal-instructions` |
| Diagram Design 图表设计 | `git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.4&path:/dist/plugins/skills-diagram-design` |
| HyperFrames HTML 视频工作流 | `git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.4&path:/dist/plugins/skills-hyperframes` |
| No Negative Echo 交付检查 | `git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.4&path:/dist/plugins/skills-no-negative-echo` |
| Ponytail 开发与审阅 | `git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.4&path:/dist/plugins/skills-ponytail` |
| Remotion 视频创作与渲染 | `git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.4&path:/dist/plugins/skills-remotion` |
| UI/UX 设计与检索 | `git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.4&path:/dist/plugins/skills-ui-ux-pro-max` |
| Wolfram 计算与知识 | `git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.4&path:/dist/plugins/wolfram` |
| 文件下载与 ZIP | `git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.4&path:/dist/plugins/workspace-download` |
| 工作区文本编辑 | `git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.4&path:/dist/plugins/workspace-editor` |
| 会话与工作区管理 | `git+https://github.com/flowing-wind/my-dsh-plugin.git#workspace-management-v1.0.5&path:/dist/plugins/workspace-management` |
| 文件与网页预览 | `git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.4&path:/dist/plugins/workspace-pages` |

## Web 命令行安装

命令作用于当前用户的全局 `web` profile，完成后在所有工作区生效。桌面 profile 由桌面应用管理，使用桌面插件页安装。

```bash
dsh plugin --profile web add 'git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.4&path:/dist/plugins/skills-remotion'
dsh web
```

## 更新与卸载

发布插件时同步增加包版本并更新索引。打开或刷新“发现”后，官方市场会比较已安装版本并显示“可更新”；GitHub 上新增提交本身不会替换已安装的包。

工作区管理升级包含会话与持久化提供方，请先等待正在运行的任务结束，再安装并重启。服务器保留原有 `DSH_WORKSPACE_ROOT`；Windows 标准客户端无需填写此项。文件或文件夹删除使用当前用户权限，通常不需要管理员；受保护、只读或被占用的文件可能使操作失败，已经删除的文件不会自动恢复。

Harness `0.2.1-rc.2` 对这些第三方包使用“先卸载，再安装新版”的流程：记录插件配置，等待相关任务结束，在“已安装”卸载该插件，然后从“发现”选择兼容版本安装，按提示重启。按需安装的官方插件使用官方“更新”按钮。持久数据和项目文件按各插件说明保留。

固定标签用于复现，持续更新使用索引中的新版本。配套宿主插件升级前先更新对应宿主补丁。安装会在全局 profile 中保留依赖和 Git 缓存，应用运行依赖这些文件。
