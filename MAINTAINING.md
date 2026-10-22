# 发布与兼容性维护

`upstream.json` 固定官方 Harness 版本和提交。`plugins/` 保存功能插件源码，`patches/harness.patch` 保存宿主适配，`dist/plugins/` 保存每个发行包的完整运行文件。技能包记录在 `skill-sources.json`，各包的 `SOURCE.json` 固定上游提交；同步资源时保留许可证和相对路径。

## 构建功能插件

在干净的固定上游提交应用安装器，安装依赖并构建，然后组装发行包：

```bash
node /path/to/my-dsh-plugin/install.mjs /path/to/deepseek-harness
cd /path/to/deepseek-harness
pnpm install
pnpm run build:artifacts
cd /path/to/my-dsh-plugin
node scripts/build-release.mjs /path/to/deepseek-harness
```

单独构建工作区管理包使用 `node scripts/build-release.mjs /path/to/deepseek-harness workspace-management`。它将已编译的会话控制器、JSONL 后端及工作区界面放入该包的 `compat/`，通过 bundle 配置层替换标准 profile 的对应提供方。原始源码及修改由固定上游提交和 `patches/harness.patch` 维护。内部清单沿用官方模块名，使客户端只加载一份对应模块；用户只安装一个包。兼容提供方使用标准 `dshHomePath('sessions')` 目录；定制过后端的部署须同步检查 `managed-session-persistence-jsonl` 配置。

单独构建个性化说明包使用 `node scripts/build-release.mjs /path/to/deepseek-harness personal-instructions`，发行版本为 `1.0.5`。

构建脚本将 workspace 依赖转换为对应官方包的版本，复制编译后的入口、前端资源和配置层，并将前端模块的注册名称替换为发行包名。发行测试实际执行模块注册入口，核对其名称与 package.json 一致。配置型 bundle 和技能包直接维护 `dist/plugins/` 目录。新增包声明 `dsh.bundle.patch`、精确的 `engines.dsh` 和索引展示信息。配套宿主使用补丁后的源码，运行时插件使用远程发行包。

Harness 的服务模块使用 `peerDependencies`，由当前宿主提供同一份实例与实现。全局 profile 使用官方的 `nodeLinker: hoisted` 和 `autoInstallPeers: false` 设置。独立部署的验证必须从远程包安装后启动宿主，检查认证接口、文件操作与技能目录。

## 发布索引

先提交完整运行包并创建版本标签，再生成索引指向该提交。索引文件提交在随后一个提交中：

```bash
git add plugins dist patches extras upstream.json scripts tests README.md INSTALL.md MAINTAINING.md deploy skill-sources.json package.json
git commit -m 'Publish Harness plugin bundles'
git tag workspace-management-v1.0.5
DSH_PLUGIN_COMMIT="$(git rev-parse HEAD)" node scripts/generate-index.mjs
node --test tests/*.test.mjs
git diff --check
git add market/index.json
git commit -m 'Publish plugin index'
git push origin main workspace-management-v1.0.5
```

发布新版本时同步更新受影响包的版本、安装文档和标签。索引生成器保留已有版本的提交与时间，新版本指向新运行包提交。保持已发布标签与提交不变。索引版本按 SemVer 从新到旧排列；适配新 Harness 时重新检查公开接口、补丁及每个插件的消费者。

## 验证

在匹配的 Harness 源码中运行受影响的布局、认证、会话删除及文件界面测试，执行官方构建，再从远程提交安装到独立 profile。索引通过官方 `parseMarketIndex` 验证。服务器验证未认证请求被拒绝、真实登录、文件保存与下载、390px 手机布局及面板拖动。切换服务前使用官方会话列表核对运行状态，任务空闲后切换，保留持久数据。
