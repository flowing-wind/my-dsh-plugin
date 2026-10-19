# 全局 Web 部署

示例服务使用 `dsh` 账号、`/home/dsh/deepseek-harness/releases/0.2.1-rc.2` 版本目录、`/home/dsh/.dsh` 持久数据和 `/home/dsh/Projects` 工作区。部署到其他账号时统一修改示例路径和域名。

## 配套宿主

在官方固定提交应用根目录安装器并构建。构建需要匹配版本的 Node、pnpm 和 Linux 原生工具。可在 WSL 构建后上传匹配 CPU、libc 和 Node 的运行文件；服务器沿用自己的依赖安装。部署到独立版本目录，使用官方 `dsh web` 入口启动。

插件依赖来自远程仓库。`profile.json` 是全局 Web profile 示例，安装为 `$DSH_HOME/profiles/web/package.json`，在该目录执行 `pnpm install`。其中 Git 版本引用公开发行标签。官方 base、web、Agent Teams、自动审批和自定义插件市场使用官方实现。私有 `web.patch.yml` 保留现有模型、权限和登录配置；`web.patch.example.yml` 只提供字段示例。

使用官方 profile 的 `pnpm-workspace.yaml` 设置：`packages: ['.']`、`nodeLinker: hoisted`、`autoInstallPeers: false`。登录与文件管理所需部署配置包括 `DSH_HOME` 和 `DSH_WORKSPACE_ROOT`；私有配置也可直接指定工作区根目录和下载缓存目录。

## 登录与数据

页面登录摘要格式为 16 字节随机盐的十六进制与 64 字节 scrypt 摘要的十六进制，以冒号连接。私有配置权限为 600，密码、摘要、API Key 和 SSH 凭据由部署者保管。反向代理日志应隐藏 `pageToken` 参数。持久化会话、附件、工作区、凭据及 `agent.md` 在升级时保留；新版会话不能假定支持旧版读取。

永久删除文件只允许配置的工作区根目录的子目录，根目录本身不能删除。登录、永久删除和网页文件入口用于服务器环境，官方客户端安装通用插件和技能即可。

## 切换与验证

先备份当前配置和数据，在独立目录准备构建和远程 profile 安装；用官方会话列表检查活动任务。任务空闲后切换服务目录并重启，验证 HTTPS 登录、API 认证、文件编辑与下载、会话删除、300px 可拖动面板及 390px 手机布局，再清理本次部署临时文件。

外观使用官方浅色、深色及跟随系统，初次部署在设置中选择深色。全局技能由技能 bundle 提供，通过官方插件页面安装、启停和更新。Python 项目采用各自的 uv 虚拟环境，视频项目按任务安装 Remotion 或 HyperFrames 的运行依赖。
