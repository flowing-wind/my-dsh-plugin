# 安装插件

在官方插件页中添加[仓库索引](https://raw.githubusercontent.com/flowing-wind/my-dsh-plugin/main/market/index.json)，即可浏览每个插件的说明、版本及兼容范围。服务器管理员先确认配套宿主已构建，再安装服务器功能。Windows 官方客户端可安装通用工具和全部技能包。

## 在“添加插件”中单独安装

复制所需插件的完整地址。`plugins-v1.0.1` 为发行标签，索引内部使用不可变的完整提交。所有包声明适配 Harness `0.2.1-rc.2`。

| 插件 | 可粘贴的安装地址 |
|---|---|
| API Key 余额 | `git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.1&path:/dist/plugins/account-balance` |
| 紧凑右侧面板 | `git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.1&path:/dist/plugins/compact-layout` |
| 交互表格、图表与表单 | `git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.1&path:/dist/plugins/interactive-results` |
| 手机导航与触控布局 | `git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.1&path:/dist/plugins/mobile-layout` |
| 服务器页面登录 | `git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.1&path:/dist/plugins/page-login` |
| 全局个性化说明 | `git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.1&path:/dist/plugins/personal-instructions` |
| Diagram Design 图表设计 | `git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.1&path:/dist/plugins/skills-diagram-design` |
| HyperFrames HTML 视频工作流 | `git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.1&path:/dist/plugins/skills-hyperframes` |
| No Negative Echo 交付检查 | `git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.1&path:/dist/plugins/skills-no-negative-echo` |
| Ponytail 开发与审阅 | `git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.1&path:/dist/plugins/skills-ponytail` |
| Remotion 视频创作与渲染 | `git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.1&path:/dist/plugins/skills-remotion` |
| UI/UX 设计与检索 | `git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.1&path:/dist/plugins/skills-ui-ux-pro-max` |
| Wolfram 计算与知识 | `git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.1&path:/dist/plugins/wolfram` |
| 文件下载与 ZIP | `git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.1&path:/dist/plugins/workspace-download` |
| 工作区文本编辑 | `git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.1&path:/dist/plugins/workspace-editor` |
| 会话与工作区管理 | `git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.1&path:/dist/plugins/workspace-management` |
| 文件与网页预览 | `git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.1&path:/dist/plugins/workspace-pages` |

## Web 命令行安装

命令作用于当前用户的全局 `web` profile，完成后在所有工作区生效。桌面 profile 由桌面应用管理，使用桌面插件页安装。

```bash
dsh plugin --profile web add 'git+https://github.com/flowing-wind/my-dsh-plugin.git#plugins-v1.0.1&path:/dist/plugins/skills-remotion'
dsh web
```

## 更新与卸载

在官方插件页更新索引并选择兼容版本。若当前 Harness 界面对第三方包只提供卸载与重新安装，先记录插件配置，再卸载并使用新版索引安装；持久数据和项目文件按各插件说明保留。固定标签用于复现，持续更新使用索引中的新版本。配套宿主插件升级前先更新对应宿主补丁。安装会在全局 profile 中保留依赖和 Git 缓存，应用运行依赖这些文件。
