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

构建脚本将 workspace 依赖转换为对应官方包的版本，复制编译后的入口、前端资源和配置层，并将前端模块的注册名称替换为发行包名。发行测试实际执行模块注册入口，核对其名称与 package.json 一致。配置型 bundle 和技能包直接维护 `dist/plugins/` 目录。新增包声明 `dsh.bundle.patch`、精确的 `engines.dsh` 和索引展示信息。配套宿主使用补丁后的源码，运行时插件使用远程发行包。

## 发布索引

先提交完整运行包并创建版本标签，再生成索引指向该提交。索引文件提交在随后一个提交中：

```bash
git add plugins dist patches extras upstream.json scripts tests README.md INSTALL.md MAINTAINING.md deploy skill-sources.json package.json
git commit -m 'Publish Harness plugin bundles'
git tag plugins-v1.0.2
DSH_PLUGIN_COMMIT="$(git rev-parse HEAD)" node scripts/generate-index.mjs
node --test tests/*.test.mjs
git diff --check
git add market/index.json
git commit -m 'Publish plugin index'
git push origin main plugins-v1.0.2
```

发布新版本时同步更新包版本、安装文档和标签。保持已发布标签与提交不变。索引版本按 SemVer 从新到旧排列；适配新 Harness 时重新检查公开接口、补丁及每个插件的消费者。

## 验证

在匹配的 Harness 源码中运行受影响的布局、认证、会话删除及文件界面测试，执行官方构建，再从远程提交安装到独立 profile。索引通过官方 `parseMarketIndex` 验证。服务器验证未认证请求被拒绝、真实登录、文件保存与下载、390px 手机布局及面板拖动。切换服务前使用官方会话列表核对运行状态，任务空闲后切换，保留持久数据。
