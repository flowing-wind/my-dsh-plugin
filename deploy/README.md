# 云端部署配置

本目录记录已部署实例的配置结构。`dsh.service` 使用无 sudo 权限的 dsh 账号，代码位于 `/home/dsh/deepseek-harness`，数据位于 `/home/dsh/.dsh`，项目位于 `/home/dsh/Projects`。部署到其他账号时统一修改路径和域名。

## 组成

- `profile.json`：Web profile 的包链接和 13 个 bundle 加载顺序，安装为数据目录下 `profiles/web/package.json`，在该目录运行 `pnpm install`。
- `web.patch.example.yml`：部署配置，不包含实际密码摘要。`DSH_PAGE_PASSWORD_HASH` 必须由私有环境文件提供；运行中的实例使用权限 600 的私有配置文件。
- `dsh.service`：只监听 127.0.0.1:3080，由 Apache 对外提供 HTTPS。systemd 将写入范围限制为 `/home/dsh`，限制运行内存，禁止提权；这些限制只作用于此服务及其子进程，不是整个 SSH 账号的沙盒。
- `apache.conf`：单独域名的 HTTP 跳转、ACME 校验和 HTTPS 反代。证书必须先通过 webroot 模式签发。不要覆盖其他 VirtualHost；证书续签后应执行 Apache 配置检查与 reload。

## 密码与数据

登录插件使用 `16 字节随机盐的十六进制:64 字节 scrypt 摘要的十六进制`，参数采用 Node `crypto.scrypt` 默认值。不要将密码、摘要、API 密钥或私人的 agent.md 提交到此仓库。模型密钥在登录后的设置页面填写；更换密钥不清除历史 Token 或网络统计，更换账户会改变查询的账户余额。

备份 `.dsh` 时将凭据和 agent.md 作为私密数据保管。部署干净实例不复制本地的 sessions、工作区存储或任务数据。设置中缺少模型密钥时，网页仍能启动，Agent 调用尚不可用。

## 小内存服务器构建

固定上游版本的 `build:lib:host` 命令显式传入 `--max-old-space-size=4096`，会覆盖 `NODE_OPTIONS` 中同名设置。堆上限不等于进程总内存，也不是构建所需物理内存的保证；设得过低会 OOM。一次完整构建在 3.5 GiB、无 Swap 的服务器上被系统终止。

当前实例采用相同源码在 WSL Linux 构建，再复制各工作区的 `lib/` 与 `apps/web/dist/`；服务器保留原生安装的 Linux 依赖和 Node addon。WSL 完整构建已通过，不能用 Windows 原生依赖替代 Linux 依赖。另一种方案是临时 Swap 加 cgroup 物理内存限制，但未验证本项目在特定较小内存上限下完成构建，不提供未经验证的最低值。

服务自启动、Apache HTTPS、页面登录、远程模型目录、个性化和壁纸预设已验证。实际模型调用需要部署者填写有效 API 密钥后验证。服务内存限制不保证任何大型 Agent 编译任务都能完成；任务超出上限可能导致服务重启。

## 沙盒与共享 Python

`dsh` 不需要 sudo 即可维护自己的 `/home/dsh/.local/python` 虚拟环境。部署环境文件由 `.profile`、`.bashrc` 和 systemd 的 PATH 配置使用；`python` 优先解析到该虚拟环境，uv 通过 `--python /home/dsh/.local/python/bin/python` 安装共享库。

不要给服务加入 `ProtectKernelTunables=yes` 或 `ProtectKernelModules=yes`：当前 Ubuntu 主机上，它们产生的 `/proc` 挂载限制会使 bubblewrap 的 `--proc /proc` 失败。保留 `NoNewPrivileges`、home 写入限制和无 sudo 账号时，bubblewrap 工作区与网络命名空间启动已验证成功。

工作区写入模式只授权当前工作区；共享 Python 环境属于工作区外目录，安装共享库仍可能触发审批。默认审批策略是 ask。更宽的应用权限不会给 Linux 用户增加 root 权限，也不会解除 systemd 的 home 写入限制。
