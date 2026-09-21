---
description: "下载工作区文件，并预览 Agent 交付的文件。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-workspace-download

[English](README.md) | 中文

## 概述

直接从文件树行或已打开的预览标签下载工作区文件。通过 `present` 交付的文件会在对话中显示预览和下载操作。读取遵守所选对话的工作区权限。现有上传仍保存为附件；本包不会将其迁入工作区。

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

在已有工作区文件、对话持久化、右侧栏和交付物功能的 Web profile 中挂载以下条目。需要配置 archiveDirectory、confirmationBytes 和 archiveLifetimeMs。

```yaml
- name: '@deepseek-ai/dsh-experimental-workspace-download'
  config:
    archiveDirectory: /home/harness/.dsh/download-cache
    confirmationBytes: 20000000
    archiveLifetimeMs: 300000
```

现有文件树可以打开支持的预览，并在每个普通文件行提供下载操作。预览标签菜单也提供下载；已交付文件也会在对应对话轮次下方显示操作。移除此条目会移除这些扩展和提示词章节，不会删除文件。

文件夹操作先在服务器生成临时 ZIP。压缩后的大小超过 confirmationBytes 时，必须再次明确确认，下载接口才允许传输。随包阈值为 20,000,000 字节（20 MB）；压缩包五分钟后过期，下载结束、取消或卸载时清理。符号链接和特殊文件会跳过并提示。压缩使用有界缓冲区，每次处理一个文件夹。受 ZIP32 格式限制，单文件和完整压缩包必须小于 4 GiB，条目少于 65,535 个。压缩期间文件发生变化会报错；整个目录不是原子快照。

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现细节——点击展开</summary>

已认证的[下载接口](src/index.ts)根据对话确定工作区，通过现有工作区文件服务分块读取并流式传输。浏览器取消时终止读取，传输期间文件版本变化时拒绝继续。[客户端](src/client/view.tsx)读取持久化的交付物信息并添加界面操作。临时压缩包由单一生命周期管理方持有，不提供独立的 invariant 配套模块。压缩包存储目录必须位于待压缩文件夹之外。

</details>

<a id="further-exploration"></a>
## 进一步探索

- [工作区文件](../../api/workspace-files/README.zh.md)
- [交付物](../../deliverables/tool-present/README.zh.md)
- [对话持久化](../../session/session-persistence/README.zh.md)

<a id="model-experience"></a>
## 模型体验

### 文件交付指导

#### 模型看到的内容

本包拥有以下指导，不增加工具 schema。

##### 交付指导

```markdown
When the user requests a file, save the finished file in the workspace and call the present tool with its path. The browser shows preview and download actions for presented files. Do not use a server desktop application to deliver a file to the user.
```

#### Token 影响

存在系统提示词服务时，此稳定章节在每次请求的标准已记录组装过程中增加固定提示词内容。

#### KV Cache 影响

此章节在请求之间保持稳定。挂载或移除本包会改变提示词前缀，可能使该位置之后的复用失效。

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

交付操作通过 deliverables.file.action 插槽显示在统一文件卡片菜单内；卸载插件会移除对应操作。
