---
description: "从文件树和预览标签下载工作区文件。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-workspace-download

[English](README.md) | 中文

## 概述

直接从文件树行或已打开的预览标签下载工作区文件。读取遵守所选对话的工作区权限。现有上传仍保存为附件；本包不会将其迁入工作区。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与延后工作](#known-limitations-and-deferred-work)

<a id="use-this-package"></a>
## 使用本包

包内包含 `dsh.bundle` 覆盖配置，可安装到 profile 并在插件页面切换。迁移需要包含下述扩展插槽和 Host API 的 Harness 构建；安装压缩包不会自动修补旧版 Harness。

在插件页面的“已安装”区域切换此包；关闭后卸载它的配置层，重新开启会恢复该层。迁移时携带包内的 `cordis.patch.yml` 并调整其中的部署配置。

在已有工作区文件、对话持久化、右侧栏的 Web profile 中挂载以下条目。需要配置 archiveDirectory、confirmationBytes 和 archiveLifetimeMs。

```yaml
- name: '@deepseek-ai/dsh-experimental-workspace-download'
  config:
    archiveDirectory: /home/harness/.dsh/download-cache
    confirmationBytes: 20000000
    archiveLifetimeMs: 300000
```

现有文件树可以打开支持的预览，并在每个普通文件行提供下载操作。预览标签菜单也提供下载。关闭本包会移除这些操作，工作区文件继续保留。

文件夹操作先在服务器生成临时 ZIP。压缩后的大小超过 confirmationBytes 时，必须再次明确确认，下载接口才允许传输。随包阈值为 20,000,000 字节（20 MB）；压缩包五分钟后过期，下载结束、取消或卸载时清理。符号链接和特殊文件会跳过并提示。压缩使用有界缓冲区，每次处理一个文件夹。受 ZIP32 格式限制，单文件和完整压缩包必须小于 4 GiB，条目少于 65,535 个。压缩期间文件发生变化会报错；整个目录不是原子快照。

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现细节——点击展开</summary>

已认证的[下载接口](src/index.ts)根据对话确定工作区，通过现有工作区文件服务分块读取并流式传输。浏览器取消时终止读取，传输期间文件版本变化时拒绝继续。[客户端](src/client/view.tsx)为文件树和预览标签提供操作。临时压缩包由单一生命周期管理方持有，不提供独立的 invariant 配套模块。压缩包存储目录必须位于待压缩文件夹之外。

</details>

<a id="further-exploration"></a>
## 进一步探索

- [工作区文件](../../api/workspace-files/README.zh.md)
- [对话持久化](../../session/session-persistence/README.zh.md)

<a id="model-experience"></a>
## 模型体验

### 浏览器下载

#### 模型看到的内容

无。`workspace-download` 增加浏览器文件操作。

#### Token 影响

下载操作不自动增加提示词输入。

#### KV Cache 影响

下载保留模型请求和可复用的前缀。

## 已知限制与延后工作

<a id="known-limitations-and-deferred-work"></a>

- 可预览格式取决于现有文件预览提供方。
- 下载时文件必须仍存在且可读；交付路径不是冻结副本。
- 上传使用附件存储。任务需要工作区文件时，Agent 必须显式复制附件。

### 开发备注

<details>
<summary>维护者工作上下文——点击展开</summary>

无。

</details>
