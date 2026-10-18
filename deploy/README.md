# 云端部署

示例服务使用 `dsh` 账号，版本目录 `/home/dsh/deepseek-harness/releases/0.2.1-rc.2`，持久数据 `/home/dsh/.dsh`，工作区 `/home/dsh/Projects`。部署到其他账号时统一修改路径和域名。

`profile.json` 注册 10 个扩展及官方 base、web 和 Agent Teams bundle，安装为 `$DSH_HOME/profiles/web/package.json` 后在该目录执行 `pnpm install`。`web.patch.example.yml` 保留默认模型、权限、页面登录及个性化配置；配置摘要须从私有文件或环境提供。服务通过官方 `dsh web` profile 启动，只监听 127.0.0.1:3080，Apache 提供 HTTPS。

首次工作区使用官方 `workspace-controller.documentsDirectory`，示例设置在 `/home/dsh/Projects` 下。永久删除文件仅允许 `DSH_WORKSPACE_ROOT` 的子目录，删除根目录本身会被拒绝。“插件 → 网页搜索”中的开关选择官方 Search/Fetch API，也可切回 Messages 搜索方式。

## 密码与数据

页面密码摘要格式为 `16 字节随机盐的十六进制:64 字节 scrypt 摘要的十六进制`，使用 Node `crypto.scrypt` 默认参数。私有配置权限应为 600。密码、摘要、API Key、SSH 凭据和私人 `agent.md` 保存在服务器。反向代理日志不得记录 `pageToken` 查询参数。

升级保留登录摘要、模型凭据、会话、附件、全局 skills、工作区及 `agent.md`。个性化插件仍从配置的路径读取内容；原生全局和项目 `AGENTS.md` 继续生效。服务器保留当前版本目录、持久数据和用户工作区；备份与旧版源码的保留期限由部署者决定。较新版本写入的会话不能假定支持旧版读取。

## 构建与切换

可在 WSL Linux 构建后上传源码、各包 `lib/`、`apps/web/dist/` 和匹配的 Linux 原生扩展。源码工作区执行 `pnpm install --ignore-scripts --frozen-lockfile` 安装完整依赖，再运行 `node packages/subprocess/subprocess-local/scripts/ensure-spawn-helper.mjs` 恢复伪终端 helper 的执行权限。Linux 依赖与原生扩展应匹配服务器的 CPU、libc 和 Node；Windows 依赖不能直接复制。

先将新版本放入独立目录，确认无运行任务，再更新服务的 `WorkingDirectory` 并重启。验证 HTTPS 登录、模型、背景、文件操作及手机界面后，按部署者要求清理安装包和临时目录。`apache.conf` 是独立 VirtualHost 示例，应保留服务器其他站点。

## 运行环境

`dsh.service` 使用无 sudo 权限的账号、`NoNewPrivileges`、home 写入限制和内存上限。PATH 保留共享 Python 虚拟环境 `/home/dsh/.local/python`；uv 可通过该解释器安装共享库。工作区外的库安装仍受 Harness 权限审批限制。

约 3.5 GiB 内存的服务器采用 `MemoryHigh=1800M`、`MemoryMax=2304M`、`TasksMax=1024`，CPU 不设配额。内存软限制会触发回收，硬限制可能终止超限任务；Remotion 示例采用单路渲染。

全局 pnpm 为 12.14.0，Harness 源码继续使用 `packageManager` 固定的 11.28.5。pnpm 自身升级使用 `pnpm self-update`，应在源码目录外执行，以免修改项目版本声明。

示例不设置 `ProtectKernelTunables` 和 `ProtectKernelModules`，当前主机上相关 `/proc` 挂载限制会影响 bubblewrap。服务内存上限可能中止大型编译任务；完整构建在其他 Linux 环境完成，服务器负责运行依赖和服务验证。

## 全局技能

原生技能安装在 `/home/dsh/.dsh/skills`，适用于所有工作区。Ponytail 5.3.2 和 UI-UX Pro Max 使用文件型技能；UI-UX 的脚本路径应指向云端技能目录，Python 检索只需标准库。Remotion 使用官方 `remotion-dev/skills` 技能集 4.0.536，包含 `remotion-best-practices`、创建、预览和渲染等入口。

`demo/remotion-demo` 是可运行的示例项目，安装匹配版本的 `remotion`、`@remotion/cli`、React、TypeScript 和 Chrome Headless Shell，`pnpm-workspace.yaml` 仅允许 esbuild 的依赖构建脚本。进入项目运行 `pnpm run render` 生成 `out/demo.mp4`。技能安装独立于个人说明文件和 Cordis 插件配置。
